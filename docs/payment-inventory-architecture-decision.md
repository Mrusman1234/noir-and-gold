# Payment & Inventory Integration — Architecture Decision Record

**Project:** NOIR & GOLD — Luxury Apparel E-Commerce Store
**Document Version:** 1.0.0 (Draft for approval)
**Phase:** Step 14.10 (design only)
**Status:** Awaiting project-lead approval — **no implementation authorized**
**Date:** October 2026

---

> [!IMPORTANT]
> This document is a **decision proposal**. It authorizes no code, schema, database, or test changes.
> Implementation may begin only after the project lead approves one of the options in §5 and the
> file-change list in §8. This follows the Approval Gate Rule in `docs/implementation-roadmap.md`.

---

## 1. Purpose & Scope

Several payment/inventory services (`payment-attempt-service`, `inventory-reservation-service`,
`refund-ledger-service`) exist and have passing isolated unit tests, but are **not integrated** into
the live checkout or admin flows. Before any integration, the project must fix the **inventory
accounting model**, because the current design would **mutate stock twice** for the same purchase.

This ADR:

- Records the verified current stock-mutation behavior.
- States the two concrete hazards.
- Compares three candidate accounting models.
- Recommends one model.
- Lists the exact file changes required by the recommendation (pending approval).

It does **not** choose a payment provider, implement a provider adapter, or change the schema.

---

## 2. Verified Current State (facts, from Step 14.9D)

All line references were verified by source inspection during Step 14.9D. No runtime test was run.

### 2.1 Stock mutation sites

| Location | Operation | Trigger | Transaction |
|---|---|---|---|
| `frontend/src/lib/order-service.ts:873` | `stockQuantity: { decrement }` | Public checkout `createOrder` (COD) | Own tx, opened at `:792` |
| `frontend/src/lib/inventory-reservation-service.ts:195` | `stockQuantity: { decrement }` | Reservation **create** | Own tx, opened at `:144` |
| `frontend/src/lib/inventory-reservation-service.ts:287` | `stockQuantity: { increment }` | Reservation **RELEASED/EXPIRED** | Own tx, opened at `:254` |
| `frontend/src/lib/admin-order-update-service.ts:223` | `stockQuantity: { increment }` | Admin **cancellation** restock | Shared tx, opened at `:138` |
| `frontend/src/lib/admin-inventory-service.ts:153` | absolute set | Manual admin stock adjustment | Own tx, opened at `:135` |
| `frontend/src/lib/order-service.ts:392` | in-memory only | Dead demo helper (`restoreOrderInventory`) | none |

### 2.2 Production admin cancellation (verified, database-backed)

`frontend/src/app/api/v1/admin/orders/[orderReference]/route.ts` `PATCH` (`:34`) calls
`updatePersistentAdminOrder` (`:55`), implemented in
`frontend/src/lib/admin-order-update-service.ts` (`:122`). On transition to `CANCELLED` it:

1. Resolves each order item's variant via `item.catalogVariantId ?? item.variantId` (`:166`).
2. Conditionally increments stock by `item.quantity` (`:223`, guarded on current stock).
3. Writes an `InventoryAuditLog` (`:229`) and an `OrderAuditLog` (`:252`/`:264`).

All of the above run inside **one** `prisma.$transaction` (`:138`). The demo-store cancellation path
(`admin-service.ts` `updateOrderStatusAdmin`, operating on the in-memory `ORDERS_STORE`) is **not
imported by any route** and is dead code.

### 2.3 Reservation service is standalone

`createInventoryReservation` / `transitionInventoryReservation` are imported by **no** route or
service. There is **no** reference to `InventoryReservation` inside the admin update service. The
reservation model therefore cannot yet coordinate with cancellation.

### 2.4 No cross-service transaction

Each service opens its **own** `prisma.$transaction`. Calling one from another does **not** produce a
shared atomic unit. (`order-service:792`, `inventory-reservation-service:144` & `:254`,
`admin-order-update-service:138`, `payment-attempt-service:221` & `:275`, `refund-ledger-service:227` & `:349`.)

### 2.5 Currency/amount authority

`payment-attempt-service.ts` already derives amount/currency from the persisted `Order` and rejects
mismatches (`AMOUNT_MISMATCH`, currency checks). The order total is the source of truth for online
initiation, not client input.

---

## 3. The Problem: Two Double-Mutation Hazards

**Hazard D1 — double decrement.**
Checkout decrements stock (`order-service:873`). Reservation creation also decrements
(`inventory-reservation-service:195`). If both ever run for the same order item, the quantity is
subtracted **twice**. Dormant today only because reservations are unwired.

