import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { copyFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, test } from "node:test";

const repositoryRoot = path.resolve(__dirname, "..", "..");
const temporaryDirectory = mkdtempSync(path.join(tmpdir(), "noir-payment-attempt-test-"));
const testDatabasePath = path.join(temporaryDirectory, "payment-attempt.sqlite");
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
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentAttempt_providerPaymentKey_key" ON "PaymentAttempt"("providerPaymentKey");
CREATE INDEX IF NOT EXISTS "PaymentAttempt_orderId_status_idx" ON "PaymentAttempt"("orderId", "status");
CREATE INDEX IF NOT EXISTS "PaymentAttempt_status_expiresAt_idx" ON "PaymentAttempt"("status", "expiresAt");
CREATE INDEX IF NOT EXISTS "PaymentAttempt_provider_providerPaymentId_idx" ON "PaymentAttempt"("provider", "providerPaymentId");
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentAttempt_orderId_attemptKey_key" ON "PaymentAttempt"("orderId", "attemptKey");
CREATE INDEX IF NOT EXISTS "PaymentEvent_paymentAttemptId_receivedAt_idx" ON "PaymentEvent"("paymentAttemptId", "receivedAt");
CREATE INDEX IF NOT EXISTS "PaymentEvent_processingStatus_receivedAt_idx" ON "PaymentEvent"("processingStatus", "receivedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentEvent_provider_providerEventId_key" ON "PaymentEvent"("provider", "providerEventId");
`;
execFileSync(process.execPath, [prismaCli, "db", "execute", "--stdin", "--url", process.env.DATABASE_URL!], {
  cwd: repositoryRoot,
  input: paymentTablesSql,
  stdio: ["pipe", "pipe", "pipe"],
});

let prisma: import("@prisma/client").PrismaClient;
let createPaymentAttempt: typeof import("../src/lib/payment-attempt-service").createPaymentAttempt;
let transitionPaymentAttempt: typeof import("../src/lib/payment-attempt-service").transitionPaymentAttempt;

const setupPromise = Promise.all([
  import("../src/lib/prisma"),
  import("../src/lib/payment-attempt-service"),
]).then(([prismaModule, paymentService]) => {
  prisma = prismaModule.prisma;
  createPaymentAttempt = paymentService.createPaymentAttempt;
  transitionPaymentAttempt = paymentService.transitionPaymentAttempt;
});

after(async () => {
  await setupPromise.catch(() => undefined);
  if (prisma) await prisma.$disconnect();
  rmSync(temporaryDirectory, { recursive: true, force: true });
});

async function resetDatabase() {
  await prisma.paymentEvent.deleteMany();
  await prisma.paymentAttempt.deleteMany();
  await prisma.order.deleteMany();
}

async function createOnlineOrder(orderReference = `PAY-${randomBytes(6).toString("hex")}`) {
  return prisma.order.create({
    data: {
      orderReference,
      verificationTokenHash: `v1:${randomBytes(32).toString("hex")}`,
      idempotencyKey: `checkout-${randomBytes(12).toString("hex")}`,
      customerFullName: "Payment Test Customer",
      customerPhone: "03001234567",
      shippingProvince: "Sindh",
      shippingCity: "Karachi",
      shippingArea: "Clifton",
      shippingStreetAddress: "10 Test Street",
      subtotalPkr: 5000,
      discountTotalPkr: 0,
      deliveryFeePkr: 250,
      totalPkr: 5250,
      currency: "PKR",
      paymentMethod: "TEST_ONLINE",
      paymentStatus: "PENDING",
      orderStatus: "PENDING",
    },
  });
}

function attemptInput(orderId: string, attemptKey = "attempt-1") {
  return {
    orderId,
    provider: "TEST_PROVIDER",
    paymentMethod: "TEST_ONLINE",
    amountPkr: 5250,
    currency: "PKR",
    attemptKey,
  };
}

test("creates an attempt and local non-success event for an existing order", async () => {
  await setupPromise;
  await resetDatabase();
  const order = await createOnlineOrder();

  const result = await createPaymentAttempt(attemptInput(order.id));
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.reused, false);
    assert.equal(result.attempt.status, "CREATED");
    assert.equal(result.attempt.amountPkr, order.totalPkr);
  }
  assert.equal(await prisma.paymentAttempt.count(), 1);
  assert.equal(await prisma.paymentEvent.count(), 1);
  assert.equal((await prisma.paymentEvent.findFirst())?.signatureVerified, false);
});

test("rejects missing orders, invalid amounts/currency, COD, and invalid keys", async () => {
  await resetDatabase();
  const missing = await createPaymentAttempt(attemptInput("missing-order"));
  assert.equal(missing.success, false);
  if (!missing.success) assert.equal(missing.code, "NOT_FOUND");

  const order = await createOnlineOrder();
  const invalidAmount = await createPaymentAttempt({ ...attemptInput(order.id), amountPkr: 0 });
  assert.equal(invalidAmount.success, false);
  if (!invalidAmount.success) assert.equal(invalidAmount.code, "INVALID_POSITIVE_INTEGER");

  const invalidCurrency = await createPaymentAttempt({ ...attemptInput(order.id), currency: "USD" });
  assert.equal(invalidCurrency.success, false);
  if (!invalidCurrency.success) assert.equal(invalidCurrency.code, "CURRENCY_MISMATCH");

  const invalidKey = await createPaymentAttempt({ ...attemptInput(order.id), attemptKey: "   " });
  assert.equal(invalidKey.success, false);
  if (!invalidKey.success) assert.equal(invalidKey.code, "INVALID_IDEMPOTENCY_KEY");

});

test("rejects COD orders without changing the existing COD workflow", async () => {
  await resetDatabase();
  const order = await prisma.order.create({
    data: {
      orderReference: "COD-PAYMENT-TEST",
      verificationTokenHash: `v1:${randomBytes(32).toString("hex")}`,
      idempotencyKey: `checkout-${randomBytes(12).toString("hex")}`,
      customerFullName: "COD Test Customer",
      customerPhone: "03001234567",
      shippingProvince: "Sindh",
      shippingCity: "Karachi",
      shippingArea: "Clifton",
      shippingStreetAddress: "10 COD Street",
      subtotalPkr: 5000,
      discountTotalPkr: 0,
      deliveryFeePkr: 250,
      totalPkr: 5250,
      paymentMethod: "CASH_ON_DELIVERY",
      paymentStatus: "PENDING",
      orderStatus: "PENDING",
    },
  });
  const result = await createPaymentAttempt(attemptInput(order.id));
  assert.equal(result.success, false);
  if (!result.success) assert.equal(result.code, "COD_NOT_ELIGIBLE");
});

test("matching duplicate requests and active attempts are reused", async () => {
  await resetDatabase();
  const order = await createOnlineOrder();
  const first = await createPaymentAttempt(attemptInput(order.id));
  assert.equal(first.success, true);
  if (!first.success) return;

  const duplicate = await createPaymentAttempt(attemptInput(order.id));
  assert.equal(duplicate.success, true);
  if (duplicate.success) {
    assert.equal(duplicate.reused, true);
    assert.equal(duplicate.attempt.id, first.attempt.id);
  }

  const activeReuse = await createPaymentAttempt(attemptInput(order.id, "different-key"));
  assert.equal(activeReuse.success, true);
  if (activeReuse.success) assert.equal(activeReuse.attempt.id, first.attempt.id);
  assert.equal(await prisma.paymentAttempt.count(), 1);
  assert.equal(await prisma.paymentEvent.count(), 1);
});

test("conflicting key reuse and captured retry are rejected", async () => {
  await resetDatabase();
  const order = await createOnlineOrder();
  const first = await createPaymentAttempt(attemptInput(order.id));
  assert.equal(first.success, true);
  if (!first.success) return;

  const conflict = await createPaymentAttempt({ ...attemptInput(order.id), amountPkr: 5000 });
  assert.equal(conflict.success, false);

  const pending = await transitionPaymentAttempt({ attemptId: first.attempt.id, nextStatus: "PENDING" });
  assert.equal(pending.success, true);
  const captured = await transitionPaymentAttempt({
    attemptId: first.attempt.id,
    nextStatus: "CAPTURED",
    providerEvent: {
      providerEventId: "provider-capture-1",
      eventType: "payment.captured",
      payloadHash: "hash-capture-1",
      signatureVerified: true,
    },
  });
  assert.equal(captured.success, true);

  const retry = await createPaymentAttempt(attemptInput(order.id, "retry-after-capture"));
  assert.equal(retry.success, false);
  if (!retry.success) assert.equal(retry.code, "ATTEMPT_NOT_RETRYABLE");
});

test("terminal failure can be followed by a new attempt", async () => {
  await resetDatabase();
  const order = await createOnlineOrder();
  const first = await createPaymentAttempt(attemptInput(order.id));
  assert.equal(first.success, true);
  if (!first.success) return;

  const failed = await transitionPaymentAttempt({ attemptId: first.attempt.id, nextStatus: "FAILED" });
  assert.equal(failed.success, true);

  const retry = await createPaymentAttempt(attemptInput(order.id, "retry-after-failure"));
  assert.equal(retry.success, true);
  if (retry.success) assert.notEqual(retry.attempt.id, first.attempt.id);
  assert.equal(await prisma.paymentAttempt.count(), 2);
});

test("invalid transitions and unverified success are rejected", async () => {
  await resetDatabase();
  const order = await createOnlineOrder();
  const first = await createPaymentAttempt(attemptInput(order.id));
  assert.equal(first.success, true);
  if (!first.success) return;

  const pending = await transitionPaymentAttempt({ attemptId: first.attempt.id, nextStatus: "PENDING" });
  assert.equal(pending.success, true);
  const unverified = await transitionPaymentAttempt({ attemptId: first.attempt.id, nextStatus: "CAPTURED" });
  assert.equal(unverified.success, false);
  if (!unverified.success) assert.equal(unverified.code, "UNVERIFIED_PROVIDER_CONFIRMATION");

  const illegal = await transitionPaymentAttempt({ attemptId: first.attempt.id, nextStatus: "REFUNDED" });
  assert.equal(illegal.success, false);
  if (!illegal.success) assert.equal(illegal.code, "INVALID_STATUS");
});

test("attempt state and event creation roll back together on event failure", async () => {
  await resetDatabase();
  const order = await createOnlineOrder();
  const first = await createPaymentAttempt(attemptInput(order.id));
  assert.equal(first.success, true);
  if (!first.success) return;

  await prisma.$executeRawUnsafe(`CREATE TRIGGER fail_payment_event BEFORE INSERT ON "PaymentEvent" WHEN NEW.eventType = 'ATTEMPT_FAILED' BEGIN SELECT RAISE(ABORT, 'forced payment event failure'); END`);
  try {
    await assert.rejects(
      transitionPaymentAttempt({ attemptId: first.attempt.id, nextStatus: "FAILED" })
    );
  } finally {
    await prisma.$executeRawUnsafe("DROP TRIGGER IF EXISTS fail_payment_event");
  }
  assert.equal((await prisma.paymentAttempt.findUnique({ where: { id: first.attempt.id } }))?.status, "CREATED");
  assert.equal(await prisma.paymentEvent.count(), 1);
});

test("concurrent duplicate initiation does not create duplicate rows", async () => {
  await resetDatabase();
  const order = await createOnlineOrder();
  const results = await Promise.all([
    createPaymentAttempt(attemptInput(order.id, "concurrent-key")),
    createPaymentAttempt(attemptInput(order.id, "concurrent-key")),
  ]);
  assert.ok(results.some((result) => result.success));
  assert.equal(await prisma.paymentAttempt.count(), 1);
  assert.equal(await prisma.paymentEvent.count(), 1);
});
