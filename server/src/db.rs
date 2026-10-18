//! PostgreSQL connection pool, runtime session guardrails, and Store persistence (SOP §3).

use std::time::Duration;

use sqlx::{postgres::PgPoolOptions, Executor, PgPool};

use crate::store::Store;

/// Initialize the PostgreSQL connection pool with SOP §3.4 session guardrails.
pub async fn connect_pool(db_url: &str) -> Result<PgPool, sqlx::Error> {
    PgPoolOptions::new()
        .max_connections(20)
        .min_connections(5)
        .acquire_timeout(Duration::from_secs(3))
        .idle_timeout(Duration::from_secs(600))
        .max_lifetime(Duration::from_secs(1800))
        .after_connect(|conn, _meta| {
            Box::pin(async move {
                conn.execute("SET statement_timeout = '5000ms'; SET lock_timeout = '3000ms';")
                    .await?;
                Ok(())
            })
        })
        .connect(db_url)
        .await
}

/// Load the persisted `Store` snapshot from PostgreSQL `app_store_state` if present.
pub async fn load_store_from_db(pool: &PgPool) -> Result<Option<Store>, String> {
    let raw_opt: Option<String> =
        sqlx::query_scalar("SELECT state_json::text FROM app_store_state WHERE id = 1")
            .fetch_optional(pool)
            .await
            .map_err(|e| e.to_string())?;

    let Some(raw) = raw_opt else {
        return Ok(None);
    };

    tokio::task::spawn_blocking(move || {
        serde_json::from_str::<Store>(&raw)
            .map(Some)
            .map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

/// Persist the `Store` state into PostgreSQL outside any `RwLock` guard (SOP §3.5 Hard Rule 10).
pub async fn sync_store_to_db(pool: &PgPool, snapshot: Store) -> Result<(), String> {
    let serialized = tokio::task::spawn_blocking(move || {
        serde_json::to_string(&snapshot)
            .map(|json_str| (json_str, snapshot))
            .map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())??;

    let (state_json, store) = serialized;

    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    sqlx::query(
        "INSERT INTO app_store_state (id, state_json, updated_at)
         VALUES (1, $1::jsonb, NOW())
         ON CONFLICT (id) DO UPDATE
         SET state_json = EXCLUDED.state_json, updated_at = NOW()",
    )
    .bind(&state_json)
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    for user in &store.users {
        sqlx::query(
            "INSERT INTO users (id, name, email, password_hash)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (id) DO UPDATE
             SET name = EXCLUDED.name, email = EXCLUDED.email, password_hash = EXCLUDED.password_hash",
        )
        .bind(user.id)
        .bind(&user.name)
        .bind(&user.email)
        .bind(&user.password_hash)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    }

    for ws in &store.workspaces {
        sqlx::query(
            "INSERT INTO workspaces (id, name, slug)
             VALUES ($1, $2, $3)
             ON CONFLICT (id) DO UPDATE
             SET name = EXCLUDED.name, slug = EXCLUDED.slug",
        )
        .bind(ws.id)
        .bind(&ws.name)
        .bind(&ws.slug)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    }

    for (user_id, workspace_id, role) in &store.memberships {
        sqlx::query(
            "INSERT INTO memberships (user_id, workspace_id, role)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id, workspace_id) DO UPDATE
             SET role = EXCLUDED.role",
        )
        .bind(user_id)
        .bind(workspace_id)
        .bind(role)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    }

    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(())
}