**Hazard D2 — double restock.**
Admin cancellation increments stock (`admin-order-update-service:223`). Releasing/expiring a
reservation also increments (`inventory-reservation-service:287`). If a cancelled order later has a
reservation released/expired, stock is added **twice**. Dormant today; live the moment reservations
are integrated.

**Hazard D3 — cross-service non-atomicity.**
Because services own separate transactions (§2.4), any direct call chain is not atomic and can leave
an order, its stock, and its reservation in inconsistent states on failure.

---

## 4. Decision Drivers & Constraints

1. **Preserve COD exactly** — checkout and COD cancellation must not change behavior.
2. **Exactly one decrement per purchased quantity, exactly one restore per cancellation.**
3. **Minimize change** — no schema change without explicit approval; avoid rewriting checkout.
4. **Reserve stock during the online-payment window** (prevent overselling).
5. **Auditable** — every stock move has an `InventoryAuditLog`; every reservation has clear state.
6. **Idempotent** under retries and concurrency.

---

## 5. Candidate Models

### 5.1 Option A — Reservation-owned decrement

- Online orders: checkout does **not** decrement; `createInventoryReservation` performs the single
  decrement and holds stock for the payment window. Consumption converts the reservation to sold;
  release/expiry restores stock.
- COD orders: unchanged (checkout decrements; cancellation restocks).

**Pros:** conceptually pure "reserve → commit"; reservations genuinely hold inventory.
**Cons:** checkout must branch on payment method; cancellation must branch (release reservation vs
restock); two parallel accounting paths = higher defect surface.

### 5.2 Option B — Order-owned decrement + logical (non-mutating) reservation — **RECOMMENDED**

- Checkout **always** decrements stock (COD and online alike) — unchanged from today.
- A reservation row becomes a **logical hold marker**: it records that the order is holding stock,
  tracks `expiresAt`/status, but **does not move `stockQuantity`** on create/consume/release/expire.
- The **order** owns both the single decrement (checkout) and the single restore (cancellation or
  expiry-driven cancellation).
- Expiry flow: reservation → `EXPIRED` (no stock move) → cancel the order → order-owned restock.

**Pros:** one decrement + one restore regardless of payment method; **no branching** in checkout;
**no schema change**; smallest diff; COD untouched; D1 and D2 eliminated by construction.
**Cons:** reservation semantics change (it stops moving stock) → its existing unit tests must be
rewritten to the approved semantics (a deliberate, approved change, not a weakened assertion). The
"hold" is enforced by the fact that stock was already decremented at checkout.

### 5.3 Option C — Shared-transaction coordinator

- Refactor `order-service`, `inventory-reservation-service`, and payment services to accept an
  injected `Prisma.TransactionClient`, and add a coordinator that runs order creation, reservation
  creation, and payment-attempt creation in **one** transaction.
- Stock owned by exactly one operation (order), reservation non-mutating (as in B).

**Pros:** strongest atomicity (eliminates D3); clean long-term architecture.
**Cons:** large, cross-cutting refactor of four services and their transaction signatures; highest
regression risk; touches checkout internals. Best deferred to a dedicated hardening phase.

### 5.4 Comparison

| Criterion | A | **B (recommended)** | C |
|---|---|---|---|
| Checkout change | Branch by method | **None** | Structural refactor |
| COD preserved | Yes | **Yes** | Yes (with care) |
| D1 double-decrement | Solved | **Solved** | Solved |
| D2 double-restock | Solved | **Solved** | Solved |
| D3 cross-service atomicity | Partial | **Partial** | Solved |
| Schema change | No | **No** | No |
| Regression surface | Medium | **Low** | High |
| Reservation tests | Rework | **Rework** | Rework |

---

## 6. Recommended Decision

**Adopt Option B.** The order owns the single stock decrement and the single stock restore. The
`InventoryReservation` ledger becomes a **lifecycle/hold tracker that never moves stock**, giving the
online-payment window a durable, queryable state and expiry signal without a second mutation.

Rationale: it satisfies all six drivers in §4 with the smallest diff, keeps checkout and COD
untouched, needs no schema change, and removes both live hazards by construction. Option C remains a
documented future upgrade once provider integration (Steps 14.13–14.16) is stable.

---

## 7. Behavior Under the Recommendation

