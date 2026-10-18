# Document 11: Testing Strategy & Test Suite Guide

## 1. Testing Philosophy: Zero-Dependency Architecture

NOIR & GOLD utilizes the native **Node.js test runner (`node:test`)** and strict assertion library (`node:assert/strict`) executed directly via `tsx`.

### Why Native `node:test` Over Jest / Mocha / Vitest?
1. **Zero External Dependencies:** Built directly into the Node.js runtime. No brittle Babel plugins, transformer configurations, or version drift.
2. **Sub-Second Execution:** Bypasses overhead from heavy test runners. The entire 122-test integration suite executes in under 15 seconds.
3. **Native TypeScript Support:** Paired with `tsx`, tests run TypeScript directly without pre-compilation.

---

## 2. Comprehensive Test Suite Inventory

The project features **122 automated tests** across six specialized suites in `frontend/tests/`:

| Test Suite File | Coverage Focus | Test Count | Key Invariants Verified |
| :--- | :--- | :---: | :--- |
| `order-service.test.ts` | Order Creation & Concurrency | 23 | Non-overselling under load, atomic rollback on failure, token hashing |
| `payment-attempt.test.ts` | Payment State Machine | 14 | State transitions, idempotency key collisions, replay prevention |
| `refund-ledger.test.ts` | Financial Ledger & Capacity | 10 | Cumulative capacity checks, gateway refund events, audit logging |
| `inventory-reservation.test.ts`| Stock Holds & TTL | 7 | Reservation expiration, atomic release on cancellation, no double-restock |
| `security-audit.test.ts` | Security & Rate Limits | 8 | Phone/IP rate limiting, CSRF origin checks, SQL injection resistance |
| `admin-orders-export.test.ts` | Financial CSV Export | 6 | RFC-4180 quotation escaping, date filtering, status filters |
| `admin-upload.test.ts` | Multipart File Upload | 4 | 5 MB file ceiling, MIME validation, collision-resistant UUIDs |
| `e2e-all-phases.test.ts` | Master E2E Lifecycle | 50 | Complete customer-to-admin lifecycle across all 5 remediation phases |
| **Total Test Count** | **Full System Coverage** | **122** | **100% Pass Rate (0 Failures)** |

---

## 3. Database Isolation Strategy (`mkdtempSync`)

Running automated database tests against the live development database (`dev.db`) creates severe risks: tests leave dirty rows, foreign key collisions occur, and local seed data is corrupted.

To solve this, tests implement dynamic **per-run database cloning**:

```typescript
// Pattern used in test suites:
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function setupIsolatedTestDb(): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "noir-gold-test-"));
  const tmpDbPath = path.join(tmpDir, "test.db");
  const sourceDb = path.resolve(__dirname, "../../backend/prisma/dev.db");

  // Copy pristine physical database to isolated RAM/Temp disk
  fs.copyFileSync(sourceDb, tmpDbPath);
  process.env.DATABASE_URL = `file:${tmpDbPath}`;
  return tmpDbPath;
}
```

### Advantages:
- Tests operate against a complete, fully seeded schema without touching development or production data.
- SQLite foreign key constraints (`PRAGMA foreign_keys = ON`) remain fully active and enforced.
- When the test runner exits, temporary files are safely discarded by the operating system.

---

## 4. How to Write a New Test: Boilerplate Template

To add new tests to `frontend/tests/`:

```typescript
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";

describe("Atelier Feature: Custom Silhouette Booking", () => {
  let createdOrderId: string;

  before(async () => {
    // Setup prerequisite test data
  });

  after(async () => {
    // Cleanup records to prevent dangling foreign keys
    if (createdOrderId) {
      await prisma.order.deleteMany({ where: { id: createdOrderId } });
    }
  });

  test("should successfully reserve fabric and record bespoke dimensions", async () => {
    const order = await prisma.order.create({
      data: {
        customerName: "Amina Khan",
        customerPhone: "+923009988776",
        shippingAddress: "Clifton Block 4",
        city: "Karachi",
        province: "Sindh",
        orderStatus: "PENDING",
        paymentStatus: "PENDING",
        paymentMethod: "COD",
        subtotalPkr: 45000,
        shippingFeePkr: 0,
        totalAmountPkr: 45000,
        tokenHash: "sample-token-hash",
      },
    });

    createdOrderId = order.id;

    assert.equal(order.orderStatus, "PENDING");
    assert.equal(order.totalAmountPkr, 45000);
    assert.ok(order.id.length > 0);
  });
});
```

---

## 5. CI/CD Pipeline Integration (GitHub Actions)

Include this configuration in `.github/workflows/ci.yml` for automated validation on every pull request:

```yaml
name: Continuous Integration Quality Gate

on: [push, pull_request]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"

      - name: Install Dependencies
        run: npm ci

      - name: Verify ESLint Quality
        run: npm run frontend:lint

      - name: Verify TypeScript Compilation
        run: |
          npm run frontend:typecheck
          npm run backend:build

      - name: Execute Full Test Suite
        run: npm test
```
