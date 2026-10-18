//! Pugu REST backend — Axum + SQLx PostgreSQL + MiMalloc (Master Engineering SOP §3, §5).

#[global_allocator]
static GLOBAL: mimalloc::MiMalloc = mimalloc::MiMalloc;

mod db;
mod error;
mod handlers;
mod model;
mod ods;
mod store;

use std::sync::Arc;

use axum::{
    extract::State,
    http::StatusCode,
    routing::{get, patch, post},
    Router,
};
use tower_http::trace::TraceLayer;
use tracing_subscriber::EnvFilter;

use handlers::{AppContext, AppState};
use store::Store;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| "info,tower_http=info".into()),
        )
        .init();

    let run_migrations_only = std::env::args().any(|arg| arg == "--run-migrations-only");
    let db_url = std::env::var("DATABASE_URL")
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    // One-off migration mode (SOP §3.3 Hard Rule 3):
    // Triggered ONLY by the `migration` container in Docker Compose before backend rollout.
    if run_migrations_only {
        let Some(ref url) = db_url else {
            return Err("DATABASE_URL must be set for --run-migrations-only".into());
        };
        let pool = db::connect_pool(url).await?;
        sqlx::migrate!("./migrations").run(&pool).await?;
        println!("Migrations executed successfully. Exiting one-off container.");
        return Ok(());
    }

    let db_pool = match db_url {
        Some(ref url) => {
            let pool = db::connect_pool(url).await?;
            tracing::info!("connected to PostgreSQL pool with runtime query guardrails");
            Some(pool)
        }
        None => None,
    };

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

    // Load initial state from PostgreSQL when configured, otherwise JSON snapshot or seed.
    let mut store = if let Some(ref pool) = db_pool {
        match db::load_store_from_db(pool).await {
            Ok(Some(loaded)) => {
                tracing::info!("loaded store state from PostgreSQL");
                loaded
            }
            Ok(None) => {
                let initial = if seed { Store::seed() } else { Store::fresh() };
                if let Err(err) = db::sync_store_to_db(pool, initial.clone()).await {
                    tracing::warn!("initial PostgreSQL state sync failed: {err}");
                }
                initial
            }
            Err(err) => {
                tracing::warn!("could not load state from PostgreSQL ({err}); starting fresh");
                if seed {
                    Store::seed()
                } else {
                    Store::fresh()
                }
            }
        }
    } else {
        match data_path.as_ref().filter(|p| p.exists()) {
            Some(path) => {
                let path_clone = path.clone();
                let loaded = tokio::task::spawn_blocking(move || {
                    std::fs::File::open(&path_clone)
                        .map_err(|e| e.to_string())
                        .and_then(|f| {
                            serde_json::from_reader::<_, Store>(f).map_err(|e| e.to_string())
                        })
                })
                .await
                .map_err(|e| e.to_string())
                .and_then(|r| r);

                match loaded {
                    Ok(snapshot) => {
                        tracing::info!("loaded snapshot {}", path.display());
                        snapshot
                    }
                    Err(err) => {
                        tracing::warn!("cannot load {}: {err}; starting fresh", path.display());
                        if seed {
                            Store::seed()
                        } else {
                            Store::fresh()
                        }
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

    let state: AppState = Arc::new(AppContext {
        store: Arc::new(tokio::sync::RwLock::new(store)),
        db: db_pool,
    });

    // Periodic JSON snapshot (DATA_FILE=/path/to/store.json) — Hard Rule 10: clone and drop lock before I/O.
    if let Some(path) = data_path.clone() {
        let state = state.clone();
        let display_path = path.display().to_string();
        tokio::spawn(async move {
            let mut ticker = tokio::time::interval(std::time::Duration::from_secs(10));
            loop {
                ticker.tick().await;
                let snapshot = state.store.read().await.clone();
                if let Err(err) = Store::save_to_async(snapshot, path.clone()).await {
                    tracing::warn!("snapshot failed: {err}");
                }
            }
        });
        tracing::info!("snapshotting to {display_path}");
    }

    let api = Router::new()
        .route("/health", get(handlers::health))
        .route("/auth/login", post(handlers::login))
        .route("/auth/register", post(handlers::register))
        .route("/auth/refresh", post(handlers::refresh))
        .route("/auth/logout", post(handlers::logout))
        .route("/v1/me", get(handlers::me))
        .route(
            "/v1/workspaces/{id}/switch",
            post(handlers::switch_workspace),
        )
        .route(
            "/v1/content-types",
            get(handlers::list_content_types).post(handlers::create_content_type),
        )
        .route(
            "/v1/content-types/{id}",
            patch(handlers::update_content_type).delete(handlers::delete_content_type),
        )
        .route("/v1/backrefs", get(handlers::backrefs))
        .route("/v1/backrefs/rebuild", post(handlers::rebuild_backrefs))
        .route(
            "/v1/{slug}",
            get(handlers::list_entries).post(handlers::create_entry),
        )
        .route("/v1/{slug}/batch", post(handlers::batch_entries))
        .route("/v1/{slug}/import", post(handlers::import_sheet))
        .route("/v1/{slug}/export", get(handlers::export_sheet))
        .route(
            "/v1/{slug}/{id}",
            get(handlers::get_entry)
                .patch(handlers::update_entry)
                .delete(handlers::delete_entry),
        );

    // Same-origin serving (Caddy / Vite proxy) — no CORS layer: the browser
    // SPA never calls this API cross-origin (SOP §1.2 & §2).
    let app = Router::new()
        .route("/healthz", get(health_check))
        .nest("/api", api)
        .layer(TraceLayer::new_for_http())
        .with_state(state.clone());

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    tracing::info!("pugu-api listening on http://{addr}");
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    // Final snapshot on shutdown (SIGTERM/SIGINT) so the last writes survive.
    if let Some(path) = data_path {
        let snapshot = state.store.read().await.clone();
        match Store::save_to_async(snapshot, path.clone()).await {
            Ok(()) => tracing::info!("final snapshot saved to {}", path.display()),
            Err(err) => tracing::warn!("final snapshot failed: {err}"),
        }
    }

    Ok(())
}

/// Deep healthcheck (SOP §3.4): borrow a connection and ping PostgreSQL when configured.
async fn health_check(State(state): State<AppState>) -> Result<&'static str, StatusCode> {
    if let Some(ref pool) = state.db {
        sqlx::query("SELECT 1")
            .execute(pool)
            .await
            .map_err(|_| StatusCode::SERVICE_UNAVAILABLE)?;
    }
    Ok("OK")
}

/// Resolves on Ctrl-C or SIGTERM (docker stop / systemd), so in-flight
/// requests finish and the final snapshot is written.
async fn shutdown_signal() {
    let ctrl_c = async {
        let _ = tokio::signal::ctrl_c().await;
    };
    #[cfg(unix)]
    let terminate = async {
        match tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate()) {
            Ok(mut sig) => {
                sig.recv().await;
            }
            Err(_) => std::future::pending::<()>().await,
        }
    };
    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }
    tracing::info!("shutdown signal received");
}