| Scenario | Decrement | Restore | Reservation |
|---|---|---|---|
| COD checkout | checkout (unchanged) | on cancellation (unchanged) | none |
| Online checkout | checkout (single) | on cancellation | created as logical `ACTIVE` hold; **no stock move** |
| Payment success | — | — | `ACTIVE` → `CONSUMED` (no stock move) |
| Payment fail / user abort | — | on order cancellation | `ACTIVE` → `RELEASED` (no stock move) |
| Window expiry | — | on expiry-driven cancellation | `ACTIVE` → `EXPIRED` (no stock move) → cancel order → restock |
| Admin cancellation | — | cancellation (single, `:223`) | if `ACTIVE`, close to `RELEASED` **without** restock |

Invariant enforced: **decrements = restores = number of cancelled/abandoned orders**, and a
reservation transition never changes `stockQuantity`.

---

## 8. Exact File-Change List (Step 14.11 scope — pending approval)

**Modify**
1. `frontend/src/lib/inventory-reservation-service.ts` — remove the stock decrement on create (`:195`)
   and the stock restore on release/expire (`:287`); keep status transitions, `activeReservationKey`
   handling, and (optionally) write a non-stock "reservation hold" audit entry. Consumption semantics
   stay state-only.
2. `frontend/tests/inventory-reservation-service.test.ts` — update assertions from "stock moved" to
   "stock unchanged; reservation state/audit only", and keep duplicate-key/concurrency cases.
3. `frontend/src/lib/admin-order-update-service.ts` — when cancelling, close any `ACTIVE` reservation
   to `RELEASED` inside the **same** `$transaction` (`:138`) **without** an extra stock increment.
4. `frontend/src/app/api/v1/admin/orders/[orderReference]/route.ts` — only if the update result needs
   a new code mapping; otherwise unchanged.

**Add (later phases, not this one)**
5. Expiry/reconciliation worker wiring reservation expiry → order cancellation (Step 14.16).
6. Online payment-attempt initiation route (Step 14.12), then provider adapter/webhook (14.13).

**Must NOT change**
- `frontend/src/lib/order-service.ts` checkout decrement (`:873`) and its transaction (`:792`).
- COD behavior, delivery, schema, and any existing public route contract.
- No schema/migration in Step 14.11.

---

## 9. Required Isolated Tests (Step 14.11)

Use a disposable SQLite copy — never the live development database.

- Reservation create does **not** change `stockQuantity`; the row is `ACTIVE` with a key.
- Consume/release/expire change only reservation state + timestamps; stock unchanged.
- Duplicate key reuse returns the same reservation; conflicting reuse is rejected.
- Different-key concurrent create cannot produce two `ACTIVE` rows for one `(orderId, variant)`.
- Admin cancellation restores stock **exactly once** and closes an `ACTIVE` reservation without a
  second increment (regression guard for D2).
- Checkout + reservation for one order decrements exactly once (regression guard for D1).
- Rollback: a failed admin cancellation leaves stock and reservation state unchanged.
- Existing COD/order regression suite (`22/22` recorded) still passes unchanged.

Report exact pass/fail counts; typecheck and changed-file ESLint on the modified files.

---

## 10. Schema & Migration Impact

**None required for Option B.** The `InventoryReservation` model already carries `status`,
`activeReservationKey @unique`, `expiresAt`, `consumedAt`, `releasedAt` (`backend/prisma/schema.prisma:307-326`).

**Known gap (out of scope here):** there is **no** DB uniqueness for one `ACTIVE` reservation per
`(orderId, productVariantId)`; only an application-level `findFirst` guard exists
(`inventory-reservation-service.ts:181`). Adding a partial/functional unique index would require a
schema change and explicit approval; it is **not** part of this decision.

---

## 11. Idempotency & Concurrency

- Order creation already guards on `idempotencyKey @unique` and conditional stock updates.
- Admin cancellation guards on `(id, orderStatus, paymentStatus)` (`:197`) and per-variant expected
  stock (`:223`); a second concurrent cancellation returns `CONCURRENT_UPDATE`.
- Under Option B, reservation transitions must remain `updateMany`-guarded and must not mutate stock,
  so they cannot reintroduce D2 under concurrency.
- Cross-service atomicity (D3) remains open until Option C is adopted; it is acceptable while
  provider integration is absent.

---

## 12. Open Questions Requiring Approval

1. Confirm **Option B** (or choose A/C).
2. Confirm that changing the reservation service semantics + rewriting its unit tests to the new
   behavior is acceptable (a deliberate design change, not a suppressed test).
3. Confirm the online-payment window length (drives `expiresAt`) and whether expiry should
   auto-cancel the order or only flag it for admin action.
4. Decide whether to also schedule Option C (shared transaction) as a later hardening phase.

---

## 13. Gate

No code, schema, or database change is made until §12 items are answered and the §8 list is approved.
`docs/implementation-roadmap.md` Approval Gate Rule applies.
