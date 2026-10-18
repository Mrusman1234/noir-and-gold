import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { copyFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, test } from "node:test";

const repositoryRoot = path.resolve(__dirname, "..", "..");
const temporaryDirectory = mkdtempSync(path.join(tmpdir(), "noir-refund-ledger-test-"));
const testDatabasePath = path.join(temporaryDirectory, "refund-ledger.sqlite");
process.env.DATABASE_URL = `file:${testDatabasePath.replace(/\\/g, "/")}`;
copyFileSync(path.join(repositoryRoot, "backend", "prisma", "dev.db"), testDatabasePath);

const prismaCli = path.join(repositoryRoot, "node_modules", "prisma", "build", "index.js");
const paymentTablesSql = `
CREATE TABLE IF NOT EXISTS "PaymentAttempt" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "paymentMethod" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'CREATED',
  "amountPkr" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'PKR',
  "attemptKey" TEXT NOT NULL,
  "providerCheckoutId" TEXT,
  "providerPaymentId" TEXT,
  "providerPaymentKey" TEXT,
  "failureCode" TEXT,
  "failureMessage" TEXT,
  "expiresAt" DATETIME,
  "authorizedAt" DATETIME,
  "capturedAt" DATETIME,
  "failedAt" DATETIME,
  "cancelledAt" DATETIME,
  "voidedAt" DATETIME,
  "capturedAmountPkr" INTEGER NOT NULL DEFAULT 0,
  "refundedAmountPkr" INTEGER NOT NULL DEFAULT 0,
  "refundReservedAmountPkr" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "PaymentAttempt_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "PaymentEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "paymentAttemptId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerEventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "signatureVerified" BOOLEAN NOT NULL DEFAULT false,
  "processingStatus" TEXT NOT NULL DEFAULT 'RECEIVED',
  "failureReason" TEXT,
  "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" DATETIME,
  CONSTRAINT "PaymentEvent_paymentAttemptId_fkey" FOREIGN KEY ("paymentAttemptId") REFERENCES "PaymentAttempt" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Refund" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "paymentAttemptId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerRefundId" TEXT,
  "providerRefundKey" TEXT,
  "amountPkr" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'PKR',
  "status" TEXT NOT NULL DEFAULT 'REQUESTED',
  "idempotencyKey" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "failureCode" TEXT,
  "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" DATETIME,
  CONSTRAINT "Refund_paymentAttemptId_fkey" FOREIGN KEY ("paymentAttemptId") REFERENCES "PaymentAttempt" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentAttempt_providerPaymentKey_key" ON "PaymentAttempt"("providerPaymentKey");
CREATE INDEX IF NOT EXISTS "PaymentAttempt_orderId_status_idx" ON "PaymentAttempt"("orderId", "status");
CREATE INDEX IF NOT EXISTS "PaymentAttempt_status_expiresAt_idx" ON "PaymentAttempt"("status", "expiresAt");
CREATE INDEX IF NOT EXISTS "PaymentAttempt_provider_providerPaymentId_idx" ON "PaymentAttempt"("provider", "providerPaymentId");
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentAttempt_orderId_attemptKey_key" ON "PaymentAttempt"("orderId", "attemptKey");
CREATE INDEX IF NOT EXISTS "PaymentEvent_paymentAttemptId_receivedAt_idx" ON "PaymentEvent"("paymentAttemptId", "receivedAt");
CREATE INDEX IF NOT EXISTS "PaymentEvent_processingStatus_receivedAt_idx" ON "PaymentEvent"("processingStatus", "receivedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentEvent_provider_providerEventId_key" ON "PaymentEvent"("provider", "providerEventId");
CREATE UNIQUE INDEX IF NOT EXISTS "Refund_providerRefundKey_key" ON "Refund"("providerRefundKey");
CREATE UNIQUE INDEX IF NOT EXISTS "Refund_paymentAttemptId_idempotencyKey_key" ON "Refund"("paymentAttemptId", "idempotencyKey");
CREATE INDEX IF NOT EXISTS "Refund_paymentAttemptId_status_idx" ON "Refund"("paymentAttemptId", "status");
CREATE INDEX IF NOT EXISTS "Refund_provider_providerRefundId_idx" ON "Refund"("provider", "providerRefundId");
`;
execFileSync(process.execPath, [prismaCli, "db", "execute", "--stdin", "--url", process.env.DATABASE_URL!], {
  cwd: repositoryRoot,
  input: paymentTablesSql,
  stdio: ["pipe", "pipe", "pipe"],
});

