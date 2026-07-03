# Multi-stage Dockerfile for the Elysia + Bun back app.
#
# Build context: repository root.
# haloy: buildea el stage final `back` de este Dockerfile (ver haloy.yaml).

# ─────────────────────────────────────────────
# Stage 1: install workspace deps
# ─────────────────────────────────────────────
FROM oven/bun:1 AS base

WORKDIR /app

# Manifests (root + workspaces) para resolución reproducible
COPY package.json bun.lock turbo.json ./
COPY apps/back/package.json ./apps/back/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN bun install

# ─────────────────────────────────────────────
# Stage 2: build binario del back
# ─────────────────────────────────────────────
FROM base AS back-build

COPY apps/back ./apps/back

ENV NODE_ENV=production

RUN cd apps/back && bun build \
  --compile \
  --minify-whitespace \
  --minify-syntax \
  --target bun \
  --outfile server \
  src/index.ts

# ─────────────────────────────────────────────
# Stage 3: runtime mínimo
# ─────────────────────────────────────────────
FROM debian:bookworm-slim AS back

RUN apt-get update && apt-get install -y --no-install-recommends \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --shell /bin/false appuser
USER appuser

WORKDIR /app
COPY --from=back-build --chown=appuser /app/apps/back/server ./server
COPY --from=back-build --chown=appuser /app/apps/back/migrations ./migrations

ENV NODE_ENV=production
EXPOSE 3000

CMD ["./server"]
