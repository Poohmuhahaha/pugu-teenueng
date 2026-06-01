# LifeOS API — production Dockerfile (Deno version)
# Build context: monorepo root (D:\PROJECTS\website\lifeos)
# Build: docker build -f apps/api/Dockerfile -t lifeos-api .
# Run:   docker run -e DATABASE_URL=… -e JWT_SECRET=… -p 3000:3000 lifeos-api

FROM denoland/deno:alpine AS build
WORKDIR /repo

# Copy configurations
COPY deno.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/core/package.json ./packages/core/

# Copy workspace directories
COPY apps/api ./apps/api
COPY packages/core ./packages/core
COPY scripts ./scripts

# Build local prisma client and run production build
RUN deno run -A npm:prisma generate --schema=apps/api/prisma/schema.prisma
RUN deno run -A scripts/patch-prisma.js
RUN deno task --cwd apps/api build

FROM denoland/deno:alpine AS runtime
WORKDIR /app

# Install tini for process reaping inside container
RUN apk add --no-cache tini

# Copy build output, local custom client and prisma assets
COPY --from=build /repo/apps/api/build ./build
COPY --from=build /repo/apps/api/node_modules ./node_modules
COPY --from=build /repo/apps/api/package.json ./
COPY --from=build /repo/apps/api/prisma ./prisma

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["run", "-A", "build/index.js"]