let prisma: import("@prisma/client").PrismaClient;
let createRefund: typeof import("../src/lib/refund-ledger-service").createRefund;
let transitionRefund: typeof import("../src/lib/refund-ledger-service").transitionRefund;

const setupPromise = import("../src/lib/prisma").then(async (prismaModule) => {
  prisma = prismaModule.prisma;
  const service = await import("../src/lib/refund-ledger-service");
  createRefund = service.createRefund;
  transitionRefund = service.transitionRefund;
});

after(async () => {
  await setupPromise.catch(() => undefined);
  if (prisma) await prisma.$disconnect();
  rmSync(temporaryDirectory, { recursive: true, force: true });
});

async function resetDatabase() {
  await prisma.paymentEvent.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.paymentAttempt.deleteMany();
  await prisma.order.deleteMany();
}

async function createCapturedAttempt(amountPkr = 10000) {
  const order = await prisma.order.create({
    data: {
      orderReference: `REF-${randomBytes(6).toString("hex")}`,
      verificationTokenHash: `v1:${randomBytes(32).toString("hex")}`,
      idempotencyKey: `checkout-${randomBytes(12).toString("hex")}`,
      customerFullName: "Refund Test Customer",
      customerPhone: "03001234567",
      shippingProvince: "Sindh",
      shippingCity: "Karachi",
      shippingArea: "Clifton",
      shippingStreetAddress: "10 Refund Street",
      subtotalPkr: amountPkr,
      discountTotalPkr: 0,
      deliveryFeePkr: 0,
      totalPkr: amountPkr,
      currency: "PKR",
      paymentMethod: "TEST_ONLINE",
      paymentStatus: "PENDING",
      orderStatus: "PENDING",
    },
  });
  const attempt = await prisma.paymentAttempt.create({
    data: {
      orderId: order.id,
      provider: "TEST_PROVIDER",
      paymentMethod: "TEST_ONLINE",
      status: "CAPTURED",
      amountPkr,
      currency: "PKR",
      attemptKey: `attempt-${randomBytes(8).toString("hex")}`,
      capturedAt: new Date(),
      capturedAmountPkr: amountPkr,
    },
  });
  return { order, attempt };
}

function refundInput(paymentAttemptId: string, amountPkr: number, idempotencyKey = "refund-1") {
  return {
    paymentAttemptId,
    amountPkr,
    currency: "PKR",
    idempotencyKey,
    reason: "CUSTOMER_REQUEST",
  };
}

test("creates partial and full refunds while reserving capacity", async () => {
  await setupPromise;
  await resetDatabase();
  const { attempt } = await createCapturedAttempt();

  const partial = await createRefund(refundInput(attempt.id, 4000, "partial"));
  assert.equal(partial.success, true);
  if (!partial.success) return;
  assert.equal(partial.refund.status, "REQUESTED");
  assert.equal((await prisma.paymentAttempt.findUnique({ where: { id: attempt.id } }))?.refundReservedAmountPkr, 4000);

  const full = await createRefund(refundInput(attempt.id, 6000, "remainder"));
  assert.equal(full.success, true);
  assert.equal(await prisma.refund.count(), 2);
  assert.equal((await prisma.paymentAttempt.findUnique({ where: { id: attempt.id } }))?.refundReservedAmountPkr, 10000);
});

