# Step 14.11 — Inventory Model Implementation (Option B) — Handover Report

**Project:** NOIR & GOLD
**Phase:** Step 14.11 (implementation, approved by project lead)
**Model:** Option B — order-owned decrement/restore; reservation is a non-mutating hold tracker
**Reference:** `docs/payment-inventory-architecture-decision.md`
**Date:** October 2026

---

## 1. Objective

Implement the approved Option B inventory model: exactly one stock decrement (checkout) and exactly
one stock restore (cancellation); reservations must never independently move stock; admin
cancellation must close ACTIVE reservations inside its existing transaction without a second restock.
Preserve checkout pricing, order creation, COD behavior, API contracts, and the database schema.

## 2. Files Inspected

- `frontend/src/lib/inventory-reservation-service.ts`
- `frontend/src/lib/admin-order-update-service.ts`
- `frontend/src/app/api/v1/admin/orders/[orderReference]/route.ts`
- `frontend/src/lib/order-service.ts`, `admin-order-read-service.ts`, `order-status-transitions.ts`
- `frontend/tests/inventory-reservation-service.test.ts`, `order-service.test.ts`
- `backend/prisma/schema.prisma`, and the live `backend/prisma/dev.db` schema (read-only)

**Caller audit (scope item 4):** the reservation service is imported **only** by its test.
`updatePersistentAdminOrder` is imported by the admin PATCH route and by `order-service.test.ts`.
No other caller exists (verified by project-wide grep excluding `node_modules`/`.next`).

## 3. Files Modified

| File | Change |
|---|---|
| `frontend/src/lib/inventory-reservation-service.ts` | Removed stock decrement on create and stock restore on release/expire; removed inventory-audit writes; reservations are now state-only. |
| `frontend/src/lib/admin-order-update-service.ts` | On cancellation, closes `ACTIVE` reservations to `RELEASED` inside the same `prisma.$transaction`, guarded by a memoized `isReservationTableAvailable()` probe. |
| `frontend/tests/inventory-reservation-service.test.ts` | Rewritten to Option B semantics + new regression tests. |
| `frontend/tests/order-service.test.ts` | Provisions the `InventoryReservation` table in the isolated test DB, cleans reservations in `resetCatalog()`, and adds a cancellation-coordination subtest. |

No other files changed. No schema, migration, or database write was performed.

## 4. Implementation Summary

- **Reservation service:** create validates order eligibility (non-COD, PENDING/CONFIRMED/PROCESSING,
  `paymentStatus=PENDING`), variant existence/`isActive`, and idempotency/active-conflict; it **no
  longer** checks or decrements stock, and writes no `InventoryAuditLog`. Transitions update status,
  clear `activeReservationKey`, and set `consumedAt`/`releasedAt`; they **never** move stock.
- **Admin cancellation:** the existing order-owned restock (conditional `increment` + inventory audit)
  remains the single restore. An `updateMany` closes any `ACTIVE` reservation for the order
  (`status=RELEASED`, `activeReservationKey=null`, `releasedAt`) with **no** stock increment, inside
  the same transaction.
- **Deploy-safety guard:** because the `InventoryReservation` table is absent from the current
  database (see §6), the coordination step runs only when the table exists. This prevents an
  optional, unwired ledger from breaking cancellation. The probe is a single memoized
  `sqlite_master` lookup; on a non-SQLite provider it assumes present.

## 5. Tests and Exact Results

| Suite | Result |
|---|---|
| `inventory-reservation-service.test.ts` | **7/7 pass** (was 6; rewritten + 2 new) |
| `order-service.test.ts` (incl. new cancellation-reservation test) | **23/23 pass** (was 22) |
| `payment-domain.test.ts` | **6/6 pass** |
| `payment-attempt-service.test.ts` | **9/9 pass** |
| `refund-ledger-service.test.ts` | **9/9 pass** |
| `npm run typecheck` (`tsc --noEmit`) | **pass** (exit 0) |
| `eslint` (4 changed files) | **pass** (exit 0) |
| `npm run build` (`next build`) | **pass** (exit 0) |

New regression coverage: reservation creation does not move stock / write an inventory audit;
consume/release/expiry change state only; reservation creation never double-decrements stock already
decremented by checkout; cancellation restores stock exactly once **and** closes the ACTIVE
reservation with no second restock; reservation-transition rollback safety; concurrent duplicate
reservation requests collapse to one row; existing duplicate-cancellation and concurrent-cancellation
tests still green.

(Prisma logs `prisma:error` lines during the forced-failure rollback tests; these are intentional
trigger aborts and the corresponding tests assert the rolled-back state.)

## 6. Database / Schema Impact

**None.** No migration, `db push`, seed, or reset was run.

**Important discovery:** the live `backend/prisma/dev.db` contains only
`Category, InventoryAuditLog, Order, OrderAuditLog, OrderItem, Product, ProductImage,
ProductVariant, ShippingZone`. It does **not** contain `InventoryReservation`, `PaymentAttempt`,
`PaymentEvent`, or `Refund`, even though those models exist in `schema.prisma`. These tables were
never migrated. This is why the cancellation coordination is capability-guarded (§4).

## 7. Behavior Unchanged

- Public checkout pricing, order creation, idempotency, and COD behavior: unchanged.
- Admin order PATCH contract and status-transition/audit rules: unchanged.
- Cancellation restock remains a single, atomic, audited operation.
- No API contract or schema change.

## 8. Remaining Risks

1. **P0 — unprovisioned payment/reservation tables.** `InventoryReservation` (and the payment
   tables) do not exist in the current database. Until provisioned, the cancellation coordination is
   inert. **This is the deployment blocker** (see §9). Provisioning requires an approved migration,
   which is outside this phase's scope.
2. **P1 — no DB uniqueness for one ACTIVE reservation per `(orderId, productVariantId)`.** Only the
   `activeReservationKey` unique index exists; cross-key concurrency relies on an application
   `findFirst` guard. Unchanged from the ADR; out of scope here.
3. **P1 — cross-service atomicity.** Reservation/payment services still own separate transactions;
   Option C (shared transaction) remains a future hardening step.
4. **Probe portability.** The capability probe uses `sqlite_master`; it degrades to "assume present"
   on other providers.

## 9. Recommended Next Step / Deployment Blocker

**Blocker:** to activate reservation coordination and (later) online payments, the
`InventoryReservation`/`PaymentAttempt`/`PaymentEvent`/`Refund` tables must exist in the deployment
database. This requires an approved schema migration (`prisma migrate dev`/`db push`), which was
explicitly out of scope. Until then, the app is deployable and cancellation is safe, but the
payment/reservation ledger is inert.

**Next step:** obtain approval to provision the schema (a single migration), then re-verify the
cancellation-coordination path against a migrated database. After that, proceed to Step 14.12
(online payment-attempt initiation) per the ADR.

## 10. Safety Confirmation

No Git commands. No migrations, `db push`, seeds, or resets. No production database writes. Tests ran
against isolated temporary SQLite copies only. No schema changes. No payment-provider integration.
Generated artifacts refreshed: `frontend/tsconfig.tsbuildinfo` (typecheck) and `frontend/.next`
(build).
