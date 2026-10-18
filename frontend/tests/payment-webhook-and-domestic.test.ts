import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import { copyFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { NextRequest } from "next/server";

const repositoryRoot = path.resolve(__dirname, "..", "..");
const temporaryDirectory = mkdtempSync(path.join(tmpdir(), "noir-payment-domestic-test-"));
const testDatabasePath = path.join(temporaryDirectory, "domestic-payments.sqlite");
process.env.DATABASE_URL = `file:${testDatabasePath.replace(/\\/g, "/")}`;
copyFileSync(path.join(repositoryRoot, "backend", "prisma", "dev.db"), testDatabasePath);
process.env.ORDER_VERIFICATION_SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
process.env.PAYMENT_WEBHOOK_SECRET = "test_webhook_hmac_secret_key_32bytes_long_ok";

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
let createOrder: typeof import("../src/lib/order-service").createOrder;

const setupPromise = Promise.all([
  import("../src/lib/prisma"),
  import("../src/lib/order-service"),
]).then(([prismaModule, orderModule]) => {
  prisma = prismaModule.prisma;
  createOrder = orderModule.createOrder;
});

after(async () => {
  await setupPromise.catch(() => undefined);
  if (prisma) await prisma.$disconnect();
  rmSync(temporaryDirectory, { recursive: true, force: true });
});

async function ensureTestProduct() {
  await setupPromise;
  let category = await prisma.category.findFirst({ where: { slug: "formal-edit" } });
  if (!category) {
    category = await prisma.category.create({
      data: { name: "Formal Edit", slug: "formal-edit" },
    });
  }

  let product = await prisma.product.findFirst({
    where: { slug: "velvet-regalia-sherwani" },
    include: { variants: true },
  });

  if (!product) {
    product = await prisma.product.create({
      data: {
        categoryId: category.id,
        title: "Velvet Regalia Sherwani",
        slug: "velvet-regalia-sherwani",
        description: "Pure velvet sherwani with handcrafted gold zardozi embroidery.",
        primaryImageUrl: "/images/products/velvet-regalia-1.jpg",
        pricePkr: 85000,
        status: "PUBLISHED",
        variants: {
          create: [
            {
              sku: "VRS-BLK-M-01",
              size: "M",
              colorName: "Midnight Black",
              colorHex: "#111111",
              pricePkr: 85000,
              stockQuantity: 25,
              isActive: true,
            },
            {
              sku: "VRS-BLK-L-01",
              size: "L",
              colorName: "Midnight Black",
              colorHex: "#111111",
              pricePkr: 85000,
              stockQuantity: 25,
              isActive: true,
            },
          ],
        },
      },
      include: { variants: true },
    });
  }

  return product;
}

test("domestic payment methods (JazzCash, EasyPaisa, Bank Transfer) persist correctly during order creation", async () => {
  const product = await ensureTestProduct();
  const variant = product.variants[0];

  // 1. JazzCash Order
  const jazzResult = await createOrder({
    customer: {
      fullName: "Fatima Noor",
      phone: "03001234567",
      email: "fatima@example.com",
      province: "Sindh",
      city: "Karachi",
      area: "Clifton",
      streetAddress: "House 12, Block 4",
    },
    items: [{ productId: product.id, size: variant.size, color: variant.colorName, quantity: 1 }],
    idempotencyKey: `idemp_jazz_${crypto.randomBytes(8).toString("hex")}`,
    paymentMethod: "JAZZCASH",
    paymentReference: "TID-9876543210",
  });

  assert.equal(jazzResult.success, true);
  assert.ok(jazzResult.orderReference);

  const savedJazzOrder = await prisma.order.findUnique({
    where: { orderReference: jazzResult.orderReference },
    include: { auditLogs: true },
  });
  assert.ok(savedJazzOrder);
  assert.equal(savedJazzOrder.paymentMethod, "JAZZCASH");
  assert.equal(savedJazzOrder.paymentStatus, "PENDING");
  const jazzAudit = savedJazzOrder.auditLogs.find((l) => l.action === "ORDER_CREATED");
  assert.ok(jazzAudit?.note?.includes("Order placed via JAZZCASH"));
  assert.ok(jazzAudit?.note?.includes("TID-9876543210"));

  // 2. Direct Bank Transfer Order
  const bankResult = await createOrder({
    customer: {
      fullName: "Ali Tariq",
      phone: "03331234567",
      email: "ali@example.com",
      province: "Punjab",
      city: "Lahore",
      area: "Gulberg III",
      streetAddress: "Street 9, House 4",
    },
    items: [{ productId: product.id, size: variant.size, color: variant.colorName, quantity: 1 }],
    idempotencyKey: `idemp_bank_${crypto.randomBytes(8).toString("hex")}`,
    paymentMethod: "BANK_TRANSFER",
    paymentReference: "IBFT-MEEZAN-9921",
  });

  assert.equal(bankResult.success, true);
  const savedBankOrder = await prisma.order.findUnique({
    where: { orderReference: bankResult.orderReference },
  });
  assert.ok(savedBankOrder);
  assert.equal(savedBankOrder.paymentMethod, "BANK_TRANSFER");
  assert.equal(savedBankOrder.paymentStatus, "PENDING");
});

test("verifyWebhookSignature correctly verifies HMAC-SHA256 and rejects spoofed signatures", async () => {
  const { verifyWebhookSignature } = await import("../src/app/api/v1/payments/webhook/route");
  const secret = "test_webhook_hmac_secret_key_32bytes_long_ok";
  const body = Buffer.from(JSON.stringify({ event: "test", amount: 15000 }), "utf-8");

  const validSignature = crypto.createHmac("sha256", secret).update(body).digest("hex");

  // Valid signature
  assert.equal(verifyWebhookSignature(body, validSignature, secret), true);
  // Valid signature with sha256= prefix
  assert.equal(verifyWebhookSignature(body, `sha256=${validSignature}`, secret), true);
  // Valid signature with v1= prefix
  assert.equal(verifyWebhookSignature(body, `v1=${validSignature}`, secret), true);

  // Tampered payload
  const tamperedBody = Buffer.from(JSON.stringify({ event: "test", amount: 999999 }), "utf-8");
  assert.equal(verifyWebhookSignature(tamperedBody, validSignature, secret), false);

  // Wrong secret
  assert.equal(verifyWebhookSignature(body, validSignature, "wrong_secret_key_completely"), false);

  // Malformed signature
  assert.equal(verifyWebhookSignature(body, "not-a-valid-hex-signature", secret), false);
  assert.equal(verifyWebhookSignature(body, null, secret), false);
});

test("verifyTimestampFreshness prevents replay attacks beyond 300 seconds", async () => {
  const { verifyTimestampFreshness } = await import("../src/app/api/v1/payments/webhook/route");
  const nowMs = Date.now();

  // Fresh timestamp in seconds
  const freshSeconds = Math.floor(nowMs / 1000).toString();
  assert.equal(verifyTimestampFreshness(freshSeconds), true);

  // Fresh timestamp in milliseconds
  assert.equal(verifyTimestampFreshness(nowMs.toString()), true);

  // 100 seconds ago (well within 300s window)
  assert.equal(verifyTimestampFreshness(Math.floor((nowMs - 100_000) / 1000).toString()), true);

  // 600 seconds (10 minutes) ago (replay attack)
  assert.equal(verifyTimestampFreshness(Math.floor((nowMs - 600_000) / 1000).toString()), false);

  // Future timestamp (clock skew > 300s)
  assert.equal(verifyTimestampFreshness(Math.floor((nowMs + 600_000) / 1000).toString()), false);
});

test("gateway webhook endpoint processes payment capture, updates order to PAID, and deduplicates events", async () => {
  const { POST } = await import("../src/app/api/v1/payments/webhook/route");
  const product = await ensureTestProduct();
  const variant = product.variants[0];

  const orderRes = await createOrder({
    customer: {
      fullName: "Sara Khan",
      phone: "03211234567",
      email: "sara@example.com",
      province: "Islamabad Capital",
      city: "Islamabad",
      area: "F-7/2",
      streetAddress: "House 88, Street 12",
    },
    items: [{ productId: product.id, size: variant.size, color: variant.colorName, quantity: 1 }],
    idempotencyKey: `idemp_webhook_${crypto.randomBytes(8).toString("hex")}`,
    paymentMethod: "JAZZCASH",
  });
  assert.equal(orderRes.success, true);
  const orderRef = orderRes.orderReference!;

  const secret = process.env.PAYMENT_WEBHOOK_SECRET!;
  const eventId = `evt_${crypto.randomBytes(12).toString("hex")}`;
  const webhookBody = JSON.stringify({
    provider: "jazzcash",
    eventId,
    eventType: "PAYMENT_CAPTURED",
    orderReference: orderRef,
    amountPkr: 85000,
    providerPaymentId: "JC-TRX-88219412",
    timestamp: Math.floor(Date.now() / 1000),
  });

  const rawBuffer = Buffer.from(webhookBody, "utf-8");
  const signature = crypto.createHmac("sha256", secret).update(rawBuffer).digest("hex");

  // 1. Test POST with valid signature
  const req = new NextRequest("http://localhost:3000/api/v1/payments/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-signature": signature,
      "x-timestamp": Math.floor(Date.now() / 1000).toString(),
    },
    body: rawBuffer,
  });

  const res = await POST(req);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.orderReference, orderRef);

  // Verify Order transitioned to PAID
  const updatedOrder = await prisma.order.findUnique({
    where: { orderReference: orderRef },
    include: { paymentAttempts: true, auditLogs: true },
  });
  assert.equal(updatedOrder?.paymentStatus, "PAID");
  assert.equal(updatedOrder?.orderStatus, "PROCESSING");
  assert.equal(updatedOrder?.paymentAttempts.length, 1);
  assert.equal(updatedOrder?.paymentAttempts[0].status, "CAPTURED");
  assert.equal(updatedOrder?.paymentAttempts[0].providerPaymentId, "JC-TRX-88219412");

  // Verify Audit Log entry
  const audit = updatedOrder?.auditLogs.find((l) => l.action === "GATEWAY_PAYMENT_VERIFIED");
  assert.ok(audit);
  assert.equal(audit?.newStatus, "PAID");

  // 2. Test Deduplication: Replaying the same webhook event
  const replayReq = new NextRequest("http://localhost:3000/api/v1/payments/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-signature": signature,
      "x-timestamp": Math.floor(Date.now() / 1000).toString(),
    },
    body: rawBuffer,
  });

  const replayRes = await POST(replayReq);
  assert.equal(replayRes.status, 200);
  const replayData = await replayRes.json();
  assert.equal(replayData.success, true);
  assert.equal(replayData.deduplicated, true);

  // 3. Test Bad Signature rejection
  const badReq = new NextRequest("http://localhost:3000/api/v1/payments/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-signature": "0000000000000000000000000000000000000000000000000000000000000000",
      "x-timestamp": Math.floor(Date.now() / 1000).toString(),
    },
    body: rawBuffer,
  });

  const badRes = await POST(badReq);
  assert.equal(badRes.status, 401);
  const badData = await badRes.json();
  assert.equal(badData.error.code, "INVALID_SIGNATURE");
});