test("rejects non-captured attempts, invalid amounts, and currency mismatches", async () => {
  await resetDatabase();
  const { attempt } = await createCapturedAttempt();
  await prisma.paymentAttempt.update({ where: { id: attempt.id }, data: { status: "PENDING", capturedAt: null } });
  const notCaptured = await createRefund(refundInput(attempt.id, 1));
  assert.equal(notCaptured.success, false);
  if (!notCaptured.success) assert.equal(notCaptured.code, "PAYMENT_NOT_CAPTURED");

  const captured = await prisma.paymentAttempt.update({
    where: { id: attempt.id },
    data: { status: "CAPTURED", capturedAt: new Date() },
  });
  assert.equal(captured.status, "CAPTURED");
  const invalidAmount = await createRefund({ ...refundInput(attempt.id, 0), idempotencyKey: "invalid-amount" });
  assert.equal(invalidAmount.success, false);
  if (!invalidAmount.success) assert.equal(invalidAmount.code, "INVALID_POSITIVE_INTEGER");
  const mismatch = await createRefund({ ...refundInput(attempt.id, 1, "currency-mismatch"), currency: "USD" });
  assert.equal(mismatch.success, false);
  if (!mismatch.success) assert.equal(mismatch.code, "CURRENCY_MISMATCH");
});

test("reuses matching idempotency and rejects conflicting reuse", async () => {
  await resetDatabase();
  const { attempt } = await createCapturedAttempt();
  const first = await createRefund(refundInput(attempt.id, 3000, "same-key"));
  assert.equal(first.success, true);
  if (!first.success) return;

  const duplicate = await createRefund(refundInput(attempt.id, 3000, "same-key"));
  assert.equal(duplicate.success, true);
  if (duplicate.success) {
    assert.equal(duplicate.reused, true);
    assert.equal(duplicate.refund.id, first.refund.id);
  }
  assert.equal((await prisma.paymentAttempt.findUnique({ where: { id: attempt.id } }))?.refundReservedAmountPkr, 3000);

  const conflict = await createRefund(refundInput(attempt.id, 4000, "same-key"));
  assert.equal(conflict.success, false);
  if (!conflict.success) assert.equal(conflict.code, "IDEMPOTENCY_KEY_REUSED");
});

test("enforces cumulative refund capacity", async () => {
  await resetDatabase();
  const { attempt } = await createCapturedAttempt(10000);
  const first = await createRefund(refundInput(attempt.id, 7000, "first"));
  assert.equal(first.success, true);
  const over = await createRefund(refundInput(attempt.id, 3001, "over"));
  assert.equal(over.success, false);
  if (!over.success) assert.equal(over.code, "REFUND_LIMIT_EXCEEDED");
  assert.equal((await prisma.paymentAttempt.findUnique({ where: { id: attempt.id } }))?.refundReservedAmountPkr, 7000);
});

test("success moves reserved capacity to refunded capacity only with verified confirmation", async () => {
  await resetDatabase();
  const { attempt, order } = await createCapturedAttempt();
  const created = await createRefund(refundInput(attempt.id, 2500));
  assert.equal(created.success, true);
  if (!created.success) return;

  const unverified = await transitionRefund({ refundId: created.refund.id, nextStatus: "PROCESSING" });
  assert.equal(unverified.success, true);
  const missingConfirmation = await transitionRefund({ refundId: created.refund.id, nextStatus: "SUCCEEDED" });
  assert.equal(missingConfirmation.success, false);
  if (!missingConfirmation.success) assert.equal(missingConfirmation.code, "VERIFIED_PROVIDER_CONFIRMATION_REQUIRED");

  const succeeded = await transitionRefund({
    refundId: created.refund.id,
    nextStatus: "SUCCEEDED",
    verifiedProviderConfirmation: {
      providerEventId: "refund-success-1",
      eventType: "refund.succeeded",
      payloadHash: "verified-hash",
      signatureVerified: true,
    },
  });
  assert.equal(succeeded.success, true);
  const attemptAfter = await prisma.paymentAttempt.findUnique({ where: { id: attempt.id } });
  assert.equal(attemptAfter?.refundReservedAmountPkr, 0);
  assert.equal(attemptAfter?.refundedAmountPkr, 2500);
  assert.equal((await prisma.order.findUnique({ where: { id: order.id } }))?.paymentStatus, "PENDING");
});

