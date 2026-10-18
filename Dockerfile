# NOIR & GOLD — production image (Next.js frontend + Prisma + SQLite).
# SQLite requires a persistent volume mounted at /data (see fly.toml).
FROM node:24-bookworm-slim

ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# 1) Install dependencies (workspace-aware) for layer caching.
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/package.json
COPY backend/package.json ./backend/package.json
RUN npm ci

# 2) Copy the rest of the source (see .dockerignore).
COPY . .

# 3) Generate the Prisma client from the backend schema (frontend imports @prisma/client).
RUN npx prisma generate --schema backend/prisma/schema.prisma

# 4) Build the storefront. DATABASE_URL points at the bundled seed DB so any
#    build-time reads succeed; runtime uses the persistent volume instead.
ENV DATABASE_URL="file:/app/backend/prisma/dev.db"
RUN npm run build --workspace=frontend

# 5) Keep an untouched seed DB to bootstrap the volume on first boot.
RUN mkdir -p /app/seed && cp /app/backend/prisma/dev.db /app/seed/dev.db

EXPOSE 3000
CMD ["sh", "/app/deploy/fly-entrypoint.sh"]
