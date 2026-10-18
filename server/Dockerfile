# Pugu API — Rust (Axum + SQLx) Optimized Multi-Stage Dockerfile (SOP §5.2).
# Build context: ./server
FROM lukemathwalker/cargo-chef:latest-rust-1.80-alpine AS chef
WORKDIR /app
RUN apk add --no-cache musl-dev

FROM chef AS planner
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder
COPY --from=planner /app/recipe.json recipe.json
# Build & cache dependencies layer
RUN cargo chef cook --release --target x86_64-unknown-linux-musl --recipe-path recipe.json

# Build application layer
COPY Cargo.toml Cargo.lock ./
COPY migrations ./migrations
COPY src ./src
RUN cargo build --release --target x86_64-unknown-linux-musl --bin pugu-server

# Minimal runtime stage (SOP §5.2, §5.4)
FROM alpine:3.20 AS runtime
RUN apk add --no-cache ca-certificates tzdata python3
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
    && mkdir -p /data && chown -R appuser:appgroup /app /data
USER appuser

COPY --from=builder /app/target/x86_64-unknown-linux-musl/release/pugu-server /app/pugu-server

ENV BIND_ADDR=0.0.0.0
ENV PORT=8788
EXPOSE 8788
CMD ["/app/pugu-server"]
