# LifeOS Web — production Dockerfile (Deno version)
# Build context: monorepo root (D:\PROJECTS\website\lifeos)
# Build: docker build -f apps/web/Dockerfile -t lifeos-web .
# Run:   docker run -p 3001:3001 lifeos-web

FROM denoland/deno:alpine AS build
WORKDIR /repo

# Copy configurations
COPY deno.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/core/package.json ./packages/core/
COPY packages/sdk/package.json ./packages/sdk/

# Copy workspace directories
COPY apps/web ./apps/web
COPY packages/core ./packages/core
COPY packages/sdk ./packages/sdk

# Run production build
RUN deno task --cwd apps/web build

FROM denoland/deno:alpine AS runtime
WORKDIR /app

# Install tini for process reaping inside container
RUN apk add --no-cache tini

# Copy build output and dependencies
COPY --from=build /repo/apps/web/build ./build
COPY --from=build /repo/apps/web/node_modules ./node_modules
COPY --from=build /repo/apps/web/package.json ./

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["run", "-A", "build/index.js"]
