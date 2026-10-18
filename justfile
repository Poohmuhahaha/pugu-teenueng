# Root justfile — Single source of truth for commands (SOP §10.3)
set dotenv-load := true

# CI-safe checks: Rust server formatting, clippy (-D warnings), unit tests, and ts-rs contract drift check.
verify-ci:
    cargo fmt --manifest-path server/Cargo.toml --all -- --check
    cargo clippy --manifest-path server/Cargo.toml --all-targets -- -D warnings
    cargo test --manifest-path server/Cargo.toml
    git diff --exit-code apps/src/api/types/

# 1. Run full verification before any commit or PR completion (SOP §10.3)
verify: verify-ci
    bun install --frozen-lockfile
    bun run typecheck
    bun run test
    bun run build

# 2. Regenerate TypeScript types from Rust DTOs (SOP §6.2 & §10.3)
gen-types:
    cargo test --manifest-path server/Cargo.toml export_bindings

# 3. Zero-downtime production rollout (SOP §8.1 & §10.3)
deploy:
    docker compose -f deploy/docker-compose.prod.yml run --rm migration
    docker compose -f deploy/docker-compose.prod.yml up -d --scale backend=2 --no-recreate backend
    sleep 5
    docker compose -f deploy/docker-compose.prod.yml up -d --scale backend=1 backend
    docker compose -f deploy/docker-compose.prod.yml exec caddy caddy reload --config /etc/caddy/Caddyfile
    curl -f http://localhost:${WEB_PORT:-3001}/healthz

# Rust tests only.
test-server:
    cargo test --manifest-path server/Cargo.toml

# Production builds (release server binary).
build:
    cargo build --release --manifest-path server/Cargo.toml
