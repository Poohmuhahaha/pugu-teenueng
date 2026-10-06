//! HTTP handlers.

use std::collections::HashMap;
use std::sync::Arc;

use axum::{
    extract::{Path, Query, State},
    http::{header, HeaderMap, HeaderValue, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use serde::Deserialize;
use serde_json::{json, Map, Value};
use tokio::sync::RwLock;

use crate::error::{ApiError, ApiResult};
use crate::model::*;
use crate::store::Store;

pub type AppState = Arc<RwLock<Store>>;

const COOKIE_NAME: &str = "life_session";

fn cookie_token(headers: &HeaderMap) -> Option<String> {
    let raw = headers.get(header::COOKIE)?.to_str().ok()?;
    for part in raw.split(';') {
        let part = part.trim();
        if let Some(value) = part.strip_prefix(&format!("{COOKIE_NAME}=")) {
            return Some(value.to_string());
        }
    }
    None
}

async fn require_user(state: &AppState, headers: &HeaderMap) -> ApiResult<User> {
    let token = cookie_token(headers).ok_or_else(|| ApiError::unauthorized("Not signed in"))?;
    let store = state.read().await;
    store
        .user_for_token(&token)
        .cloned()
        .ok_or_else(|| ApiError::unauthorized("Session expired"))
}

/// Like `require_user`, but also returns the session token (for active workspace).
async fn require_session(state: &AppState, headers: &HeaderMap) -> ApiResult<(User, String)> {
    let token = cookie_token(headers).ok_or_else(|| ApiError::unauthorized("Not signed in"))?;
    let store = state.read().await;
    let user = store
        .user_for_token(&token)
        .cloned()
        .ok_or_else(|| ApiError::unauthorized("Session expired"))?;
    Ok((user, token))
}

// ---- health -----------------------------------------------------------

pub async fn health(State(state): State<AppState>) -> impl IntoResponse {
    let store = state.read().await;
    Json(json!({
        "ok": true,
        "service": "pugu-api",
        "version": env!("CARGO_PKG_VERSION"),
        "contentTypes": store.content_types().len(),
        "entries": store.entries.len(),
        "ts": chrono::Utc::now().timestamp_millis(),
    }))
}

// ---- auth -------------------------------------------------------------

#[derive(Deserialize)]
pub struct LoginBody {
    pub email: String,
    pub password: String,
}

pub async fn login(State(state): State<AppState>, Json(body): Json<LoginBody>) -> ApiResult<Response> {
    let mut store = state.write().await;
    let token = store.login(&body.email, &body.password)?;
    let user = store.user_for_token(&token).cloned().unwrap();
    let cookie = format!(
        "{COOKIE_NAME}={token}; Path=/; HttpOnly; SameSite=Lax; Max-Age={}",
        60 * 60 * 24 * 30
    );
    let mut res = Json(json!({ "id": user.id, "name": user.name, "email": user.email })).into_response();
    res.headers_mut().insert(header::SET_COOKIE, HeaderValue::from_str(&cookie).unwrap());
    Ok(res)
}

pub async fn logout(State(state): State<AppState>, headers: HeaderMap) -> Response {
    if let Some(token) = cookie_token(&headers) {
        state.write().await.logout(&token);
    }
    let clear = format!("{COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
    let mut res = StatusCode::NO_CONTENT.into_response();
    res.headers_mut().insert(header::SET_COOKIE, HeaderValue::from_str(&clear).unwrap());
    res
}

pub async fn me(State(state): State<AppState>, headers: HeaderMap) -> ApiResult<Json<Value>> {
    let (user, token) = require_session(&state, &headers).await?;
    let store = state.read().await;
    let memberships = store.memberships_for(user.id);
    let active = store.active_workspace_id(&token, user.id);
    Ok(Json(json!({
        "actor": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "workspaceId": active,
        },
        "memberships": memberships,
    })))
}

pub async fn switch_workspace(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<i64>,
) -> ApiResult<Json<Value>> {
    let (user, token) = require_session(&state, &headers).await?;
    state.write().await.switch_workspace(&token, user.id, id)?;
    Ok(Json(json!({ "data": { "workspaceId": id } })))
}

// ---- content types ----------------------------------------------------

pub async fn list_content_types(State(state): State<AppState>, headers: HeaderMap) -> ApiResult<Json<Value>> {
    let (user, token) = require_session(&state, &headers).await?;
    let store = state.read().await;
    let ws = store.active_workspace_id(&token, user.id);
    Ok(Json(json!({ "data": store.content_types_in(ws) })))
}

#[derive(Deserialize)]
pub struct CreateContentTypeBody {
    pub slug: String,
    pub name: String,
    #[serde(default)]
    pub kind: Option<String>,
    #[serde(default)]
    pub schema: Option<Schema>,
}

pub async fn create_content_type(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(body): Json<CreateContentTypeBody>,
) -> ApiResult<Json<Value>> {
    let (user, token) = require_session(&state, &headers).await?;
    let schema = body.schema.unwrap_or(Schema { fields: vec![] });
    let kind = body.kind.unwrap_or_else(|| "document".into());
    let mut store = state.write().await;
    let ws = store.active_workspace_id(&token, user.id);
    let ct = store.create_content_type(ws, &body.slug, &body.name, &kind, schema)?;
    Ok(Json(json!({ "data": ct })))
}

#[derive(Deserialize)]
pub struct UpdateContentTypeBody {
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub kind: Option<String>,
    #[serde(default)]
    pub schema: Option<Schema>,
}

pub async fn update_content_type(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<i64>,
    Json(body): Json<UpdateContentTypeBody>,
) -> ApiResult<Json<Value>> {
    require_user(&state, &headers).await?;
    let mut store = state.write().await;
    let ct = store.update_content_type(id, body.name, body.kind, body.schema)?;
    Ok(Json(json!({ "data": ct })))
}

pub async fn delete_content_type(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<i64>,
) -> ApiResult<StatusCode> {
    require_user(&state, &headers).await?;
    state.write().await.delete_content_type(id)?;
    Ok(StatusCode::NO_CONTENT)
}

// ---- entries ----------------------------------------------------------

fn pagination(params: &HashMap<String, String>, key: &str, default: usize) -> usize {
    params
        .get(key)
        .and_then(|v| v.parse::<usize>().ok())
        .unwrap_or(default)
}

pub async fn list_entries(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(slug): Path<String>,
    Query(params): Query<HashMap<String, String>>,
) -> ApiResult<Json<Value>> {
    let (user, token) = require_session(&state, &headers).await?;
    let store = state.read().await;
    let ws = store.active_workspace_id(&token, user.id);
    let ct = store
        .content_type_by_slug(&slug, ws)
        .ok_or_else(|| ApiError::not_found("Content type not found"))?;
    let all = store.entries_for(ct.id);
    let total = all.len();
    let page = pagination(&params, "pagination[page]", 1).max(1);
    let page_size = pagination(&params, "pagination[pageSize]", 25).clamp(1, 200);
    let start = (page - 1) * page_size;
    let views: Vec<EntryView> = all
        .into_iter()
        .skip(start)
        .take(page_size)
        .map(EntryView::from)
        .collect();
    Ok(Json(json!({
        "data": views,
        "meta": { "total": total, "page": page, "pageSize": page_size },
    })))
}

pub async fn create_entry(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(slug): Path<String>,
    Json(body): Json<Map<String, Value>>,
) -> ApiResult<Json<Value>> {
    let (user, token) = require_session(&state, &headers).await?;
    let mut store = state.write().await;
    let ws = store.active_workspace_id(&token, user.id);
    let ct_id = store
        .content_type_by_slug(&slug, ws)
        .map(|t| t.id)
        .ok_or_else(|| ApiError::not_found("Content type not found"))?;
    let view = store.create_entry(ct_id, body);
    store.rebuild_backrefs(view.id);
    Ok(Json(json!({ "data": view })))
}

pub async fn get_entry(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path((slug, id)): Path<(String, i64)>,
) -> ApiResult<Json<Value>> {
    let (user, token) = require_session(&state, &headers).await?;
    let store = state.read().await;
    let ws = store.active_workspace_id(&token, user.id);
    let ct_id = store
        .content_type_by_slug(&slug, ws)
        .map(|t| t.id)
        .ok_or_else(|| ApiError::not_found("Content type not found"))?;
    let entry = store.entry(ct_id, id).ok_or_else(|| ApiError::not_found("Entry not found"))?;
    Ok(Json(json!({ "data": EntryView::from(entry) })))
}

pub async fn update_entry(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path((slug, id)): Path<(String, i64)>,
    Json(body): Json<Map<String, Value>>,
) -> ApiResult<Json<Value>> {
    let (user, token) = require_session(&state, &headers).await?;
    let mut store = state.write().await;
    let ws = store.active_workspace_id(&token, user.id);
    let ct_id = store
        .content_type_by_slug(&slug, ws)
        .map(|t| t.id)
        .ok_or_else(|| ApiError::not_found("Content type not found"))?;
    let view = store.update_entry(ct_id, id, body)?;
    store.rebuild_backrefs(view.id);
    Ok(Json(json!({ "data": view })))
}

pub async fn delete_entry(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path((slug, id)): Path<(String, i64)>,
) -> ApiResult<StatusCode> {
    let (user, token) = require_session(&state, &headers).await?;
    let mut store = state.write().await;
    let ws = store.active_workspace_id(&token, user.id);
    let ct_id = store
        .content_type_by_slug(&slug, ws)
        .map(|t| t.id)
        .ok_or_else(|| ApiError::not_found("Content type not found"))?;
    store.delete_entry(ct_id, id)?;
    store.rebuild_all_backrefs(ws);
    Ok(StatusCode::NO_CONTENT)
}

/// GET /v1/backrefs?to=&from=&target= — omit all params for the whole workspace.
pub async fn backrefs(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(params): Query<HashMap<String, String>>,
) -> ApiResult<Json<Value>> {
    let (user, token) = require_session(&state, &headers).await?;
    let to = params.get("to").and_then(|v| v.parse::<i64>().ok());
    let from = params.get("from").and_then(|v| v.parse::<i64>().ok());
    let target = params.get("target").map(|s| s.as_str());
    let store = state.read().await;
    let ws = store.active_workspace_id(&token, user.id);
    Ok(Json(json!({ "data": store.backrefs_query(ws, to, from, target) })))
}

/// POST /v1/backrefs/rebuild — re-scan every entry in the active workspace.
pub async fn rebuild_backrefs(State(state): State<AppState>, headers: HeaderMap) -> ApiResult<Json<Value>> {
    let (user, token) = require_session(&state, &headers).await?;
    let mut store = state.write().await;
    let ws = store.active_workspace_id(&token, user.id);
    let (entries_scanned, resolved, unresolved) = store.rebuild_all_backrefs(ws);
    Ok(Json(json!({
        "ok": true,
        "entriesScanned": entries_scanned,
        "resolved": resolved,
        "unresolved": unresolved,
    })))
}
