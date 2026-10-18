//! HTTP handlers (SOP §2 Cookie Auth, §3.5 Hard Rule 10 Async Discipline, §0.2 Rule 2 Zero Unwrap).

use std::collections::HashMap;
use std::sync::Arc;

use axum::{
    extract::{Path, Query, State},
    http::{header, HeaderMap, HeaderValue, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use axum_extra::extract::cookie::{Cookie, SameSite};
use serde::Deserialize;
use serde_json::{json, Map, Value};
use tokio::sync::RwLock;

use crate::error::{ApiError, ApiResult};
use crate::model::*;
use crate::store::{Store, SESSION_TTL_DAYS};

#[derive(Clone)]
pub struct AppContext {
    pub store: Arc<RwLock<Store>>,
    pub db: Option<sqlx::PgPool>,
}

pub type AppState = Arc<AppContext>;

const COOKIE_NAME: &str = "life_session";
const SESSION_MAX_AGE_SECS: i64 = SESSION_TTL_DAYS * 24 * 60 * 60;

async fn persist_after_mutation(state: &AppState) {
    if let Some(ref pool) = state.db {
        let snapshot = state.store.read().await.clone();
        if let Err(err) = crate::db::sync_store_to_db(pool, snapshot).await {
            tracing::warn!("failed to sync store to PostgreSQL: {err}");
        }
    }
}

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

/// `Secure` is on by default (SOP §2.2); `COOKIE_SECURE=0|false|no`
/// opts out for plain-HTTP local testing.
fn cookie_secure() -> bool {
    !matches!(
        std::env::var("COOKIE_SECURE").map(|v| v.trim().to_ascii_lowercase()),
        Ok(v) if v == "0" || v == "false" || v == "no"
    )
}

/// Build an HttpOnly + Secure + SameSite=Lax session cookie per SOP §2.2.
pub fn create_session_cookie<'a>(name: &'a str, value: &'a str, max_age_secs: i64) -> Cookie<'a> {
    Cookie::build((name, value))
        .path("/")
        .http_only(true)
        .secure(cookie_secure())
        .same_site(SameSite::Lax)
        .max_age(time::Duration::seconds(max_age_secs))
        .build()
}

fn set_cookie(res: &mut Response, cookie: Cookie<'_>) -> ApiResult<()> {
    let header_val = HeaderValue::from_str(&cookie.to_string())
        .map_err(|_| ApiError::internal("Invalid session cookie header value"))?;
    res.headers_mut().insert(header::SET_COOKIE, header_val);
    Ok(())
}

async fn require_user(state: &AppState, headers: &HeaderMap) -> ApiResult<User> {
    let token = cookie_token(headers).ok_or_else(|| ApiError::unauthorized("Not signed in"))?;
    let store = state.store.read().await;
    store
        .user_for_token(&token)
        .cloned()
        .ok_or_else(|| ApiError::unauthorized("Session expired"))
}

/// Like `require_user`, but also returns the session token (for active workspace).
async fn require_session(state: &AppState, headers: &HeaderMap) -> ApiResult<(User, String)> {
    let token = cookie_token(headers).ok_or_else(|| ApiError::unauthorized("Not signed in"))?;
    let store = state.store.read().await;
    let user = store
        .user_for_token(&token)
        .cloned()
        .ok_or_else(|| ApiError::unauthorized("Session expired"))?;
    Ok((user, token))
}

// ---- health -----------------------------------------------------------

pub async fn health(State(state): State<AppState>) -> impl IntoResponse {
    let (content_types_len, entries_len) = {
        let store = state.store.read().await;
        (store.content_types().len(), store.entries.len())
    };
    Json(json!({
        "ok": true,
        "service": "pugu-api",
        "version": env!("CARGO_PKG_VERSION"),
        "contentTypes": content_types_len,
        "entries": entries_len,
        "ts": chrono::Utc::now().timestamp_millis(),
    }))
}

// ---- auth -------------------------------------------------------------

#[derive(Deserialize)]
pub struct LoginBody {
    pub email: String,
    pub password: String,
}

pub async fn login(
    State(state): State<AppState>,
    Json(body): Json<LoginBody>,
) -> ApiResult<Response> {
    // Hard Rule 10: read user hash under a brief read lock, then drop the lock before Argon2
    let user = {
        let store = state.store.read().await;
        store
            .find_user_by_email(&body.email)
            .ok_or_else(|| ApiError::unauthorized("Invalid email or password"))?
    };

    let password = body.password;
    let password_hash = user.password_hash.clone();
    let is_valid = tokio::task::spawn_blocking(move || {
        crate::store::verify_password(&password, &password_hash)
    })
    .await
    .map_err(|_| ApiError::internal("Password verification task failed"))?;

    if !is_valid {
        return Err(ApiError::unauthorized("Invalid email or password"));
    }

    let (token, authed_user) = {
        let mut store = state.store.write().await;
        store.create_session_for_user(user.id)?
    };
    persist_after_mutation(&state).await;

    let mut res = Json(json!({
        "id": authed_user.id,
        "name": authed_user.name,
        "email": authed_user.email,
    }))
    .into_response();
    let cookie = create_session_cookie(COOKIE_NAME, &token, SESSION_MAX_AGE_SECS);
    set_cookie(&mut res, cookie)?;
    Ok(res)
}

#[derive(Deserialize)]
pub struct RegisterBody {
    pub name: String,
    pub email: String,
    pub password: String,
}

pub async fn register(
    State(state): State<AppState>,
    Json(body): Json<RegisterBody>,
) -> ApiResult<Response> {
    if body.email.trim().is_empty() || body.password.is_empty() {
        return Err(ApiError::bad_request("Email and password are required"));
    }
    {
        let store = state.store.read().await;
        if store.find_user_by_email(&body.email).is_some() {
            return Err(ApiError::conflict("Email is already registered"));
        }
    }

    // Hard Rule 10: hash password on blocking thread pool without holding RwLock
    let raw_password = body.password;
    let password_hash =
        tokio::task::spawn_blocking(move || crate::store::hash_password(&raw_password))
            .await
            .map_err(|_| ApiError::internal("Password hashing task failed"))?;

    let (token, user) = {
        let mut store = state.store.write().await;
        store.register_user_with_hash(&body.name, &body.email, password_hash)?
    };
    persist_after_mutation(&state).await;

    let mut res =
        Json(json!({ "id": user.id, "name": user.name, "email": user.email })).into_response();
    let cookie = create_session_cookie(COOKIE_NAME, &token, SESSION_MAX_AGE_SECS);
    set_cookie(&mut res, cookie)?;
    Ok(res)
}

/// Silently rotates the session (single-flight refresh, SOP §2.3):
/// revokes the presented cookie's token and re-issues a fresh HttpOnly
/// cookie. Dead sessions get 401 so the SPA drops local state.
pub async fn refresh(State(state): State<AppState>, headers: HeaderMap) -> ApiResult<Response> {
    let token = cookie_token(&headers).ok_or_else(|| ApiError::unauthorized("Not signed in"))?;
    let new_token = {
        let mut store = state.store.write().await;
        store.rotate_session(&token)?
    };
    persist_after_mutation(&state).await;

    let mut res = StatusCode::NO_CONTENT.into_response();
    let cookie = create_session_cookie(COOKIE_NAME, &new_token, SESSION_MAX_AGE_SECS);
    set_cookie(&mut res, cookie)?;
    Ok(res)
}

pub async fn logout(State(state): State<AppState>, headers: HeaderMap) -> ApiResult<Response> {
    if let Some(token) = cookie_token(&headers) {
        state.store.write().await.logout(&token);
        persist_after_mutation(&state).await;
    }
    let mut res = StatusCode::NO_CONTENT.into_response();
    let cookie = create_session_cookie(COOKIE_NAME, "", 0);
    set_cookie(&mut res, cookie)?;
    Ok(res)
}

pub async fn me(State(state): State<AppState>, headers: HeaderMap) -> ApiResult<Json<MeDto>> {
    let (user, token) = require_session(&state, &headers).await?;
    let store = state.store.read().await;
    let memberships = store.memberships_for(user.id);
    let active = store.active_workspace_id(&token, user.id);
    Ok(Json(MeDto {
        actor: ActorDto {
            id: user.id,
            name: user.name,
            email: user.email,
            workspace_id: Some(active),
        },
        memberships,
    }))
}

pub async fn switch_workspace(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<i64>,
) -> ApiResult<Json<Value>> {
    let (user, token) = require_session(&state, &headers).await?;
    state
        .store
        .write()
        .await
        .switch_workspace(&token, user.id, id)?;
    persist_after_mutation(&state).await;
    Ok(Json(json!({ "data": { "workspaceId": id } })))
}

// ---- content types ----------------------------------------------------

pub async fn list_content_types(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> ApiResult<Json<Value>> {
    let (user, token) = require_session(&state, &headers).await?;
    let store = state.store.read().await;
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
    let schema = body.schema.unwrap_or_default();
    let kind = body.kind.unwrap_or_else(|| "document".into());
    let ct = {
        let mut store = state.store.write().await;
        let ws = store.active_workspace_id(&token, user.id);
        store.create_content_type(ws, &body.slug, &body.name, &kind, schema)?
    };
    persist_after_mutation(&state).await;
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
    let ct = {
        let mut store = state.store.write().await;
        store.update_content_type(id, body.name, body.kind, body.schema)?
    };
    persist_after_mutation(&state).await;
    Ok(Json(json!({ "data": ct })))
}

pub async fn delete_content_type(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<i64>,
) -> ApiResult<StatusCode> {
    require_user(&state, &headers).await?;
    state.store.write().await.delete_content_type(id)?;
    persist_after_mutation(&state).await;
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
    let store = state.store.read().await;
    let ws = store.active_workspace_id(&token, user.id);
    let ct = store
        .content_type_by_slug(&slug, ws)
        .ok_or_else(|| ApiError::not_found("Content type not found"))?;
    let all = store.entries_for(ct.id);
    let total = all.len();
    let page = pagination(&params, "pagination[page]", 1).max(1);
    let page_size = pagination(&params, "pagination[pageSize]", 25).clamp(1, 2000);
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
    let view = {
        let mut store = state.store.write().await;
        let ws = store.active_workspace_id(&token, user.id);
        let ct_id = store
            .content_type_by_slug(&slug, ws)
            .map(|t| t.id)
            .ok_or_else(|| ApiError::not_found("Content type not found"))?;
        let view = store.create_entry(ct_id, body);
        store.rebuild_backrefs(view.id);
        view
    };
    persist_after_mutation(&state).await;
    Ok(Json(json!({ "data": view })))
}

pub async fn get_entry(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path((slug, id)): Path<(String, i64)>,
) -> ApiResult<Json<Value>> {
    let (user, token) = require_session(&state, &headers).await?;
    let store = state.store.read().await;
    let ws = store.active_workspace_id(&token, user.id);
    let ct_id = store
        .content_type_by_slug(&slug, ws)
        .map(|t| t.id)
        .ok_or_else(|| ApiError::not_found("Content type not found"))?;
    let entry = store
        .entry(ct_id, id)
        .ok_or_else(|| ApiError::not_found("Entry not found"))?;
    Ok(Json(json!({ "data": EntryView::from(entry) })))
}

pub async fn update_entry(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path((slug, id)): Path<(String, i64)>,
    Json(body): Json<Map<String, Value>>,
) -> ApiResult<Json<Value>> {
    let (user, token) = require_session(&state, &headers).await?;
    let view = {
        let mut store = state.store.write().await;
        let ws = store.active_workspace_id(&token, user.id);
        let ct_id = store
            .content_type_by_slug(&slug, ws)
            .map(|t| t.id)
            .ok_or_else(|| ApiError::not_found("Content type not found"))?;
        let view = store.update_entry(ct_id, id, body)?;
        store.rebuild_backrefs(view.id);
        view
    };
    persist_after_mutation(&state).await;
    Ok(Json(json!({ "data": view })))
}

pub async fn delete_entry(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path((slug, id)): Path<(String, i64)>,
) -> ApiResult<StatusCode> {
    let (user, token) = require_session(&state, &headers).await?;
    {
        let mut store = state.store.write().await;
        let ws = store.active_workspace_id(&token, user.id);
        let ct_id = store
            .content_type_by_slug(&slug, ws)
            .map(|t| t.id)
            .ok_or_else(|| ApiError::not_found("Content type not found"))?;
        store.delete_entry(ct_id, id)?;
        store.rebuild_all_backrefs(ws);
    }
    persist_after_mutation(&state).await;
    Ok(StatusCode::NO_CONTENT)
}

#[derive(Deserialize, Default)]
pub struct BatchUpdateItem {
    pub id: i64,
    pub data: Map<String, Value>,
}

#[derive(Deserialize, Default)]
pub struct BatchEntriesBody {
    #[serde(default)]
    pub create: Vec<Map<String, Value>>,
    #[serde(default)]
    pub update: Vec<BatchUpdateItem>,
    #[serde(default)]
    pub delete: Vec<i64>,
}

/// POST /v1/{slug}/batch — atomic multi-row create/update/delete for spreadsheets.
pub async fn batch_entries(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(slug): Path<String>,
    Json(body): Json<BatchEntriesBody>,
) -> ApiResult<Json<Value>> {
    let (user, token) = require_session(&state, &headers).await?;
    let views = {
        let mut store = state.store.write().await;
        let ws = store.active_workspace_id(&token, user.id);
        let ct_id = store
            .content_type_by_slug(&slug, ws)
            .map(|t| t.id)
            .ok_or_else(|| ApiError::not_found("Content type not found"))?;
        let updates: Vec<(i64, Map<String, Value>)> =
            body.update.into_iter().map(|u| (u.id, u.data)).collect();
        store.batch_entries(ct_id, body.create, updates, body.delete)?
    };
    persist_after_mutation(&state).await;
    Ok(Json(json!({ "data": views })))
}

fn decode_base64(input: &str) -> Result<Vec<u8>, String> {
    let mut out = Vec::with_capacity(input.len() * 3 / 4);
    let mut buf = 0u32;
    let mut bits = 0u8;
    for b in input.bytes() {
        let val = match b {
            b'A'..=b'Z' => b - b'A',
            b'a'..=b'z' => b - b'a' + 26,
            b'0'..=b'9' => b - b'0' + 52,
            b'+' => 62,
            b'/' => 63,
            b'=' | b'\r' | b'\n' | b' ' | b'\t' => continue,
            _ => return Err(format!("invalid base64 byte: {b}")),
        };
        buf = (buf << 6) | (val as u32);
        bits += 6;
        if bits >= 8 {
            bits -= 8;
            out.push(((buf >> bits) & 0xFF) as u8);
        }
    }
    Ok(out)
}

#[derive(Deserialize)]
pub struct ImportSheetBody {
    /// "ods" or "csv"
    pub format: String,
    #[serde(default)]
    pub content: Option<String>,
    #[serde(default)]
    pub base64: Option<String>,
    #[serde(default = "default_true")]
    pub replace: bool,
}

fn default_true() -> bool {
    true
}

/// POST /v1/{slug}/import — import `.ods` or `.csv` into a spreadsheet.
pub async fn import_sheet(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(slug): Path<String>,
    Json(body): Json<ImportSheetBody>,
) -> ApiResult<Json<Value>> {
    let (user, token) = require_session(&state, &headers).await?;
    let fmt = body.format.to_ascii_lowercase();
    let content_opt = body.content;
    let base64_opt = body.base64;
    let replace = body.replace;

    // Hard Rule 10: offload base64 decoding, ODS zip extraction, and XML/CSV parsing to spawn_blocking
    type ParsedSheetPayload = (Vec<Map<String, Value>>, Option<SheetMeta>);
    let (rows, meta) = tokio::task::spawn_blocking(move || -> ApiResult<ParsedSheetPayload> {
        if fmt == "csv" {
            let raw_text = if let Some(c) = content_opt {
                c
            } else if let Some(b64) = base64_opt {
                let bytes = decode_base64(&b64).map_err(ApiError::bad_request)?;
                String::from_utf8(bytes).map_err(|e| ApiError::bad_request(e.to_string()))?
            } else {
                return Err(ApiError::bad_request("Missing CSV content"));
            };
            Ok((crate::ods::parse_csv(&raw_text), None))
        } else if fmt == "ods" {
            let xml = if let Some(b64) = base64_opt {
                let bytes = decode_base64(&b64).map_err(ApiError::bad_request)?;
                crate::ods::extract_ods_content_xml(&bytes).map_err(ApiError::bad_request)?
            } else if let Some(c) = content_opt {
                c
            } else {
                return Err(ApiError::bad_request(
                    "Missing ODS content or base64 payload",
                ));
            };
            let mut sheets = crate::ods::parse_ods_content_xml(&xml);
            if sheets.is_empty() {
                return Err(ApiError::bad_request(
                    "No <table:table> found in ODS document",
                ));
            }
            let first = sheets.remove(0);
            Ok((first.rows, Some(first.meta)))
        } else {
            Err(ApiError::bad_request(
                "Unsupported format; expected 'ods' or 'csv'",
            ))
        }
    })
    .await
    .map_err(|_| ApiError::internal("Spreadsheet import worker failed"))??;

    let (views, updated_ct) = {
        let mut store = state.store.write().await;
        let ws = store.active_workspace_id(&token, user.id);
        let ct_id = store
            .content_type_by_slug(&slug, ws)
            .map(|t| t.id)
            .ok_or_else(|| ApiError::not_found("Content type not found"))?;
        let views = store.import_sheet_rows(ct_id, rows, meta, replace)?;
        let updated_ct = store.content_type_by_slug(&slug, ws).cloned();
        (views, updated_ct)
    };
    persist_after_mutation(&state).await;

    Ok(Json(json!({
        "data": views,
        "contentType": updated_ct,
    })))
}

/// GET /v1/{slug}/export?format=ods|csv — export a spreadsheet as `.ods` or `.csv`.
pub async fn export_sheet(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(slug): Path<String>,
    Query(params): Query<HashMap<String, String>>,
) -> ApiResult<Response> {
    let (user, token) = require_session(&state, &headers).await?;
    let (ct_slug, ct_name, ct_meta, columns, rows) = {
        let store = state.store.read().await;
        let ws = store.active_workspace_id(&token, user.id);
        let ct = store
            .content_type_by_slug(&slug, ws)
            .ok_or_else(|| ApiError::not_found("Content type not found"))?;
        let entries = store.entries_for(ct.id);
        let rows: Vec<Map<String, Value>> = entries.iter().map(|e| e.data.clone()).collect();

        // Collect ordered column keys: schema fields first, then coordinate letters a..z
        let mut columns: Vec<String> = ct.schema.fields.iter().map(|f| f.name.clone()).collect();
        for r in &rows {
            for k in r.keys() {
                if !k.starts_with('_') && !columns.contains(k) {
                    columns.push(k.clone());
                }
            }
        }
        if columns.is_empty() {
            columns = vec!["a".into(), "b".into(), "c".into(), "d".into()];
        }
        (
            ct.slug.clone(),
            ct.name.clone(),
            ct.schema.meta.clone(),
            columns,
            rows,
        )
    };

    let fmt = params
        .get("format")
        .map(|s| s.to_ascii_lowercase())
        .unwrap_or_else(|| "ods".into());

    if fmt == "csv" {
        let csv_str = tokio::task::spawn_blocking(move || crate::ods::export_csv(&columns, &rows))
            .await
            .map_err(|_| ApiError::internal("CSV export worker failed"))?;
        let disposition = format!("attachment; filename=\"{ct_slug}.csv\"");
        let mut res = csv_str.into_response();
        res.headers_mut().insert(
            header::CONTENT_TYPE,
            HeaderValue::from_static("text/csv; charset=utf-8"),
        );
        res.headers_mut().insert(
            header::CONTENT_DISPOSITION,
            HeaderValue::from_str(&disposition)
                .unwrap_or_else(|_| HeaderValue::from_static("attachment")),
        );
        Ok(res)
    } else {
        let ods_bytes = tokio::task::spawn_blocking(move || {
            crate::ods::build_ods_zip(&ct_name, &columns, &rows, ct_meta.as_ref())
        })
        .await
        .map_err(|_| ApiError::internal("ODS export worker failed"))?;
        let disposition = format!("attachment; filename=\"{ct_slug}.ods\"");
        let mut res = ods_bytes.into_response();
        res.headers_mut().insert(
            header::CONTENT_TYPE,
            HeaderValue::from_static("application/vnd.oasis.opendocument.spreadsheet"),
        );
        res.headers_mut().insert(
            header::CONTENT_DISPOSITION,
            HeaderValue::from_str(&disposition)
                .unwrap_or_else(|_| HeaderValue::from_static("attachment")),
        );
        Ok(res)
    }
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
    let store = state.store.read().await;
    let ws = store.active_workspace_id(&token, user.id);
    Ok(Json(
        json!({ "data": store.backrefs_query(ws, to, from, target) }),
    ))
}

/// POST /v1/backrefs/rebuild — re-scan every entry in the active workspace.
pub async fn rebuild_backrefs(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> ApiResult<Json<Value>> {
    let (user, token) = require_session(&state, &headers).await?;
    let (entries_scanned, resolved, unresolved) = {
        let mut store = state.store.write().await;
        let ws = store.active_workspace_id(&token, user.id);
        store.rebuild_all_backrefs(ws)
    };
    persist_after_mutation(&state).await;
    Ok(Json(json!({
        "ok": true,
        "entriesScanned": entries_scanned,
        "resolved": resolved,
        "unresolved": unresolved,
    })))
}
