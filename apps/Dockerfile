# Pugu Web — Vue 3 + Vite + Caddy 2 (SOP §4 & §5).
# Build context: repo root. Extra context: huuk (components/huuk).
FROM oven/bun:1-debian AS build
WORKDIR /app

COPY . .
COPY --from=huuk ui /components/huuk/ui
COPY --from=huuk composables /components/huuk/composables
COPY --from=huuk core /components/huuk/core
COPY --from=huuk layout /components/huuk/layout
COPY --from=huuk live /components/huuk/live
COPY --from=huuk overlays /components/huuk/overlays
COPY --from=huuk tables /components/huuk/tables
COPY --from=huuk editor /components/huuk/editor
COPY --from=huuk mock /components/huuk/mock
COPY --from=huuk index.ts /components/huuk/index.ts
COPY --from=huuk style.css /components/huuk/style.css

RUN bun install --frozen-lockfile
RUN bun run --filter @pugu/vue build

FROM caddy:2-alpine AS runtime
RUN mkdir -p /var/log/caddy /srv/dist
COPY --from=build /app/apps/dist /srv/dist
COPY apps/Caddyfile /etc/caddy/Caddyfile
EXPOSE 80
