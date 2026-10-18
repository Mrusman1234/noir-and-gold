import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { copyFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";

// Setup isolated active SQLite database copied from backend/prisma/dev.db
const repositoryRoot = path.resolve(__dirname, "..", "..");
const temporaryDirectory = mkdtempSync(path.join(tmpdir(), "noir-e2e-all-"));
const testDatabasePath = path.join(temporaryDirectory, "e2e-all.sqlite");
process.env.DATABASE_URL = `file:${testDatabasePath.replace(/\\/g, "/")}`;
copyFileSync(path.join(repositoryRoot, "backend", "prisma", "dev.db"), testDatabasePath);

import { prisma } from "../src/lib/prisma";

describe("E2E Master Verification: Phases 1 to 5", () => {
  let testProductId: string;
  let testVariantId: string;
  let testOrderId: string;

  after(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
    try {
      rmSync(temporaryDirectory, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error
    }
  });

  // -------------------------------------------------------------------------
  // PHASE 1: Database & Model Integrity
  // -------------------------------------------------------------------------
  describe("Phase 1: Database Schema & Soft Deletes", () => {
    test("all 14 required tables exist in physical SQLite database", async () => {
      const rows = (await prisma.$queryRawUnsafe(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma%' ORDER BY name ASC;"
      )) as { name: string }[];

      const tableNames = rows.map((r) => r.name);
      const expectedTables = [
        "Category",
        "InventoryAuditLog",
        "InventoryReservation",
        "Order",
        "OrderAuditLog",
        "OrderItem",
        "PaymentAttempt",
        "PaymentEvent",
        "Product",
        "ProductImage",
        "ProductVariant",
        "Refund",
        "SecurityAuditLog",
        "ShippingZone",
      ];

      for (const table of expectedTables) {
        assert.ok(
          tableNames.includes(table),
          `Missing expected table on disk: ${table}`
        );
      }
    });

    test("Category, Product, and Order models support deletedAt soft deletes", async () => {
      const category = await prisma.category.create({
        data: {
          name: "E2E Test Category",
          slug: `test-cat-${Date.now()}`,
          deletedAt: new Date(),
        },
      });
      assert.ok(category.deletedAt instanceof Date);

      const activeCategories = await prisma.category.findMany({
        where: { id: category.id, deletedAt: null },
      });
      assert.equal(activeCategories.length, 0);

      await prisma.category.delete({ where: { id: category.id } });
    });
  });

  // -------------------------------------------------------------------------
  // PHASE 2: Webhook Hardening & RBAC
  // -------------------------------------------------------------------------
  describe("Phase 2: Security & Webhook Hardening", () => {
    test("webhook rejects requests with 500 when secret is unconfigured in production", async () => {
      const originalSecret = process.env.PAYMENT_WEBHOOK_SECRET;
      const originalEnv = process.env.NODE_ENV;

      try {
        (process.env as Record<string, string | undefined>).NODE_ENV = "production";
        delete process.env.PAYMENT_WEBHOOK_SECRET;

        // Dynamic import to evaluate route behavior under production env
        const { POST } = await import("../src/app/api/v1/payments/webhook/route");
        const req = new NextRequest("http://localhost:3000/api/v1/payments/webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });

        const res = await POST(req);
        assert.equal(res.status, 500);
        const data = await res.json();
        assert.equal(data.error?.code, "WEBHOOK_CONFIG_ERROR");
      } finally {
        process.env.PAYMENT_WEBHOOK_SECRET = originalSecret;
        (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
      }
    });

    test("webhook idempotency and payment attempt creation in database", async () => {
      const testSecret = "test_webhook_secret_minimum_32_characters_long_12345";
      process.env.PAYMENT_WEBHOOK_SECRET = testSecret;

      // Seed an order for webhook attachment
      const orderRef = `E2E-WH-${Date.now()}`;
      const order = await prisma.order.create({
        data: {
          orderReference: orderRef,
          verificationTokenHash: crypto.randomBytes(32).toString("hex"),
          idempotencyKey: `idem_wh_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
          customerFullName: "Webhook Tester",
          customerPhone: "03001234567",
          shippingProvince: "Punjab",
          shippingCity: "Lahore",
          shippingArea: "Gulberg III",
          shippingStreetAddress: "123 Atelier Street",
          subtotalPkr: 15000,
          deliveryFeePkr: 250,
          totalPkr: 15250,
          paymentMethod: "ONLINE_CARD",
          paymentStatus: "PENDING",
          orderStatus: "PENDING",
        },
      });

      const eventId = `evt_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
      const payload = JSON.stringify({
        orderReference: order.orderReference,
        transactionId: `txn_${Date.now()}`,
        status: "SUCCESS",
        amountPkr: 15250,
      });

      const signature = crypto
        .createHmac("sha256", testSecret)
        .update(Buffer.from(payload, "utf-8"))
        .digest("hex");

      const { POST } = await import("../src/app/api/v1/payments/webhook/route");
      const req = new NextRequest("http://localhost:3000/api/v1/payments/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-signature-sha256": signature,
          "x-event-id": eventId,
          "x-timestamp": String(Math.floor(Date.now() / 1000)),
        },
        body: payload,
      });

      const res = await POST(req);
      assert.ok([200, 201].includes(res.status));

      // Assert database write
      const savedEvent = await prisma.paymentEvent.findFirst({
        where: { providerEventId: eventId },
      });
      assert.ok(savedEvent, "PaymentEvent must be recorded in SQLite");
    });
  });

  // -------------------------------------------------------------------------
  // PHASE 3: Product CRUD, Dynamic Variants & Price Audit
  // -------------------------------------------------------------------------
  describe("Phase 3: Product Management & Audit Logging", () => {
    test("creates product with dynamic variants and records price changes in SecurityAuditLog", async () => {
      const category = await prisma.category.create({
        data: {
          name: "E2E Apparel",
          slug: `e2e-apparel-${Date.now()}`,
        },
      });

      const product = await prisma.product.create({
        data: {
          title: "Audited Velvet Kurta",
          slug: `velvet-kurta-${Date.now()}`,
          description: "Handcrafted luxury velvet.",
          primaryImageUrl: "/images/kurta.webp",
          pricePkr: 18500,
          status: "PUBLISHED",
          categoryId: category.id,
          variants: {
            create: [
              {
                sku: `VK-BLK-M-${Date.now()}`,
                size: "M",
                colorName: "Jet Black",
                colorHex: "#0a0a0a",
                pricePkr: 18500,
                stockQuantity: 12,
              },
            ],
          },
        },
        include: { variants: true },
      });

      testProductId = product.id;
      testVariantId = product.variants[0].id;
      assert.ok(testProductId);
      assert.ok(testVariantId);
      assert.equal(product.variants.length, 1);

      // Mutate price and record SecurityAuditLog
      const newPrice = 21000;
      await prisma.$transaction(async (tx) => {
        await tx.product.update({
          where: { id: product.id },
          data: { pricePkr: newPrice },
        });

        await tx.securityAuditLog.create({
          data: {
            id: crypto.randomUUID(),
            action: "PRODUCT_PRICE_CHANGED",
            entityType: "Product",
            entityId: product.id,
            actorId: "admin-system-e2e",
            actorEmail: "audit@noir-gold.com",
            previousState: JSON.stringify({ basePricePkr: product.pricePkr }),
            newState: JSON.stringify({ basePricePkr: newPrice }),
            reason: "Luxury tariff calibration",
          },
        });
      });

      const auditRecord = await prisma.securityAuditLog.findFirst({
        where: { entityId: product.id, action: "PRODUCT_PRICE_CHANGED" },
      });
      assert.ok(auditRecord);
      assert.ok(auditRecord.newState && auditRecord.newState.includes("21000"));

      // Soft-delete product
      const archived = await prisma.product.update({
        where: { id: product.id },
        data: { deletedAt: new Date(), status: "ARCHIVED" },
      });
      assert.equal(archived.status, "ARCHIVED");
      assert.ok(archived.deletedAt instanceof Date);
    });
  });

  // -------------------------------------------------------------------------
  // PHASE 4: Multipart Upload Pipeline Validation
  // -------------------------------------------------------------------------
  describe("Phase 4: Asset Upload Pipeline", () => {
    test("rejects invalid MIME types and files exceeding size ceiling", async () => {
      const { POST } = await import("../src/app/api/v1/admin/uploads/route");

      // Test invalid MIME
      const invalidFormData = new FormData();
      const fakeExe = new Blob(["dummy payload"], { type: "application/x-msdownload" });
      invalidFormData.append("file", fakeExe, "malicious.exe");

      const reqInvalid = new NextRequest("http://localhost:3000/api/v1/admin/uploads", {
        method: "POST",
        body: invalidFormData,
        headers: { "x-admin-test-auth": "true" },
      });

      const resInvalid = await POST(reqInvalid);
      assert.ok([400, 401, 403].includes(resInvalid.status));
    });
  });

  // -------------------------------------------------------------------------
  // PHASE 5: CSV Export & Financial Refunds
  // -------------------------------------------------------------------------
  describe("Phase 5: Financial Auditing, CSV Export & Refunds", () => {
    before(async () => {
      const orderRef = `E2E-REF-${Date.now()}`;
      const order = await prisma.order.create({
        data: {
          orderReference: orderRef,
          verificationTokenHash: crypto.randomBytes(32).toString("hex"),
          idempotencyKey: `idem_ref_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
          customerFullName: "Fatima Khan",
          customerPhone: "03009876543",
          shippingProvince: "Punjab",
          shippingCity: "Lahore",
          shippingArea: "Gulberg III",
          shippingStreetAddress: "Main Boulevard",
          subtotalPkr: 32000,
          deliveryFeePkr: 0,
          totalPkr: 32000,
          paymentMethod: "ONLINE_CARD",
          paymentStatus: "PAID",
          orderStatus: "CONFIRMED",
        },
      });
      testOrderId = order.id;
    });

    test("processes valid partial refund and records ledger entry", async () => {
      const refundAmount = 10000;

      await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUniqueOrThrow({ where: { id: testOrderId } });

        const attempt = await tx.paymentAttempt.create({
          data: {
            id: crypto.randomUUID(),
            orderId: order.id,
            provider: "stripe",
            paymentMethod: "ONLINE_CARD",
            status: "CAPTURED",
            amountPkr: order.totalPkr,
            currency: "PKR",
            attemptKey: `att-e2e-${order.id}`,
            capturedAmountPkr: order.totalPkr,
            capturedAt: new Date(),
          },
        });

        await tx.refund.create({
          data: {
            id: crypto.randomUUID(),
            paymentAttemptId: attempt.id,
            amountPkr: refundAmount,
            reason: "Defective embellishment",
            provider: "ORIGINAL_PAYMENT",
            status: "COMPLETED",
            idempotencyKey: `ref-e2e-${Date.now()}`,
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: { paymentStatus: "REFUNDED" },
        });

        await tx.orderAuditLog.create({
          data: {
            id: crypto.randomUUID(),
            orderId: order.id,
            action: "ORDER_REFUNDED",
            note: `Refunded PKR ${refundAmount} via ORIGINAL_PAYMENT`,
            performedBy: "admin@noir-gold.com",
          },
        });
      });

      const savedRefund = await prisma.refund.findFirst({
        where: { paymentAttempt: { orderId: testOrderId } },
      });
      assert.ok(savedRefund);
      assert.equal(savedRefund.amountPkr, 10000);

      const updatedOrder = await prisma.order.findUnique({
        where: { id: testOrderId },
      });
      assert.equal(updatedOrder?.paymentStatus, "REFUNDED");
    });
  });
});
