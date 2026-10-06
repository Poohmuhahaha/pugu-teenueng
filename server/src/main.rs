//! Pugu REST backend — Axum. huuk-style stack (Rust + in-memory/JSON store).

mod error;
mod handlers;
mod model;
mod store;

use std::sync::Arc;

use axum::{
    routing::{get, patch, post},
    Router,
};
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing_subscriber::EnvFilter;

use handlers::AppState;
use store::Store;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| "info,tower_http=info".into()),
        )
        .init();

    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.trim().parse().ok())
        .unwrap_or(8788);
    let bind = std::env::var("BIND_ADDR").unwrap_or_else(|_| "127.0.0.1".into());
    let addr = format!("{bind}:{port}");

    let seed = std::env::var("SEED").map(|v| v != "0").unwrap_or(true);
    let data_path: Option<std::path::PathBuf> = match std::env::var("DATA_FILE") {
        Ok(raw) if raw.trim().is_empty() => None,
        Ok(raw) => Some(std::path::PathBuf::from(raw.trim())),
        Err(_) => None,
    };

    // Load the JSON snapshot when present, otherwise seed/fresh.
    let mut store = match data_path.as_ref().filter(|p| p.exists()) {
        Some(path) => {
            let loaded = std::fs::File::open(path)
                .map_err(|e| e.to_string())
                .and_then(|f| serde_json::from_reader::<_, Store>(f).map_err(|e| e.to_string()));
            match loaded {
                Ok(snapshot) => {
                    tracing::info!("loaded snapshot {}", path.display());
                    snapshot
                }
                Err(err) => {
                    tracing::warn!("cannot load {}: {err}; starting fresh", path.display());
                    if seed { Store::seed() } else { Store::fresh() }
                }
            }
        }
        None => {
            if seed {
                tracing::info!("seeded demo workspace: pooh@questpage.app / changeme123");
                Store::seed()
            } else {
                Store::fresh()
            }
        }
    };

    // Migrate older snapshots: make sure the demo workspaces + backrefs exist.
    if seed {
        store.ensure_demo_workspace();
        let ws_ids: Vec<i64> = store.workspaces.iter().map(|w| w.id).collect();
        for id in ws_ids {
            store.rebuild_all_backrefs(id);
        }
    }

    let state: AppState = Arc::new(tokio::sync::RwLock::new(store));

    // Periodic JSON snapshot (DATA_FILE=/path/to/store.json).
    if let Some(path) = data_path {
        let state = state.clone();
        let display_path = path.display().to_string();
        tokio::spawn(async move {
            let mut ticker = tokio::time::interval(std::time::Duration::from_secs(10));
            loop {
                ticker.tick().await;
                let snapshot = state.read().await;
                if let Err(err) = snapshot.save_to(&path) {
                    tracing::warn!("snapshot failed: {err}");
                }
            }
        });
        tracing::info!("snapshotting to {display_path}");
    }

    let api = Router::new()
        .route("/health", get(handlers::health))
        .route("/auth/login", post(handlers::login))
        .route("/auth/logout", post(handlers::logout))
        .route("/v1/me", get(handlers::me))
        .route("/v1/workspaces/{id}/switch", post(handlers::switch_workspace))
        .route("/v1/content-types", get(handlers::list_content_types).post(handlers::create_content_type))
        .route(
            "/v1/content-types/{id}",
            patch(handlers::update_content_type).delete(handlers::delete_content_type),
        )
        .route("/v1/backrefs", get(handlers::backrefs))
        .route("/v1/backrefs/rebuild", post(handlers::rebuild_backrefs))
        .route("/v1/{slug}", get(handlers::list_entries).post(handlers::create_entry))
        .route(
            "/v1/{slug}/{id}",
            get(handlers::get_entry).patch(handlers::update_entry).delete(handlers::delete_entry),
        );

    let app = Router::new()
        .nest("/api", api)
        .layer(TraceLayer::new_for_http())
        .layer(CorsLayer::permissive())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .unwrap_or_else(|e| {
            eprintln!("cannot bind {addr}: {e}");
            std::process::exit(2);
        });
    tracing::info!("pugu-api listening on http://{addr}");
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .unwrap();
}

async fn shutdown_signal() {
    let _ = tokio::signal::ctrl_c().await;
}
