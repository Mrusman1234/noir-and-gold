# Step 15 — Final Production-Readiness Audit & Pre-Deployment Hardening

**Project:** NOIR & GOLD — Pakistan-focused COD clothing store (Next.js 16, TypeScript, Prisma, SQLite)
**Scope:** Code readiness and hardening only. **No deployment was performed.**
**Date:** October 2026

## 1. Overall production-readiness status

**READY WITH DOCUMENTED LIMITATIONS.** The critical security defect (hardcoded, client-exposed admin
credentials) is fixed and covered by new tests. Build, typecheck, and all 57 tests pass. Two
documented, non-blocking limitations remain: the storefront catalog's demo fallback (catalog edits
are not database-backed) and in-memory admin sessions/throttling (single-instance only). Full-project
ESLint also reports pre-existing errors that do not block the build.

## 2. Files inspected and modified

**Inspected (key):** `Dockerfile`, `.dockerignore`, `fly.toml`, `deploy/fly-entrypoint.sh`,
`docs/deployment-fly.md`, `backend/prisma/schema.prisma`, `backend/prisma/dev.db`,
`frontend/package.json`, `frontend/next.config.ts`, `frontend/src/lib/order-service.ts`,
`frontend/src/lib/prisma.ts`, `frontend/src/lib/admin-service.ts`, `frontend/src/lib/admin-auth-guard.ts`,
`frontend/src/app/api/v1/admin/auth/*`, `frontend/src/app/api/v1/orders/*`,
`frontend/src/lib/product-service.ts`, `frontend/src/lib/api-client.ts`, `frontend/tests/*`.

**Modified this step:**

| File | Change |
|---|---|
| `frontend/src/lib/admin-service.ts` | Replaced hardcoded admin/staff accounts with env-based `ADMIN_EMAIL`/`ADMIN_PASSWORD`/`ADMIN_NAME`; fails closed when unset. |
| `frontend/src/app/api/v1/admin/auth/login/route.ts` | Added login throttling (429 after repeated failures); clears on success. |
| `frontend/src/lib/login-rate-limit.ts` | **New** — minimal in-memory login throttle. |
| `frontend/src/app/admin/login/page.tsx` | Removed the "demo credentials" quick-fill buttons that shipped working admin credentials to the browser; generic email placeholder. |
| `frontend/src/components/admin/AdminSidebar.tsx` | Removed the real admin email as a display fallback. |
| `frontend/src/lib/product-service.ts` | Demo-catalog fallback now logs a `[catalog]` warning in production instead of failing silently. |
| `frontend/test-admin-e2e.mjs` | Reads credentials from env; no hardcoded values; skips authenticated checks when unset. |
| `frontend/tests/admin-auth-unconfigured.test.ts` | **New** — asserts fail-closed auth. |
| `frontend/tests/admin-auth-configured.test.ts` | **New** — asserts env auth success/failure + throttle. |
| `frontend/.env.example` | Documents required env vars (placeholders only). |
| `deploy/fly-entrypoint.sh` | Warns when admin env is unset. |
| `fly.toml` | Added an HTTP health check. |
| `docs/deployment-fly.md` | Documentation-only framing, required secrets, known limitations. |

No schema, database, or hosting resource was changed.

## 3. Defects discovered and fixes applied

| # | Severity | Defect | Status |
|---|---|---|---|
| D1 | **Critical** | Admin credentials were hardcoded in `admin-service.ts` **and** exposed to the browser by demo quick-fill buttons on `/admin/login` — anyone could sign in as admin. | **Fixed** — env-based credentials, fail closed; UI removed. |
| D2 | High | No protection against repeated login attempts (credential brute force). | **Fixed** — in-memory throttle, 429 after 10 failures/15 min per IP+email. |
| D3 | Medium | Admin email leaked as a UI fallback / login placeholder. | **Fixed** — generic placeholders. |
| D4 | Medium | Storefront silently served the bundled demo catalog in production. | **Mitigated** — now logs a production warning; DB-backed catalog recommended (needs approval). |
| D5 | Low | Admin sessions and throttle state are in-memory; lost on restart / not shared across instances. | **Documented** — run a single instance. |
| D6 | Low | `npm run lint` fails project-wide (pre-existing). | **Documented** — non-blocking; see §5. |

## 4. Security findings and remaining risks

**Verified good:** session cookie is `httpOnly`, `secure` in production, `SameSite=Lax`, 24h expiry;
passwords use `scrypt` + `timingSafeEqual`; order-verification tokens are HMAC-SHA256 over
`v1:<orderId>:<idempotencyKey>` with a 64-hex secret validated at startup (checkout fails closed if
missing); token comparison is length-guarded and timing-safe; customer order access requires the
verification token (`getVerifiedOrder` returns null otherwise); all `/api/v1/admin/*` routes require
`requireAdminAuth` (cookie or bearer); error responses return generic messages without customer data;
checkout prices are computed server-side from persisted data.

**Remaining risks (documented):**
1. **Catalog is not database-backed** (D4) — storefront and admin product CRUD use the in-memory demo
   catalog; only orders/inventory use the DB. With the shipped 8-product catalog the two match, but
   catalog edits do not persist.
2. **Single-instance assumptions** (D5) — in-memory sessions and throttling mean scaling beyond one
   instance would break admin login stickiness and share no throttle state.
3. **`any` types / React-19 lint debt** (D6) — code-quality only.

No unresolved **critical** security issue remains that would allow unauthorized admin access.

