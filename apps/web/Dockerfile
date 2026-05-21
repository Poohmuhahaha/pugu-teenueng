FROM node:20-alpine AS deps
WORKDIR /repo
RUN corepack enable
COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/core/package.json ./packages/core/
COPY packages/sdk/package.json ./packages/sdk/
RUN pnpm install --frozen-lockfile=false

FROM node:20-alpine AS build
WORKDIR /repo
RUN corepack enable
COPY --from=deps /repo /repo
COPY apps/web ./apps/web
COPY packages/core ./packages/core
COPY packages/sdk ./packages/sdk
RUN pnpm --filter @lifeos/web build

FROM node:20-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache tini
COPY --from=build /repo/apps/web/build ./build
COPY --from=build /repo/apps/web/node_modules ./node_modules
COPY --from=build /repo/apps/web/package.json ./
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001
ENTRYPOINT ["/sbin/tini","--"]
CMD ["node","build"]
