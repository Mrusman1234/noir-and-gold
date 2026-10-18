# NOIR & GOLD — Fly.io Deployment Runbook

**Model:** single Next.js service (frontend workspace) + Prisma + SQLite on a persistent Fly volume.
**No code or schema change required.** COD behavior and API contracts are unchanged.

> **Documentation only.** This runbook describes a future deployment. Do not run these commands as
> part of a readiness/audit step. Deployment is performed by the project owner after approval.

## Why Fly.io + a volume
The app uses SQLite (`provider = "sqlite"`). Serverless platforms with read-only/ephemeral
filesystems (Vercel, Netlify, Cloudflare Workers) cannot persist order writes. A Fly Machine with a
mounted volume keeps the database across restarts and deploys.

## Prerequisites
- A Fly.io account and `flyctl` installed (`fly auth login`).
- The webhook-safe region nearest Pakistan: `sin` (Singapore) or `bom` (Mumbai).

## One-time setup
```sh
# from the repository root
fly launch --no-deploy          # uses fly.toml; accept or change the app name
fly volumes create noir_data --region sin --size 1
fly secrets set ORDER_VERIFICATION_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
fly secrets set ADMIN_EMAIL="owner@your-domain.example"
fly secrets set ADMIN_PASSWORD="<a long unique passphrase; never commit it>"
fly secrets set ADMIN_NAME="Atelier Owner"   # optional display name
```
`ORDER_VERIFICATION_SECRET` must be 32 hex-encoded random bytes and must stay stable (rotating it
invalidates existing order-verification tokens). `ADMIN_EMAIL`/`ADMIN_PASSWORD` are required: if
they are unset the admin portal rejects every login. None of these values belong in source control.

## Deploy
```sh
fly deploy
```

## Verify the live site
```sh
fly open                        # opens the public URL
fly logs                        # watch for startup + errors
```
Then confirm, on the live origin:
1. `GET /`, `/shop`, a product page, `/cart`, `/checkout` return 200.
2. Place a Cash-on-Delivery order and confirm 201 + a persisted order (admin → Orders shows it).
3. The order is retrievable via its verification token, and not without it.
4. Admin login works and the order list is reachable when authenticated.
5. **Persistence:** `fly ssh console -C "ls -la /data"` shows `noir.db`; redeploy and confirm the
   order is still present.

## Operational notes
- **Single machine only.** The volume is single-attach; do not scale this service beyond one
  Machine. Admin sessions are held in memory (`admin-service.ts`), so multiple instances would also
  break admin login stickiness.
- **Seeding.** On first boot the entrypoint copies the bundled `dev.db` (the seeded 8-product
  catalog) into `/data/noir.db`. It never overwrites an existing volume.
- **Backups.** Snapshot the volume periodically: `fly ssh sftp get /data/noir.db`.
- **Catalog source (known limitation).** The Express `backend/` catalog API is not deployed. With it
  absent, the storefront serves its bundled demo catalog (the current 8 products match the database
  seed exactly). In production the fallback now logs a `[catalog]` warning instead of failing
  silently, but a database-backed catalog should replace it before relying on catalog edits.
- **Admin credentials are environment-based.** `ADMIN_EMAIL`/`ADMIN_PASSWORD` are required. Admin
  sessions are held in memory, so a restart (or scale-to-zero) signs admins out — run a single
  always-on machine if session stickiness is required. Login throttling is in-memory (per instance).

## Rollback
```sh
fly releases
fly deploy --image <previous-image-ref>
```
The volume (and its data) is not affected by a deploy or rollback.
