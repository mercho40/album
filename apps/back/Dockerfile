# syntax=docker/dockerfile:1
FROM oven/bun:1.3.12 AS build
WORKDIR /app

# Install deps for the workspace
COPY package.json bun.lock turbo.json ./
COPY apps/back/package.json ./apps/back/

RUN bun install --frozen-lockfile

# Copy back source
COPY apps/back ./apps/back

# Compile
WORKDIR /app/apps/back
RUN bun build --compile --minify --target bun --outfile server src/index.ts

# Runtime image
FROM oven/bun:1.3.12-slim AS runtime
WORKDIR /app
COPY --from=build /app/apps/back/server /app/server
COPY --from=build /app/apps/back/migrations /app/migrations

EXPOSE 3000
CMD ["./server"]
