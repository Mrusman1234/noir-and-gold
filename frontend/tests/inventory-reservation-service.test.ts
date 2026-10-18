import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { copyFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, test } from "node:test";

const repositoryRoot = path.resolve(__dirname, "..", "..");
const temporaryDirectory = mkdtempSync(path.join(tmpdir(), "noir-inventory-reservation-test-"));
const testDatabasePath = path.join(temporaryDirectory, "reservation.sqlite");
process.env.DATABASE_URL = `file:${testDatabasePath.replace(/\\/g, "/")}`;
copyFileSync(path.join(repositoryRoot, "backend", "prisma", "dev.db"), testDatabasePath);

const prismaCli = path.join(repositoryRoot, "node_modules", "prisma", "build", "index.js");
const reservationTablesSql = `
CREATE TABLE IF NOT EXISTS "InventoryAuditLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "productId" TEXT NOT NULL,
  "productTitle" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "sku" TEXT NOT NULL,
  "size" TEXT NOT NULL,
  "colorName" TEXT NOT NULL,
  "previousStock" INTEGER NOT NULL,
  "newStock" INTEGER NOT NULL,
  "adjustmentDelta" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "adjustedBy" TEXT NOT NULL,
  "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "orderId" TEXT,
  CONSTRAINT "InventoryAuditLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "InventoryAuditLog_variantId_timestamp_idx" ON "InventoryAuditLog"("variantId", "timestamp");
CREATE INDEX IF NOT EXISTS "InventoryAuditLog_orderId_timestamp_idx" ON "InventoryAuditLog"("orderId", "timestamp");
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
  input: reservationTablesSql,
  stdio: ["pipe", "pipe", "pipe"],
});

let prisma: import("@prisma/client").PrismaClient;
let createInventoryReservation: typeof import("../src/lib/inventory-reservation-service").createInventoryReservation;
let transitionInventoryReservation: typeof import("../src/lib/inventory-reservation-service").transitionInventoryReservation;

const setupPromise = Promise.all([
  import("../src/lib/prisma"),
  import("../src/lib/inventory-reservation-service"),
]).then(([prismaModule, reservationService]) => {
  prisma = prismaModule.prisma;
  createInventoryReservation = reservationService.createInventoryReservation;
  transitionInventoryReservation = reservationService.transitionInventoryReservation;
});

after(async () => {
  await setupPromise.catch(() => undefined);
  if (prisma) await prisma.$disconnect();
  rmSync(temporaryDirectory, { recursive: true, force: true });
});

async function resetDatabase() {
  await prisma.inventoryReservation.deleteMany();
  await prisma.inventoryAuditLog.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.category.create({ data: { name: "Reservation Category", slug: "reservation-category" } });
}

async function createOnlineOrder(orderReference = `RES-${randomBytes(6).toString("hex")}`) {
  return prisma.order.create({
    data: {
      orderReference,
      verificationTokenHash: `v1:${randomBytes(32).toString("hex")}`,
      idempotencyKey: `checkout-${randomBytes(12).toString("hex")}`,
      customerFullName: "Reservation Test Customer",
      customerPhone: "03001234567",
      shippingProvince: "Sindh",
      shippingCity: "Karachi",
      shippingArea: "Clifton",
      shippingStreetAddress: "10 Reservation Street",
      subtotalPkr: 5000,
      discountTotalPkr: 0,
      deliveryFeePkr: 250,
      totalPkr: 5250,
      paymentMethod: "TEST_ONLINE",
      paymentStatus: "PENDING",
      orderStatus: "PENDING",
    },
  });
}

async function createVariant(stockQuantity: number, isActive = true) {
  const category = await prisma.category.findUniqueOrThrow({ where: { slug: "reservation-category" } });
  return prisma.product.create({
    data: {
      id: `product-${randomBytes(5).toString("hex")}`,
      categoryId: category.id,
      title: "Reservation Test Product",
      slug: `reservation-product-${randomBytes(5).toString("hex")}`,
      description: "Reservation test product",
      primaryImageUrl: "/images/test.jpg",
      pricePkr: 5250,
      variants: {
        create: [{
          sku: `RES-${randomBytes(6).toString("hex")}`,
          size: "M",
          colorName: "Black",
          colorHex: "#000000",
          pricePkr: 5250,
          stockQuantity,
          isActive,
        }],
      },
    },
    include: { variants: true },
  });
}

function reservationInput(orderId: string, productVariantId: string, quantity = 1, key = "reservation-1") {
  return {
    orderId,
    productVariantId,
    quantity,
    activeReservationKey: key,
    expiresAt: new Date(Date.now() + 60_000),
  };
}

async function stockOf(variantId: string): Promise<number | undefined> {
  return (await prisma.productVariant.findUnique({ where: { id: variantId } }))?.stockQuantity;
}

test("creates a reservation without moving stock or writing an inventory audit", async () => {
  await setupPromise;
  await resetDatabase();
  const order = await createOnlineOrder();
  const product = await createVariant(4);
  const variantId = product.variants[0].id;

  const result = await createInventoryReservation(reservationInput(order.id, variantId, 2));
  assert.equal(result.success, true);
  // Option B: the order already holds the stock; the reservation must not decrement again.
  assert.equal(await stockOf(variantId), 4);
  assert.equal(await prisma.inventoryReservation.count({ where: { status: "ACTIVE" } }), 1);
  assert.equal(await prisma.inventoryAuditLog.count({ where: { orderId: order.id } }), 0);
});

test("rejects malformed, missing, COD, inactive, and expired reservations, and never guards stock", async () => {
  await resetDatabase();
  const order = await createOnlineOrder();
  const product = await createVariant(1);
  const variantId = product.variants[0].id;

  const invalidQuantity = await createInventoryReservation(reservationInput(order.id, variantId, 0));
  assert.equal(invalidQuantity.success, false);
  if (!invalidQuantity.success) assert.equal(invalidQuantity.code, "INVALID_POSITIVE_INTEGER");

  const invalidExpiry = await createInventoryReservation({ ...reservationInput(order.id, variantId), expiresAt: new Date(Date.now() - 1_000) });
  assert.equal(invalidExpiry.success, false);
  if (!invalidExpiry.success) assert.equal(invalidExpiry.code, "INVALID_EXPIRY");

  const missingOrder = await createInventoryReservation(reservationInput("missing-order", variantId));
  assert.equal(missingOrder.success, false);
  if (!missingOrder.success) assert.equal(missingOrder.code, "NOT_FOUND");

  const missingVariant = await createInventoryReservation(reservationInput(order.id, "missing-variant"));
  assert.equal(missingVariant.success, false);
  if (!missingVariant.success) assert.equal(missingVariant.code, "NOT_FOUND");

  const inactiveProduct = await createVariant(1, false);
  const inactive = await createInventoryReservation(reservationInput(order.id, inactiveProduct.variants[0].id, 1, "inactive-key"));
  assert.equal(inactive.success, false);
  if (!inactive.success) assert.equal(inactive.code, "VARIANT_INACTIVE");

  // Option B: reservation creation no longer enforces a stock guard (checkout owns stock).
  const overStock = await createInventoryReservation(reservationInput(order.id, variantId, 2, "over-stock-key"));
  assert.equal(overStock.success, true);
  assert.equal(await stockOf(variantId), 1);

  const codOrder = await prisma.order.create({
    data: {
      orderReference: "COD-RESERVATION-TEST",
      verificationTokenHash: `v1:${randomBytes(32).toString("hex")}`,
      idempotencyKey: `checkout-${randomBytes(12).toString("hex")}`,
      customerFullName: "COD Customer",
      customerPhone: "03001234567",
      shippingProvince: "Sindh",
      shippingCity: "Karachi",
      shippingArea: "Clifton",
      shippingStreetAddress: "10 COD Street",
      subtotalPkr: 5000,
      deliveryFeePkr: 250,
      totalPkr: 5250,
      paymentMethod: "CASH_ON_DELIVERY",
      paymentStatus: "PENDING",
      orderStatus: "PENDING",
    },
  });
  const cod = await createInventoryReservation(reservationInput(codOrder.id, variantId, 1, "cod"));
  assert.equal(cod.success, false);
  if (!cod.success) assert.equal(cod.code, "COD_NOT_ELIGIBLE");
});

test("retries are idempotent, conflicting active data is rejected, and stock is untouched", async () => {
  await resetDatabase();
  const order = await createOnlineOrder();
  const product = await createVariant(3);
  const variantId = product.variants[0].id;
  const input = reservationInput(order.id, variantId, 2);

  const first = await createInventoryReservation(input);
  const duplicate = await createInventoryReservation(input);
  const differentKey = await createInventoryReservation({ ...input, activeReservationKey: "different-key" });
  const conflictingQuantity = await createInventoryReservation({ ...input, quantity: 1, activeReservationKey: "quantity-key" });
  assert.equal(first.success, true);
  assert.equal(duplicate.success, true);
  assert.equal(differentKey.success, true);
  if (first.success && duplicate.success && differentKey.success) {
    assert.equal(first.reservation.id, duplicate.reservation.id);
    assert.equal(first.reservation.id, differentKey.reservation.id);
  }
  assert.equal(conflictingQuantity.success, false);
  if (!conflictingQuantity.success) assert.equal(conflictingQuantity.code, "ACTIVE_RESERVATION_CONFLICT");
  assert.equal(await stockOf(variantId), 3);
  assert.equal(await prisma.inventoryReservation.count(), 1);
});

test("consume, release, and expiry change state only and never move stock", async () => {
  await resetDatabase();
  const order = await createOnlineOrder();
  const product = await createVariant(4);
  const variantId = product.variants[0].id;
  const created = await createInventoryReservation(reservationInput(order.id, variantId, 2));
  assert.equal(created.success, true);
  if (!created.success) return;

  const consumed = await transitionInventoryReservation({ reservationId: created.reservation.id, nextStatus: "CONSUMED" });
  const consumedAgain = await transitionInventoryReservation({ reservationId: created.reservation.id, nextStatus: "CONSUMED" });
  assert.equal(consumed.success, true);
  assert.equal(consumedAgain.success, true);
  assert.equal(await stockOf(variantId), 4);
  assert.equal((await prisma.inventoryReservation.findUnique({ where: { id: created.reservation.id } }))?.status, "CONSUMED");

  await resetDatabase();
  const releaseOrder = await createOnlineOrder();
  const releaseProduct = await createVariant(4);
  const releaseVariantId = releaseProduct.variants[0].id;
  const releaseReservation = await createInventoryReservation(reservationInput(releaseOrder.id, releaseVariantId, 2));
  assert.equal(releaseReservation.success, true);
  if (!releaseReservation.success) return;
  const released = await transitionInventoryReservation({ reservationId: releaseReservation.reservation.id, nextStatus: "RELEASED" });
  const releasedAgain = await transitionInventoryReservation({ reservationId: releaseReservation.reservation.id, nextStatus: "RELEASED" });
  assert.equal(released.success, true);
  assert.equal(releasedAgain.success, true);
  assert.equal(await stockOf(releaseVariantId), 4);
  assert.equal(await prisma.inventoryAuditLog.count({ where: { orderId: releaseOrder.id } }), 0);
});

test("expiry, invalid transitions, and rollback are safe without touching stock", async () => {
  await resetDatabase();
  const order = await createOnlineOrder();
  const product = await createVariant(2);
  const variantId = product.variants[0].id;
  const created = await createInventoryReservation(reservationInput(order.id, variantId, 1, "expiry-key"));
  assert.equal(created.success, true);
  if (!created.success) return;

  const expired = await transitionInventoryReservation({ reservationId: created.reservation.id, nextStatus: "EXPIRED" });
  assert.equal(expired.success, true);
  assert.equal(await stockOf(variantId), 2);
  assert.equal((await prisma.inventoryReservation.findUnique({ where: { id: created.reservation.id } }))?.status, "EXPIRED");

  const invalid = await transitionInventoryReservation({ reservationId: created.reservation.id, nextStatus: "ACTIVE" });
  assert.equal(invalid.success, false);
  if (!invalid.success) assert.equal(invalid.code, "INVALID_TRANSITION");

  await resetDatabase();
  const rollbackOrder = await createOnlineOrder();
  const rollbackProduct = await createVariant(2);
  const rollbackVariantId = rollbackProduct.variants[0].id;
  const rollbackReservation = await createInventoryReservation(reservationInput(rollbackOrder.id, rollbackVariantId, 1, "rollback-key"));
  assert.equal(rollbackReservation.success, true);
  if (!rollbackReservation.success) return;
  await prisma.$executeRawUnsafe(`CREATE TRIGGER fail_reservation_release BEFORE UPDATE ON "InventoryReservation" WHEN NEW.status = 'RELEASED' BEGIN SELECT RAISE(ABORT, 'forced reservation release failure'); END`);
  try {
    await assert.rejects(
      transitionInventoryReservation({ reservationId: rollbackReservation.reservation.id, nextStatus: "RELEASED" })
    );
  } finally {
    await prisma.$executeRawUnsafe("DROP TRIGGER IF EXISTS fail_reservation_release");
  }
  assert.equal(await stockOf(rollbackVariantId), 2);
  assert.equal((await prisma.inventoryReservation.findUnique({ where: { id: rollbackReservation.reservation.id } }))?.status, "ACTIVE");
});

test("reservation creation never double-decrements stock that checkout already held", async () => {
  await resetDatabase();
  const product = await createVariant(5);
  const variantId = product.variants[0].id;

  // Simulate the checkout (order-owned) decrement: 5 -> 4.
  await prisma.productVariant.update({ where: { id: variantId }, data: { stockQuantity: { decrement: 1 } } });
  assert.equal(await stockOf(variantId), 4);

  const order = await createOnlineOrder();
  const created = await createInventoryReservation(reservationInput(order.id, variantId, 1, "double-decrement-guard"));
  assert.equal(created.success, true);
  // The reservation must not subtract the quantity a second time.
  assert.equal(await stockOf(variantId), 4);
});

test("concurrent duplicate reservation requests with the same key create one row", async () => {
  await resetDatabase();
  const order = await createOnlineOrder();
  const product = await createVariant(2);
  const variantId = product.variants[0].id;
  const [first, second] = await Promise.all([
    createInventoryReservation(reservationInput(order.id, variantId, 1, "same-key")),
    createInventoryReservation(reservationInput(order.id, variantId, 1, "same-key")),
  ]);
  assert.ok([first, second].some((result) => result.success));
  assert.equal(await prisma.inventoryReservation.count(), 1);
  assert.equal(await stockOf(variantId), 2);
});
