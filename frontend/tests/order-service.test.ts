import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { copyFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import type { CreateOrderRequestDTO } from "../src/types";
import type { AdminUser } from "../src/types";

const repositoryRoot = path.resolve(__dirname, "..", "..");
const temporaryDirectory = mkdtempSync(path.join(tmpdir(), "noir-order-test-"));
const testDatabasePath = path.join(temporaryDirectory, "orders.sqlite");
process.env.DATABASE_URL = `file:${testDatabasePath.replace(/\\/g, "/")}`;
process.env.ORDER_VERIFICATION_SECRET = randomBytes(32).toString("hex");

// Clone the already-applied development schema into an isolated test database.
// This keeps tests disposable without running schema-push tooling in this task.
copyFileSync(path.join(repositoryRoot, "backend", "prisma", "dev.db"), testDatabasePath);

// The payment/inventory reservation models exist in schema.prisma but had no
// applied migration, so this isolated test database provisions the reservation
// table it needs (the checkout/admin tables already exist in dev.db).
const prismaCli = path.join(repositoryRoot, "node_modules", "prisma", "build", "index.js");
const reservationTableSql = `
CREATE TABLE IF NOT EXISTS "InventoryReservation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "productVariantId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "activeReservationKey" TEXT,
  "expiresAt" DATETIME,
  "consumedAt" DATETIME,
  "releasedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "InventoryReservation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "InventoryReservation_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "InventoryReservation_activeReservationKey_key" ON "InventoryReservation"("activeReservationKey");
CREATE INDEX IF NOT EXISTS "InventoryReservation_orderId_status_idx" ON "InventoryReservation"("orderId", "status");
CREATE INDEX IF NOT EXISTS "InventoryReservation_productVariantId_status_idx" ON "InventoryReservation"("productVariantId", "status");
CREATE INDEX IF NOT EXISTS "InventoryReservation_status_expiresAt_idx" ON "InventoryReservation"("status", "expiresAt");
`;
execFileSync(process.execPath, [prismaCli, "db", "execute", "--stdin", "--url", process.env.DATABASE_URL!], {
  cwd: repositoryRoot,
  input: reservationTableSql,
  stdio: ["pipe", "pipe", "pipe"],
});

let prisma: import("@prisma/client").PrismaClient;
let createOrder: typeof import("../src/lib/order-service").createOrder;
let getVerifiedOrder: typeof import("../src/lib/order-service").getVerifiedOrder;
let getPersistentAdminOrders: typeof import("../src/lib/admin-order-read-service").getPersistentAdminOrders;
let getPersistentAdminOrder: typeof import("../src/lib/admin-order-read-service").getPersistentAdminOrder;
let normalizeAdminOrderPagination: typeof import("../src/lib/admin-order-read-service").normalizeAdminOrderPagination;
let updatePersistentAdminOrder: typeof import("../src/lib/admin-order-update-service").updatePersistentAdminOrder;
let getInventoryVariants: typeof import("../src/lib/admin-inventory-service").getInventoryVariants;
let getInventoryAuditLogs: typeof import("../src/lib/admin-inventory-service").getInventoryAuditLogs;
let adjustVariantStock: typeof import("../src/lib/admin-inventory-service").adjustVariantStock;
let getAdminDashboardMetrics: typeof import("../src/lib/admin-service").getAdminDashboardMetrics;
const setupPromise = Promise.all([
  import("../src/lib/prisma"),
  import("../src/lib/order-service"),
  import("../src/lib/admin-order-read-service"),
  import("../src/lib/admin-order-update-service"),
  import("../src/lib/admin-inventory-service"),
  import("../src/lib/admin-service"),
]).then(([prismaModule, orderService, adminReadService, adminUpdateService, inventoryService, adminService]) => {
  prisma = prismaModule.prisma;
  createOrder = orderService.createOrder;
  getVerifiedOrder = orderService.getVerifiedOrder;
  getPersistentAdminOrders = adminReadService.getPersistentAdminOrders;
  getPersistentAdminOrder = adminReadService.getPersistentAdminOrder;
  normalizeAdminOrderPagination = adminReadService.normalizeAdminOrderPagination;
  updatePersistentAdminOrder = adminUpdateService.updatePersistentAdminOrder;
  getInventoryVariants = inventoryService.getInventoryVariants;
  getInventoryAuditLogs = inventoryService.getInventoryAuditLogs;
  adjustVariantStock = inventoryService.adjustVariantStock;
  getAdminDashboardMetrics = adminService.getAdminDashboardMetrics;
});

after(async () => {
  await setupPromise.catch(() => undefined);
  if (prisma) await prisma.$disconnect();
  rmSync(temporaryDirectory, { recursive: true, force: true });
});

interface VariantFixture {
  sku: string;
  size: string;
  colorName: string;
  stockQuantity: number;
  isActive?: boolean;
}

async function resetCatalog() {
  await prisma.inventoryReservation.deleteMany();
  await prisma.inventoryAuditLog.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  const category = await prisma.category.create({
    data: { name: "Test Category", slug: "test-category" },
  });
  return category.id;
}

async function createProduct(
  categoryId: string,
  options: {
    id: string;
    pricePkr: number;
    salePricePkr?: number | null;
    variants: VariantFixture[];
  }
) {
  return prisma.product.create({
    data: {
      id: options.id,
      categoryId,
      title: `Title ${options.id}`,
      slug: options.id,
      description: "Test product",
      primaryImageUrl: "/images/test-product.jpg",
      pricePkr: options.pricePkr,
      salePricePkr: options.salePricePkr ?? null,
      status: "PUBLISHED",
      variants: {
        create: options.variants.map((variant) => ({
          sku: variant.sku,
          size: variant.size,
          colorName: variant.colorName,
          colorHex: "#111111",
          pricePkr: options.pricePkr,
          stockQuantity: variant.stockQuantity,
          isActive: variant.isActive ?? true,
        })),
      },
    },
    include: { variants: true },
  });
}

function request(
  productId: string,
  quantity = 1,
  idempotencyKey = "test-order-key",
  customer: CreateOrderRequestDTO["customer"] = {
    fullName: "Test Customer",
    phone: "03001234567",
    email: "test@example.com",
    province: "Sindh",
    city: "Karachi",
    area: "Clifton",
    streetAddress: "House 10, Test Street",
  }
): CreateOrderRequestDTO {
  return {
    customer,
    items: [{ productId, size: "M", color: "Obsidian Black", quantity }],
    idempotencyKey,
  };
}

const adminActor: AdminUser = {
  id: "test-admin",
  email: "admin@example.test",
  name: "Test Admin",
  role: "ADMIN",
  createdAt: new Date(0).toISOString(),
};

async function createAdminOrder(orderReference: string, overrides: Record<string, unknown> = {}) {
  return prisma.order.create({
    data: {
      orderReference,
      verificationTokenHash: `v1:${randomBytes(32).toString("hex")}`,
      idempotencyKey: `admin-${randomBytes(16).toString("hex")}`,
      customerFullName: "Transition Customer",
      customerPhone: "03001234567",
      shippingProvince: "Sindh",
      shippingCity: "Karachi",
      shippingArea: "Clifton",
      shippingStreetAddress: "House 10, Test Street",
      subtotalPkr: 5000,
      discountTotalPkr: 0,
      deliveryFeePkr: 250,
      totalPkr: 5250,
      paymentMethod: "CASH_ON_DELIVERY",
      paymentStatus: "PENDING",
      orderStatus: "PENDING",
      ...overrides,
    },
  });
}

test("persistent guest order creation, rollback, concurrency and verification", async (t) => {
  await setupPromise;
  await t.test("creates order snapshots, COD states, savings, shipping and verified retrieval", async () => {
    const categoryId = await resetCatalog();
    const product = await createProduct(categoryId, {
      id: "product-five-thousand",
      pricePkr: 5000,
      salePricePkr: 6000,
      variants: [{ sku: "TEST-5000-M-BLK", size: "M", colorName: "Obsidian Black", stockQuantity: 4 }],
    });

    const result = await createOrder(request(product.id));
    assert.equal(result.success, true);
    assert.equal(result.totalPkr, 5250);
    assert.match(result.verificationToken || "", /^v1\.[A-Za-z0-9_-]{43}$/);

    const saved = await prisma.order.findUnique({
      where: { orderReference: result.orderReference },
      include: { items: true, auditLogs: true },
    });
    assert.ok(saved);
    assert.equal(saved.paymentMethod, "CASH_ON_DELIVERY");
    assert.equal(saved.paymentStatus, "PENDING");
    assert.equal(saved.orderStatus, "PENDING");
    assert.equal(saved.subtotalPkr, 5000);
    assert.equal(saved.discountTotalPkr, 1000);
    assert.equal(saved.deliveryFeePkr, 250);
    assert.equal(saved.totalPkr, 5250);
    assert.ok(saved.verificationTokenHash.startsWith("v1:"));
    assert.notEqual(saved.verificationTokenHash, result.verificationToken);
    assert.equal(saved.items[0].unitPricePkr, 5000);
    assert.equal(saved.items[0].discountPkr, 1000);
    assert.equal(saved.items[0].lineTotalPkr, 5000);
    assert.equal(saved.auditLogs[0].action, "ORDER_CREATED");

    const verified = await getVerifiedOrder(result.orderReference!, result.verificationToken!);
    assert.equal(verified?.customer.fullName, "Test Customer");
    assert.equal(verified?.auditLogs, undefined);
    assert.equal(verified?.idempotencyKey, undefined);
    assert.equal(await getVerifiedOrder(result.orderReference!, `${result.verificationToken}x`), null);
    assert.equal((await prisma.productVariant.findUnique({ where: { id: product.variants[0].id } }))?.stockQuantity, 3);
  });

  await t.test("public order routes preserve token access and idempotent stock behavior", async () => {
    const categoryId = await resetCatalog();
    const product = await createProduct(categoryId, {
      id: "product-route-checkout",
      pricePkr: 1000,
      variants: [{ sku: "TEST-ROUTE-CHECKOUT-M-BLK", size: "M", colorName: "Obsidian Black", stockQuantity: 3 }],
    });
    const { NextRequest } = await import("next/server");
    const { POST } = await import("../src/app/api/v1/orders/route");
    const { GET } = await import("../src/app/api/v1/orders/[orderReference]/route");
    const payload = request(product.id, 1, "route-idempotency-key");

    const firstResponse = await POST(new NextRequest("http://localhost/api/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }));
    assert.equal(firstResponse.status, 201);
    const first = await firstResponse.json();
    assert.equal(first.success, true);
    assert.equal((await prisma.productVariant.findUnique({ where: { id: product.variants[0].id } }))?.stockQuantity, 2);

    const validGuestResponse = await GET(new NextRequest(
      `http://localhost/api/v1/orders/${first.orderReference}?token=${encodeURIComponent(first.verificationToken)}`,
    ), { params: Promise.resolve({ orderReference: first.orderReference }) });
    assert.equal(validGuestResponse.status, 200);
    const validGuest = await validGuestResponse.json();
    assert.equal(validGuest.order.orderReference, first.orderReference);
    assert.equal(Object.hasOwn(validGuest.order, "verificationTokenHash"), false);

    const invalidGuestResponse = await GET(new NextRequest(
      `http://localhost/api/v1/orders/${first.orderReference}?token=invalid-token`,
    ), { params: Promise.resolve({ orderReference: first.orderReference }) });
    assert.equal(invalidGuestResponse.status, 404);

    const replayResponse = await POST(new NextRequest("http://localhost/api/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }));
    const replay = await replayResponse.json();
    assert.equal(replay.success, true);
    assert.equal(replay.orderReference, first.orderReference);
    assert.equal((await prisma.productVariant.findUnique({ where: { id: product.variants[0].id } }))?.stockQuantity, 2);

    const mismatchResponse = await POST(new NextRequest("http://localhost/api/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request(product.id, 2, "route-idempotency-key")),
    }));
    assert.equal(mismatchResponse.status, 409);
    assert.equal((await prisma.productVariant.findUnique({ where: { id: product.variants[0].id } }))?.stockQuantity, 2);
  });

  await t.test("replays the same key with the same token and rejects a different payload", async () => {
    const categoryId = await resetCatalog();
    const product = await createProduct(categoryId, {
      id: "product-replay",
      pricePkr: 5000,
      variants: [{ sku: "TEST-REPLAY-M-BLK", size: "M", colorName: "Obsidian Black", stockQuantity: 3 }],
    });
    const original = request(product.id, 1, "stable-replay-key");
    const first = await createOrder(original);
    const replay = await createOrder(original);
    assert.equal(replay.orderReference, first.orderReference);
    assert.equal(replay.verificationToken, first.verificationToken);
    assert.equal(await prisma.order.count(), 1);
    assert.equal((await prisma.productVariant.findUnique({ where: { id: product.variants[0].id } }))?.stockQuantity, 2);

    const mismatch = await createOrder(request(product.id, 2, "stable-replay-key"));
    assert.equal(mismatch.success, false);
    assert.equal(mismatch.error?.code, "IDEMPOTENCY_KEY_REUSED");
    assert.equal(await prisma.order.count(), 1);
  });

  await t.test("uses free delivery exactly at the threshold", async () => {
    const categoryId = await resetCatalog();
    const product = await createProduct(categoryId, {
      id: "product-threshold",
      pricePkr: 7500,
      variants: [{ sku: "TEST-THRESHOLD-M-BLK", size: "M", colorName: "Obsidian Black", stockQuantity: 1 }],
    });
    const result = await createOrder(request(product.id, 1, "threshold-key"));
    assert.equal(result.success, true);
    assert.equal(result.totalPkr, 7500);
    assert.equal((await prisma.order.findUnique({ where: { orderReference: result.orderReference } }))?.deliveryFeePkr, 0);
  });

  await t.test("rejects fractional, zero, and string quantities", async () => {
    const categoryId = await resetCatalog();
    const product = await createProduct(categoryId, {
      id: "product-invalid-quantity",
      pricePkr: 1000,
      variants: [{ sku: "TEST-INVALID-M-BLK", size: "M", colorName: "Obsidian Black", stockQuantity: 5 }],
    });
    for (const quantity of [1.5, 0, "1"] as unknown[]) {
      const result = await createOrder(request(product.id, quantity as number, `invalid-${String(quantity)}`));
      assert.equal(result.success, false);
      assert.equal(result.error?.code, "INVALID_QUANTITY");
    }
    assert.equal(await prisma.order.count(), 0);
  });

  await t.test("rejects malformed customer and order-line payloads", async () => {
    await resetCatalog();
    const malformedCustomer = await createOrder(null as unknown as CreateOrderRequestDTO);
    assert.equal(malformedCustomer.success, false);
    assert.equal(malformedCustomer.error?.code, "VALIDATION_FAILED");

    const malformedLine = await createOrder({
      customer: {
        fullName: "Test Customer",
        phone: "03001234567",
        province: "Sindh",
        city: "Karachi",
        area: "Clifton",
        streetAddress: "House 10, Test Street",
      },
      items: [{ productId: 42, size: "M", color: "Obsidian Black", quantity: 1 }] as unknown as CreateOrderRequestDTO["items"],
      idempotencyKey: "malformed-line-key",
    });
    assert.equal(malformedLine.success, false);
    assert.equal(malformedLine.error?.code, "VALIDATION_FAILED");
    assert.equal(await prisma.order.count(), 0);
  });

  await t.test("rejects inactive, unavailable, and insufficient variants", async () => {
    const categoryId = await resetCatalog();
    const product = await createProduct(categoryId, {
      id: "product-variant-checks",
      pricePkr: 1000,
      variants: [
        { sku: "TEST-INACTIVE-L-BLK", size: "L", colorName: "Obsidian Black", stockQuantity: 5, isActive: false },
        { sku: "TEST-LOW-M-BLK", size: "M", colorName: "Obsidian Black", stockQuantity: 1 },
      ],
    });
    const inactiveRequest = request(product.id, 1, "inactive-key", {
      fullName: "Test Customer", phone: "03001234567", province: "Sindh", city: "Karachi",
      area: "Clifton", streetAddress: "House 10, Test Street",
    });
    inactiveRequest.items[0].size = "L";
    const inactive = await createOrder(inactiveRequest);
    assert.equal(inactive.error?.code, "VARIANT_NOT_FOUND");
    const unavailable = await createOrder(request("missing-product", 1, "missing-key"));
    assert.equal(unavailable.error?.code, "PRODUCT_UNAVAILABLE");
    const invalidCombination = request(product.id, 1, "invalid-combination-key");
    invalidCombination.items[0].size = "S";
    const invalidVariant = await createOrder(invalidCombination);
    assert.equal(invalidVariant.error?.code, "VARIANT_NOT_FOUND");
    const insufficient = await createOrder(request(product.id, 2, "low-stock-key"));
    assert.equal(insufficient.error?.code, "INSUFFICIENT_STOCK");
    assert.equal(await prisma.order.count(), 0);
    assert.equal((await prisma.productVariant.findUnique({ where: { id: product.variants[1].id } }))?.stockQuantity, 1);
  });

  await t.test("rolls back earlier stock decrements when a later line cannot be fulfilled", async () => {
    const categoryId = await resetCatalog();
    const first = await createProduct(categoryId, {
      id: "product-a-first",
      pricePkr: 1000,
      variants: [{ sku: "TEST-A-M-BLK", size: "M", colorName: "Obsidian Black", stockQuantity: 5 }],
    });
    const second = await createProduct(categoryId, {
      id: "product-b-last",
      pricePkr: 1000,
      variants: [{ sku: "TEST-B-M-BLK", size: "M", colorName: "Obsidian Black", stockQuantity: 0 }],
    });
    const result = await createOrder({
      ...request(first.id, 2, "rollback-key"),
      items: [
        { productId: first.id, size: "M", color: "Obsidian Black", quantity: 2 },
        { productId: second.id, size: "M", color: "Obsidian Black", quantity: 1 },
      ],
    });
    assert.equal(result.error?.code, "INSUFFICIENT_STOCK");
    assert.equal(await prisma.order.count(), 0);
    assert.equal((await prisma.productVariant.findUnique({ where: { id: first.variants[0].id } }))?.stockQuantity, 5);
    assert.equal((await prisma.productVariant.findUnique({ where: { id: second.variants[0].id } }))?.stockQuantity, 0);
  });

  await t.test("does not oversell the last unit under concurrent requests", async () => {
    const categoryId = await resetCatalog();
    const product = await createProduct(categoryId, {
      id: "product-last-unit",
      pricePkr: 1000,
      variants: [{ sku: "TEST-LAST-M-BLK", size: "M", colorName: "Obsidian Black", stockQuantity: 1 }],
    });
    const results = await Promise.all([
      createOrder(request(product.id, 1, "race-key-a")),
      createOrder(request(product.id, 1, "race-key-b")),
    ]);
    assert.equal(results.filter((result) => result.success).length, 1);
    assert.equal(await prisma.order.count(), 1);
    assert.equal((await prisma.productVariant.findUnique({ where: { id: product.variants[0].id } }))?.stockQuantity, 0);
  });

  await t.test("lists and maps persistent admin orders with filters, search and pagination", async () => {
    await resetCatalog();
    const fixtures = [
      {
        orderReference: "NG-2026-70001",
        idempotencyKey: "admin-read-1",
        verificationTokenHash: `v1:${"1".repeat(64)}`,
        customerFullName: "Alice North",
        customerPhone: "03001110001",
        shippingCity: "Karachi",
        courierTrackingNumber: "TCS-ALICE-70001",
        orderStatus: "PENDING",
        paymentStatus: "PENDING",
        createdAt: new Date("2026-02-01T00:00:00.000Z"),
      },
      {
        orderReference: "NG-2026-70002",
        idempotencyKey: "admin-read-2",
        verificationTokenHash: `v1:${"2".repeat(64)}`,
        customerFullName: "Bob South",
        customerPhone: "03002220002",
        shippingCity: "Lahore",
        courierTrackingNumber: "LEO-BOB-70002",
        orderStatus: "SHIPPED",
        paymentStatus: "PAID",
        createdAt: new Date("2026-02-02T00:00:00.000Z"),
      },
      {
        orderReference: "NG-2026-70003",
        idempotencyKey: "admin-read-3",
        verificationTokenHash: `v1:${"3".repeat(64)}`,
        customerFullName: "Carol East",
        customerPhone: "03003330003",
        shippingCity: "Islamabad",
        courierTrackingNumber: "TRAX-CAROL-70003",
        orderStatus: "DELIVERED",
        paymentStatus: "PAID",
        createdAt: new Date("2026-02-03T00:00:00.000Z"),
      },
    ];
    for (const fixture of fixtures) {
      await prisma.order.create({
        data: {
          ...fixture,
          customerEmail: `${fixture.customerFullName.split(" ")[0].toLowerCase()}@example.com`,
          shippingProvince: "Sindh",
          shippingArea: "Test Area",
          shippingStreetAddress: "10 Test Street",
          subtotalPkr: 5000,
          discountTotalPkr: 250,
          deliveryFeePkr: 250,
          totalPkr: 5250,
          courierName: fixture.orderStatus === "PENDING" ? null : "Courier",
          items: {
            create: [{
              productId: "snapshot-product",
              variantId: "snapshot-variant",
              sku: `SKU-${fixture.orderReference}`,
              productTitle: `Snapshot ${fixture.customerFullName}`,
              productSlug: `snapshot-${fixture.orderReference}`,
              categoryName: "Snapshot Category",
              size: "M",
              color: "Obsidian Black",
              imageUrl: "/images/snapshot.jpg",
              unitPricePkr: 5000,
              quantity: 1,
              lineSubtotalPkr: 5000,
              discountPkr: 250,
              lineTotalPkr: 5000,
            }],
          },
          auditLogs: {
            create: [{
              action: "ORDER_CREATED",
              performedBy: "Customer Checkout",
              note: "Persistent fixture",
              newStatus: "PENDING",
            }],
          },
        },
      });
    }

    const list = await getPersistentAdminOrders();
    assert.equal(list.total, 3);
    assert.deepEqual(list.orders.map((order) => order.orderReference), [
      "NG-2026-70003",
      "NG-2026-70002",
      "NG-2026-70001",
    ]);
    const firstPage = await getPersistentAdminOrders({ limit: 1 });
    assert.equal(firstPage.total, 3);
    assert.equal(firstPage.orders[0].orderReference, "NG-2026-70003");
    const secondPage = await getPersistentAdminOrders({ limit: 1, offset: 1 });
    assert.equal(secondPage.orders[0].orderReference, "NG-2026-70002");
    assert.equal((await getPersistentAdminOrders({ status: "SHIPPED" })).total, 1);
    assert.equal((await getPersistentAdminOrders({ paymentStatus: "PENDING" })).total, 1);
    assert.equal((await getPersistentAdminOrders({ status: "CANCELLED" })).total, 0);

    const searches = [
      ["NG-2026-70001", "NG-2026-70001"],
      ["Alice North", "NG-2026-70001"],
      ["03002220002", "NG-2026-70002"],
      ["Islamabad", "NG-2026-70003"],
      ["LEO-BOB-70002", "NG-2026-70002"],
    ] as const;
    for (const [search, expectedReference] of searches) {
      const result = await getPersistentAdminOrders({ search });
      assert.equal(result.total, 1, `search ${search}`);
      assert.equal(result.orders[0].orderReference, expectedReference);
    }

    assert.deepEqual(normalizeAdminOrderPagination(undefined, undefined), { limit: 50, offset: 0 });
    assert.deepEqual(normalizeAdminOrderPagination(-5, -2), { limit: 1, offset: 0 });
    assert.deepEqual(normalizeAdminOrderPagination(1000, 1.5), { limit: 100, offset: 0 });
    assert.deepEqual(normalizeAdminOrderPagination(Number.NaN, Number.MAX_SAFE_INTEGER + 1), { limit: 50, offset: 0 });

    const detail = await getPersistentAdminOrder("NG-2026-70002");
    assert.ok(detail);
    assert.equal(detail.customer.fullName, "Bob South");
    assert.equal(detail.items[0].title, "Snapshot Bob South");
    assert.equal(detail.items[0].sku, "SKU-NG-2026-70002");
    assert.equal(detail.items[0].size, "M");
    assert.equal(detail.courierInfo?.trackingNumber, "LEO-BOB-70002");
    assert.equal(detail.auditLogs?.[0].action, "ORDER_CREATED");
    assert.equal(detail.totalPkr, 5250);
    for (const forbidden of ["verificationToken", "verificationTokenHash", "idempotencyKey"]) {
      assert.equal(Object.hasOwn(detail, forbidden), false, `${forbidden} omitted from DTO`);
    }
    assert.equal(await getPersistentAdminOrder("missing-order"), null);
  });

  await t.test("dashboard analytics use persistent orders and variant stock", async () => {
    const categoryId = await resetCatalog();
    await createProduct(categoryId, {
      id: "product-analytics",
      pricePkr: 1000,
      variants: [
        { sku: "TEST-ANALYTICS-OUT", size: "S", colorName: "Black", stockQuantity: 0 },
        { sku: "TEST-ANALYTICS-LOW", size: "M", colorName: "Black", stockQuantity: 2 },
        { sku: "TEST-ANALYTICS-IN", size: "L", colorName: "Black", stockQuantity: 4 },
      ],
    });
    await createAdminOrder("NG-2026-90001", { orderStatus: "PENDING", paymentStatus: "PENDING", totalPkr: 1000 });
    await createAdminOrder("NG-2026-90002", { orderStatus: "CONFIRMED", paymentStatus: "PENDING", totalPkr: 1100 });
    await createAdminOrder("NG-2026-90003", { orderStatus: "PROCESSING", paymentStatus: "PENDING", totalPkr: 1200 });
    await createAdminOrder("NG-2026-90004", { orderStatus: "SHIPPED", paymentStatus: "PENDING", totalPkr: 1300 });
    await createAdminOrder("NG-2026-90005", { orderStatus: "DELIVERED", paymentStatus: "PAID", totalPkr: 2000 });
    await createAdminOrder("NG-2026-90006", { orderStatus: "CANCELLED", paymentStatus: "PENDING", totalPkr: 3000 });
    await createAdminOrder("NG-2026-90007", { orderStatus: "FAILED_DELIVERY", paymentStatus: "PENDING", totalPkr: 4000 });

    assert.deepEqual(await getAdminDashboardMetrics(), {
      totalOrders: 7,
      pendingOrders: 1,
      confirmedOrders: 1,
      processingOrders: 1,
      shippedOrders: 1,
      deliveredOrders: 1,
      cancelledOrders: 2,
      totalCollectedRevenuePkr: 2000,
      pendingRevenuePkr: 6600,
      lowStockVariantCount: 1,
      outOfStockVariantCount: 1,
      totalProductsCount: 1,
    });
  });

  await t.test("admin order GET route still requires an authenticated session", async () => {
    const { NextRequest } = await import("next/server");
    const { GET } = await import("../src/app/api/v1/admin/orders/route");
    const response = await GET(new NextRequest("http://localhost/api/v1/admin/orders"));
    assert.equal(response.status, 401);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, "UNAUTHORIZED");

    const { GET: getDetail } = await import("../src/app/api/v1/admin/orders/[orderReference]/route");
    const detailResponse = await getDetail(
      new NextRequest("http://localhost/api/v1/admin/orders/NG-2026-70001"),
      { params: Promise.resolve({ orderReference: "NG-2026-70001" }) }
    );
    assert.equal(detailResponse.status, 401);
    const detailBody = await detailResponse.json();
    assert.equal(detailBody.error.code, "UNAUTHORIZED");

    const { PATCH } = await import("../src/app/api/v1/admin/orders/[orderReference]/route");
    const patchResponse = await PATCH(
      new NextRequest("http://localhost/api/v1/admin/orders/NG-2026-70001", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus: "CONFIRMED" }),
      }),
      { params: Promise.resolve({ orderReference: "NG-2026-70001" }) }
    );
    assert.equal(patchResponse.status, 401);
    const patchBody = await patchResponse.json();
    assert.equal(patchBody.error.code, "UNAUTHORIZED");

    const { GET: getInventory } = await import("../src/app/api/v1/admin/inventory/route");
    const inventoryResponse = await getInventory(new NextRequest("http://localhost/api/v1/admin/inventory"));
    assert.equal(inventoryResponse.status, 401);

    const { GET: getAnalytics } = await import("../src/app/api/v1/admin/analytics/route");
    const analyticsResponse = await getAnalytics(new NextRequest("http://localhost/api/v1/admin/analytics"));
    assert.equal(analyticsResponse.status, 401);
  });

  await t.test("persists valid status changes, enforces transitions, ignores overrides, and audits payment changes", async () => {
    await resetCatalog();
    const order = await createAdminOrder("NG-2026-81001");

    const bypassAttempt = await updatePersistentAdminOrder(order.orderReference, {
      orderStatus: "SHIPPED",
      overrideValidation: true,
      courierInfo: { courierName: "TCS", trackingNumber: "TCS-81001" },
    }, adminActor);
    assert.equal(bypassAttempt.success, false);
    if (!bypassAttempt.success) assert.equal(bypassAttempt.code, "INVALID_TRANSITION");
    assert.equal((await prisma.order.findUnique({ where: { id: order.id } }))?.orderStatus, "PENDING");

    const missingReason = await updatePersistentAdminOrder(order.orderReference, { orderStatus: "CANCELLED" }, adminActor);
    assert.equal(missingReason.success, false);
    if (!missingReason.success) assert.equal(missingReason.code, "VALIDATION_FAILED");

    const confirmed = await updatePersistentAdminOrder(order.orderReference, {
      orderStatus: "CONFIRMED",
      note: "Verified by telephone",
      overrideValidation: true,
    }, adminActor);
    assert.equal(confirmed.success, true);
    if (confirmed.success) assert.equal(confirmed.order.orderStatus, "CONFIRMED");
    assert.equal(await prisma.orderAuditLog.count({ where: { orderId: order.id } }), 1);

    const repeated = await updatePersistentAdminOrder(order.orderReference, {
      orderStatus: "CONFIRMED",
      overrideValidation: true,
    }, adminActor);
    assert.equal(repeated.success, true);
    assert.equal(await prisma.orderAuditLog.count({ where: { orderId: order.id } }), 1);

    const payment = await updatePersistentAdminOrder(order.orderReference, {
      paymentStatus: "PAID",
      note: "Courier remittance received",
    }, adminActor);
    assert.equal(payment.success, true);
    const paymentAudit = await prisma.orderAuditLog.findFirst({
      where: { orderId: order.id, action: "PAYMENT_STATUS_UPDATED" },
    });
    assert.match(paymentAudit?.note || "", /PENDING to PAID/);
    assert.equal(paymentAudit?.performedBy, "Test Admin (ADMIN)");
    assert.equal(paymentAudit?.previousStatus, "PENDING");
    assert.equal(paymentAudit?.newStatus, "PAID");

    const invalidPayment = await updatePersistentAdminOrder(order.orderReference, {
      paymentStatus: "COLLECTED",
    }, adminActor);
    assert.equal(invalidPayment.success, false);
    if (!invalidPayment.success) assert.equal(invalidPayment.code, "VALIDATION_FAILED");

    const malformedField = await updatePersistentAdminOrder(order.orderReference, {
      orderStatus: "CONFIRMED",
      unexpected: true,
    }, adminActor);
    assert.equal(malformedField.success, false);
    if (!malformedField.success) assert.equal(malformedField.code, "VALIDATION_FAILED");
  });

  await t.test("requires courier data to ship and persists it on the valid transition", async () => {
    await resetCatalog();
    const order = await createAdminOrder("NG-2026-81002", { orderStatus: "PROCESSING" });
    const missingCourier = await updatePersistentAdminOrder(order.orderReference, { orderStatus: "SHIPPED" }, adminActor);
    assert.equal(missingCourier.success, false);
    if (!missingCourier.success) assert.equal(missingCourier.code, "VALIDATION_FAILED");

    const shipped = await updatePersistentAdminOrder(order.orderReference, {
      orderStatus: "SHIPPED",
      courierInfo: { courierName: "Leopards", trackingNumber: "LEO-81002" },
    }, adminActor);
    assert.equal(shipped.success, true);
    if (shipped.success) {
      assert.equal(shipped.order.courierInfo?.courierName, "Leopards");
      assert.equal(shipped.order.courierInfo?.trackingNumber, "LEO-81002");
    }
  });

  await t.test("restores inventory and audits a successful cancellation exactly once", async () => {
    const categoryId = await resetCatalog();
    const product = await createProduct(categoryId, {
      id: "product-cancel-restock",
      pricePkr: 1000,
      variants: [{ sku: "TEST-CANCEL-M-BLK", size: "M", colorName: "Obsidian Black", stockQuantity: 4 }],
    });
    const order = await createAdminOrder("NG-2026-81003", { orderStatus: "PROCESSING" });
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: product.id,
        variantId: product.variants[0].id,
        sku: product.variants[0].sku,
        productTitle: product.title,
        productSlug: product.slug,
        categoryName: "Test Category",
        size: "M",
        color: "Obsidian Black",
        imageUrl: product.primaryImageUrl,
        catalogProductId: product.id,
        catalogVariantId: product.variants[0].id,
        unitPricePkr: 1000,
        quantity: 2,
        lineSubtotalPkr: 2000,
        discountPkr: 0,
        lineTotalPkr: 2000,
      },
    });
    const cancelled = await updatePersistentAdminOrder(order.orderReference, {
      orderStatus: "CANCELLED",
      cancellationReason: "Customer requested cancellation",
    }, adminActor);
    assert.equal(cancelled.success, true);
    if (cancelled.success) assert.equal(cancelled.order.cancellationReason, "Customer requested cancellation");
    assert.equal((await prisma.productVariant.findUnique({ where: { id: product.variants[0].id } }))?.stockQuantity, 6);
    const restockLogs = await prisma.inventoryAuditLog.findMany({ where: { orderId: order.id } });
    assert.equal(restockLogs.length, 1);
    assert.equal(restockLogs[0].previousStock, 4);
    assert.equal(restockLogs[0].newStock, 6);
    assert.equal(restockLogs[0].adjustmentDelta, 2);

    const repeated = await updatePersistentAdminOrder(order.orderReference, {
      orderStatus: "CANCELLED",
      cancellationReason: "Customer requested cancellation",
    }, adminActor);
    assert.equal(repeated.success, true);
    assert.equal((await prisma.productVariant.findUnique({ where: { id: product.variants[0].id } }))?.stockQuantity, 6);
    assert.equal(await prisma.inventoryAuditLog.count({ where: { orderId: order.id } }), 1);
  });

  await t.test("cancellation closes an active reservation without a second restock", async () => {
    const categoryId = await resetCatalog();
    const product = await createProduct(categoryId, {
      id: "product-cancel-reservation",
      pricePkr: 1000,
      variants: [{ sku: "TEST-CANCEL-RES-M-BLK", size: "M", colorName: "Obsidian Black", stockQuantity: 4 }],
    });
    const order = await createAdminOrder("NG-2026-81009", { orderStatus: "PROCESSING" });
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: product.id,
        variantId: product.variants[0].id,
        sku: product.variants[0].sku,
        productTitle: product.title,
        productSlug: product.slug,
        categoryName: "Test Category",
        size: "M",
        color: "Obsidian Black",
        imageUrl: product.primaryImageUrl,
        catalogProductId: product.id,
        catalogVariantId: product.variants[0].id,
        unitPricePkr: 1000,
        quantity: 2,
        lineSubtotalPkr: 2000,
        discountPkr: 0,
        lineTotalPkr: 2000,
      },
    });
    const reservation = await prisma.inventoryReservation.create({
      data: {
        orderId: order.id,
        productVariantId: product.variants[0].id,
        quantity: 2,
        status: "ACTIVE",
        activeReservationKey: "cancel-reservation-key",
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    assert.equal((await prisma.productVariant.findUnique({ where: { id: product.variants[0].id } }))?.stockQuantity, 4);

    const cancelled = await updatePersistentAdminOrder(order.orderReference, {
      orderStatus: "CANCELLED",
      cancellationReason: "Payment window expired",
    }, adminActor);
    assert.equal(cancelled.success, true);

    // Option B: the order-owned restock happens exactly once (4 -> 6) and the
    // reservation is closed without any additional stock movement.
    assert.equal((await prisma.productVariant.findUnique({ where: { id: product.variants[0].id } }))?.stockQuantity, 6);
    assert.equal(await prisma.inventoryAuditLog.count({ where: { orderId: order.id } }), 1);
    const closed = await prisma.inventoryReservation.findUnique({ where: { id: reservation.id } });
    assert.equal(closed?.status, "RELEASED");
    assert.equal(closed?.activeReservationKey, null);
    assert.ok(closed?.releasedAt);
  });

  await t.test("reads and adjusts persistent inventory with validation and audit history", async () => {
    const categoryId = await resetCatalog();
    const product = await createProduct(categoryId, {
      id: "product-inventory-service",
      pricePkr: 1000,
      variants: [{ sku: "TEST-INVENTORY-M-BLK", size: "M", colorName: "Obsidian Black", stockQuantity: 4 }],
    });
    const listed = await getInventoryVariants();
    assert.equal(listed.length, 1);
    assert.equal(listed[0].stock, 4);
    assert.equal(listed[0].productTitle, product.title);
    assert.equal(listed[0].status, "IN_STOCK");

    const increased = await adjustVariantStock(product.id, product.variants[0].id, 7, "Physical inventory reconciliation", adminActor);
    assert.equal(increased.success, true);
    assert.equal((await prisma.productVariant.findUnique({ where: { id: product.variants[0].id } }))?.stockQuantity, 7);

    const decreased = await adjustVariantStock(product.id, product.variants[0].id, 2, "Damaged display unit", adminActor);
    assert.equal(decreased.success, true);
    assert.equal((await prisma.productVariant.findUnique({ where: { id: product.variants[0].id } }))?.stockQuantity, 2);

    const negative = await adjustVariantStock(product.id, product.variants[0].id, -1, "Invalid adjustment", adminActor);
    assert.equal(negative.success, false);
    const malformedReason = await adjustVariantStock(product.id, product.variants[0].id, 3, "", adminActor);
    assert.equal(malformedReason.success, false);
    const missingVariant = await adjustVariantStock(product.id, "missing-variant", 3, "Valid reason", adminActor);
    assert.equal(missingVariant.success, false);
    if (!missingVariant.success) assert.equal(missingVariant.code, "NOT_FOUND");

    const logs = await getInventoryAuditLogs();
    assert.equal(logs.length, 2);
    assert.equal(logs[0].newStock, 2);
    assert.equal(logs[1].newStock, 7);
  });

  await t.test("cancellation fails atomically when an order item variant is missing", async () => {
    await resetCatalog();
    const order = await createAdminOrder("NG-2026-81006", { orderStatus: "PROCESSING" });
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: "deleted-product",
        variantId: "deleted-variant",
        sku: "DELETED-VARIANT",
        productTitle: "Deleted Snapshot",
        productSlug: "deleted-snapshot",
        categoryName: "Test Category",
        size: "M",
        color: "Obsidian Black",
        imageUrl: "/images/snapshot.jpg",
        unitPricePkr: 1000,
        quantity: 1,
        lineSubtotalPkr: 1000,
        discountPkr: 0,
        lineTotalPkr: 1000,
      },
    });
    const cancelled = await updatePersistentAdminOrder(order.orderReference, {
      orderStatus: "CANCELLED",
      cancellationReason: "Variant unavailable for safe restock",
    }, adminActor);
    assert.equal(cancelled.success, false);
    if (!cancelled.success) assert.equal(cancelled.code, "INVENTORY_CONFLICT");
    assert.equal((await prisma.order.findUnique({ where: { id: order.id } }))?.orderStatus, "PROCESSING");
    assert.equal(await prisma.inventoryAuditLog.count({ where: { orderId: order.id } }), 0);
  });

  await t.test("concurrent cancellation restores stock only once", async () => {
    const categoryId = await resetCatalog();
    const product = await createProduct(categoryId, {
      id: "product-concurrent-cancel",
      pricePkr: 1000,
      variants: [{ sku: "TEST-CONCURRENT-CANCEL-M-BLK", size: "M", colorName: "Obsidian Black", stockQuantity: 1 }],
    });
    const order = await createAdminOrder("NG-2026-81007", { orderStatus: "PROCESSING" });
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: product.id,
        variantId: product.variants[0].id,
        sku: product.variants[0].sku,
        productTitle: product.title,
        productSlug: product.slug,
        categoryName: "Test Category",
        size: "M",
        color: "Obsidian Black",
        imageUrl: product.primaryImageUrl,
        catalogProductId: product.id,
        catalogVariantId: product.variants[0].id,
        unitPricePkr: 1000,
        quantity: 1,
        lineSubtotalPkr: 1000,
        discountPkr: 0,
        lineTotalPkr: 1000,
      },
    });
    const results = await Promise.all([
      updatePersistentAdminOrder(order.orderReference, { orderStatus: "CANCELLED", cancellationReason: "Concurrent cancellation A" }, adminActor),
      updatePersistentAdminOrder(order.orderReference, { orderStatus: "CANCELLED", cancellationReason: "Concurrent cancellation B" }, adminActor),
    ]);
    assert.ok(results.every((result) => result.success));
    assert.equal((await prisma.productVariant.findUnique({ where: { id: product.variants[0].id } }))?.stockQuantity, 2);
    assert.equal(await prisma.inventoryAuditLog.count({ where: { orderId: order.id } }), 1);
  });

  await t.test("rolls back cancellation, restock, and audit when inventory audit fails", async () => {
    const categoryId = await resetCatalog();
    const product = await createProduct(categoryId, {
      id: "product-cancel-rollback",
      pricePkr: 1000,
      variants: [{ sku: "TEST-CANCEL-ROLLBACK-M-BLK", size: "M", colorName: "Obsidian Black", stockQuantity: 3 }],
    });
    const order = await createAdminOrder("NG-2026-81008", { orderStatus: "PROCESSING" });
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: product.id,
        variantId: product.variants[0].id,
        sku: product.variants[0].sku,
        productTitle: product.title,
        productSlug: product.slug,
        categoryName: "Test Category",
        size: "M",
        color: "Obsidian Black",
        imageUrl: product.primaryImageUrl,
        catalogProductId: product.id,
        catalogVariantId: product.variants[0].id,
        unitPricePkr: 1000,
        quantity: 1,
        lineSubtotalPkr: 1000,
        discountPkr: 0,
        lineTotalPkr: 1000,
      },
    });
    await prisma.$executeRawUnsafe(`CREATE TRIGGER fail_test_inventory_audit BEFORE INSERT ON "InventoryAuditLog" BEGIN SELECT RAISE(ABORT, 'forced inventory audit failure'); END`);
    try {
      await assert.rejects(
        updatePersistentAdminOrder(order.orderReference, {
          orderStatus: "CANCELLED",
          cancellationReason: "Rollback inventory audit test",
        }, adminActor)
      );
    } finally {
      await prisma.$executeRawUnsafe("DROP TRIGGER IF EXISTS fail_test_inventory_audit");
    }
    assert.equal((await prisma.order.findUnique({ where: { id: order.id } }))?.orderStatus, "PROCESSING");
    assert.equal((await prisma.productVariant.findUnique({ where: { id: product.variants[0].id } }))?.stockQuantity, 3);
    assert.equal(await prisma.inventoryAuditLog.count({ where: { orderId: order.id } }), 0);
  });

  await t.test("concurrent conflicting transitions allow only one compare-and-set update", async () => {
    await resetCatalog();
    const order = await createAdminOrder("NG-2026-81004");
    const results = await Promise.all([
      updatePersistentAdminOrder(order.orderReference, { orderStatus: "CONFIRMED" }, adminActor),
      updatePersistentAdminOrder(order.orderReference, { orderStatus: "DELIVERED" }, adminActor),
    ]);
    assert.equal(results.filter((result) => result.success).length, 1);
    const saved = await prisma.order.findUnique({ where: { id: order.id } });
    assert.ok(saved?.orderStatus === "CONFIRMED" || saved?.orderStatus === "CANCELLED");
    assert.equal(await prisma.orderAuditLog.count({ where: { orderId: order.id } }), 1);
  });

  await t.test("rolls back the state update if its audit write fails", async () => {
    await resetCatalog();
    const order = await createAdminOrder("NG-2026-81005");
    await prisma.$executeRawUnsafe(`CREATE TRIGGER fail_test_status_audit BEFORE INSERT ON "OrderAuditLog" WHEN NEW.action = 'STATUS_UPDATED' BEGIN SELECT RAISE(ABORT, 'forced test audit failure'); END`);
    try {
      await assert.rejects(
        updatePersistentAdminOrder(order.orderReference, { orderStatus: "CONFIRMED" }, adminActor)
      );
    } finally {
      await prisma.$executeRawUnsafe("DROP TRIGGER IF EXISTS fail_test_status_audit");
    }
    assert.equal((await prisma.order.findUnique({ where: { id: order.id } }))?.orderStatus, "PENDING");
    assert.equal(await prisma.orderAuditLog.count({ where: { orderId: order.id } }), 0);
  });
});
