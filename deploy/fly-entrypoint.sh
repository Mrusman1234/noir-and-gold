#!/bin/sh
# NOIR & GOLD container entrypoint.
# Bootstraps the SQLite database on the persistent volume, then starts Next.js.
set -eu

DB_PATH="${DB_PATH:-/data/noir.db}"
SEED_DB="/app/seed/dev.db"

mkdir -p "$(dirname "$DB_PATH")"

# Copy the seeded catalog into the volume only on first boot, so data persists
# across restarts and redeploys.
if [ ! -f "$DB_PATH" ]; then
  echo "Initialising database from seed into $DB_PATH"
  cp "$SEED_DB" "$DB_PATH"
else
  echo "Using existing database at $DB_PATH"
fi

export DATABASE_URL="file:${DB_PATH}"
export NODE_ENV=production

if [ -z "${ORDER_VERIFICATION_SECRET:-}" ]; then
  echo "WARNING: ORDER_VERIFICATION_SECRET is not set. Checkout will fail until it is configured (fly secrets set ORDER_VERIFICATION_SECRET=...)." >&2
fi

if [ -z "${ADMIN_EMAIL:-}" ] || [ -z "${ADMIN_PASSWORD:-}" ]; then
  echo "WARNING: ADMIN_EMAIL/ADMIN_PASSWORD are not set. The admin portal will reject every login until they are configured (fly secrets set ADMIN_EMAIL=... ADMIN_PASSWORD=...)." >&2
fi

cd /app
exec npm run start --workspace=frontend -- -H 0.0.0.0 -p "${PORT:-3000}"