test("failed and cancelled refunds release capacity exactly once", async () => {
  await resetDatabase();
  const { attempt } = await createCapturedAttempt();
  const failed = await createRefund(refundInput(attempt.id, 2000, "failed"));
  assert.equal(failed.success, true);
  if (!failed.success) return;
  const failedTransition = await transitionRefund({ refundId: failed.refund.id, nextStatus: "FAILED", failureCode: "PROVIDER_DECLINED" });
  assert.equal(failedTransition.success, true);
  assert.equal((await prisma.paymentAttempt.findUnique({ where: { id: attempt.id } }))?.refundReservedAmountPkr, 0);
  const repeated = await transitionRefund({ refundId: failed.refund.id, nextStatus: "FAILED" });
  assert.equal(repeated.success, true);
  assert.equal((await prisma.paymentAttempt.findUnique({ where: { id: attempt.id } }))?.refundReservedAmountPkr, 0);

  const cancelled = await createRefund(refundInput(attempt.id, 1500, "cancelled"));
  assert.equal(cancelled.success, true);
  if (!cancelled.success) return;
  const cancelledTransition = await transitionRefund({ refundId: cancelled.refund.id, nextStatus: "CANCELLED" });
  assert.equal(cancelledTransition.success, true);
  assert.equal((await prisma.paymentAttempt.findUnique({ where: { id: attempt.id } }))?.refundReservedAmountPkr, 0);
});

test("rejects invalid refund transitions and terminal reopening", async () => {
  await resetDatabase();
  const { attempt } = await createCapturedAttempt();
  const created = await createRefund(refundInput(attempt.id, 1000));
  assert.equal(created.success, true);
  if (!created.success) return;
  const invalid = await transitionRefund({ refundId: created.refund.id, nextStatus: "SUCCEEDED" });
  assert.equal(invalid.success, false);
  if (!invalid.success) assert.equal(invalid.code, "INVALID_TRANSITION");
  const cancelled = await transitionRefund({ refundId: created.refund.id, nextStatus: "CANCELLED" });
  assert.equal(cancelled.success, true);
  const reopen = await transitionRefund({ refundId: created.refund.id, nextStatus: "PROCESSING" });
  assert.equal(reopen.success, false);
  if (!reopen.success) assert.equal(reopen.code, "INVALID_TRANSITION");
});

test("rolls back the capacity reservation and refund when event creation fails", async () => {
  await resetDatabase();
  const { attempt } = await createCapturedAttempt();
  await prisma.$executeRawUnsafe(`CREATE TRIGGER fail_refund_event BEFORE INSERT ON "PaymentEvent" WHEN NEW.eventType = 'REFUND_REQUESTED' BEGIN SELECT RAISE(ABORT, 'forced refund event failure'); END`);
  try {
    await assert.rejects(createRefund(refundInput(attempt.id, 1200, "rollback")));
  } finally {
    await prisma.$executeRawUnsafe("DROP TRIGGER IF EXISTS fail_refund_event");
  }
  assert.equal(await prisma.refund.count(), 0);
  const attemptAfter = await prisma.paymentAttempt.findUnique({ where: { id: attempt.id } });
  assert.equal(attemptAfter?.refundReservedAmountPkr, 0);
});

test("concurrent requests cannot reserve more than the captured amount", async () => {
  await resetDatabase();
  const { attempt } = await createCapturedAttempt(10000);
  const results = await Promise.all([
    createRefund(refundInput(attempt.id, 10000, "concurrent-a")),
    createRefund(refundInput(attempt.id, 10000, "concurrent-b")),
  ]);
  const successes = results.filter((result) => result.success);
  assert.ok(successes.length <= 1);
  const attemptAfter = await prisma.paymentAttempt.findUnique({ where: { id: attempt.id } });
  assert.ok((attemptAfter?.refundReservedAmountPkr ?? 0) <= 10000);
  assert.equal(await prisma.refund.count(), successes.length);
});