## 5. Build, typecheck, lint, and test results

| Check | Command | Result |
|---|---|---|
| Typecheck | `npm run typecheck` (`tsc --noEmit`) | **PASS** (exit 0) |
| Production build | `npm run build` (`next build`) | **PASS** (exit 0) |
| Tests | `tsx --test tests/*.test.ts` (7 files) | **57 passed / 0 failed** |
| Lint (changed files) | `eslint <changed files>` | **PASS** (exit 0) |
| Lint (project) | `npm run lint` (`eslint`) | **FAIL** — 17 pre-existing errors + 1 warning |

Test breakdown: admin-auth-unconfigured 1/1, admin-auth-configured 2/2, inventory-reservation 7/7,
order-service 23/23, payment-attempt 9/9, payment-domain 6/6, refund-ledger 9/9.

Lint failures are all in files **not modified** in this step: 12 × `@typescript-eslint/no-explicit-any`
(`AdminDashboardView`, `CategoriesManagerView`, `InventoryManagerView`, `ProductsManagerView`,
`api-client.ts`, `product-service.ts`) and 5 × `react-hooks/set-state-in-effect`
(`AdminDashboardView`, `AdminLayoutClient`, `CategoriesManagerView`, `InventoryManagerView`,
`ProductListingView`). They do not block `next build`. Fixing the effect rules would require
behaviour-affecting React refactors, deferred to avoid regressions.

**Docker:** not built — Docker is not installed in this environment (environment limitation).

## 6. Database and inventory safety findings

- **Schema unchanged.** No migrations, `db push`, seed, or reset was run.
- **Cancellation restock** is a single, atomic, audited operation; the reservation service is
  non-mutating (Step 14.11), so no double-decrement or double-restock.
- `dev.db` lacks the payment/reservation tables; that is **not** required for COD — the cancellation
  coordination is capability-guarded and inert without them.
- All tests use **isolated temporary SQLite copies**; the live `dev.db` was not mutated (verified
  order count remained 0 after a prior smoke run).

## 7. Required environment variables (no values)

| Variable | Scope | Purpose |
|---|---|---|
| `DATABASE_URL` | server-only | SQLite file path, e.g. `file:/data/noir.db`. Also needed at build time for static generation. |
| `ORDER_VERIFICATION_SECRET` | server-only | 32 random bytes, hex-encoded (64 chars). Stable; rotating invalidates outstanding order tokens. |
| `ADMIN_EMAIL` | server-only | Admin login email. |
| `ADMIN_PASSWORD` | server-only | Admin login password (long, unique). |
| `ADMIN_NAME` | server-only | Optional admin display name. |
| `NEXT_PUBLIC_API_URL` | client-visible | Base URL of the optional Express catalog API (`http://localhost:5000` default). |

`ADMIN_EMAIL`/`ADMIN_PASSWORD` are **required**; if unset the portal rejects all logins (fail closed).

## 8. Production database and persistence requirements

- Single SQLite file; requires a **persistent, single-attach writable filesystem**. Serverless
  read-only filesystems cannot persist order writes.
- The container entrypoint copies the bundled seed DB to `/data/noir.db` **only if it does not already
  exist**, so redeploys preserve data.
- **SQLite limitation:** single writer, single machine; no horizontal scaling without migrating to a
  server database (Postgres) — a schema/provider change requiring approval.

## 9. Hosting compatibility considerations

- **Works:** a Node host with a persistent disk/volume (Fly Machines + volume, Render disk, a VPS).
  Node 20.9+ (Next 16); the provided image uses `node:24-bookworm-slim`.
- **Does not work:** Vercel/Netlify/Cloudflare Workers/Sites — ephemeral/read-only filesystem and no
  long-running Node server for this Next SSR + SQLite architecture.
- No hosting resource was created and no deployment command was run.

## 10. Remaining blockers before deployment

1. **Deployment itself was not performed** (out of scope for this step; owner will deploy).
2. **Catalog data source (D4).** For reliable catalog management, replace the demo fallback with a
   database-backed storefront/admin reader. This is a functional change spanning several components
   and should be approved before implementing.
3. **Lint (D6).** Project-wide ESLint is red (pre-existing). Non-blocking.
4. **Single-instance (D5).** Keep one instance while sessions/throttle are in memory.

## 11. Deployer checklist

- [ ] Set `ORDER_VERIFICATION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (and `ADMIN_NAME`) as secrets.
- [ ] Point `DATABASE_URL` at a persistent path (e.g. `file:/data/noir.db`) and mount the volume.
- [ ] Run `npm run build` then `next start` (or the provided image) on a Node host with a real disk.
- [ ] Confirm `GET /`, `/shop`, a product page, `/cart`, `/checkout` return 200.
- [ ] Confirm unauthenticated `/api/v1/admin/*` returns 401 and a wrong password returns 401.
- [ ] Sign in as admin with the configured credentials; confirm the dashboard loads.
- [ ] Place one clearly-labelled COD test order; confirm server-side total, single stock decrement,
      idempotent replay, and token-gated retrieval.
- [ ] Restart the service; confirm the test order and stock persist (volume in use).
- [ ] Cancel the test order; confirm stock is restored exactly once.
- [ ] Do **not** use demo credentials or place real customer orders.

## Final status

**READY WITH DOCUMENTED LIMITATIONS** — critical security issue resolved; build/typecheck/tests pass;
non-blocking limitations (catalog data source, in-memory sessions, pre-existing lint) documented with
recommended resolutions.
