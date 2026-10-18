# Contributing to Pugu

Thank you for contributing to **Pugu**! This project is open-source software licensed under the **MIT License** and follows our Master Engineering SOP for Vue 3, TanStack Query, Caddy, and Rust (Axum + SQLx).

## Prerequisites

- **Rust** 1.85+ (`rustfmt`, `clippy`)
- **Bun** 1.2+
- **Docker & Docker Compose** (for PostgreSQL 16 and Caddy 2)
- **just** (optional command runner)

## 8-Step Feature Lifecycle (SOP §0.2)

1. Write/update SQL migration in `server/migrations/` (obeying Expand-and-Contract).
2. Define Rust DTO struct in `server/src/model.rs` with `#[derive(Serialize, Deserialize, TS)]` and `#[ts(export, export_to = "../../apps/src/api/types/")]`.
3. Implement Axum handler in `server/src/handlers.rs` (zero `.unwrap()` / `.expect()`, propagating errors into `ApiError`).
4. Run `cargo test --manifest-path server/Cargo.toml` to export `.ts` bindings into `apps/src/api/types/`.
5. Define the matching Zod schema in `apps/src/api/schemas/index.ts` with `AssertEqual<ZodType, TsRsType>`.
6. Create the TanStack Query hook in `apps/src/api/queries/index.ts` using `customFetch`.
7. Build the Vue 3 component (`<script setup lang="ts">`) handling all 4 states: `isPending`, `isError`, `isEmpty`, and `data`.
8. Run `just verify` and fix all warnings/errors before opening a pull request.

## License

By contributing to Pugu, you agree that your contributions will be licensed under the [MIT License](LICENSE).
