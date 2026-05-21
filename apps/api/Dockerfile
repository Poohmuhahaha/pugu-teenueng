# LifeOS API — production Dockerfile
# Build context: monorepo root (D:\PROJECTS\website\lifeos)
# Build: docker build -f apps/api/Dockerfile -t lifeos-api .
# Run:   docker run -e DATABASE_URL=… -e JWT_SECRET=… -p 3000:3000 lifeos-api

FROM node:20-alpine AS deps
WORKDIR /repo
RUN corepack enable
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/core/package.json ./packages/core/
RUN pnpm install --frozen-lockfile=false

FROM node:20-alpine AS build
WORKDIR /repo
RUN corepack enable
COPY --from=deps /repo /repo
COPY apps/api ./apps/api
COPY packages/core ./packages/core
RUN pnpm --filter @lifeos/api exec prisma generate
RUN pnpm --filter @lifeos/api build

FROM node:20-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache tini
COPY --from=build /repo/apps/api/build ./build
COPY --from=build /repo/apps/api/node_modules ./node_modules
COPY --from=build /repo/apps/api/package.json ./
COPY --from=build /repo/apps/api/prisma ./prisma
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
ENTRYPOINT ["/sbin/tini","--"]
CMD ["node","build"]
