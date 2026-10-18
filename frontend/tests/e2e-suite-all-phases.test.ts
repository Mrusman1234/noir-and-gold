import assert from "node:assert/strict";
import crypto from "node:crypto";
import { copyFileSync, existsSync, mkdtempSync, rmSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { NextRequest } from "next/server";
import { AdminUser } from "../src/types";

// Setup isolated active SQLite database copied from backend/prisma/dev.db
const repositoryRoot = path.resolve(__dirname, "..", "..");
const temporaryDirectory = mkdtempSync(path.join(tmpdir(), "noir-e2e-all-phases-"));
const testDatabasePath = path.join(temporaryDirectory, "e2e-active.sqlite");
process.env.DATABASE_URL = `file:${testDatabasePath.replace(/\\/g, "/")}`;
copyFileSync(path.join(repositoryRoot, "backend", "prisma", "dev.db"), testDatabasePath);

process.env.ORDER_VERIFICATION_SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
process.env.PAYMENT_WEBHOOK_SECRET = "test_webhook_hmac_secret_key_32bytes_long_ok";

let prisma: typeof import("../src/lib/prisma").prisma;
let createAdminSessionForUser: typeof import("../src/lib/admin-service").createAdminSessionForUser;
let webhookRoute: typeof import("../src/app/api/v1/payments/webhook/route");
let productDetailRoute: typeof import("../src/app/api/v1/admin/products/[id]/route");
let listCatalogProducts: typeof import("../src/lib/catalog-service").listCatalogProducts;
let uploadRoute: typeof import("../src/app/api/v1/admin/uploads/route");
let storageService: typeof import("../src/lib/storage-service");
let exportRoute: typeof import("../src/app/api/v1/admin/orders/export/route");
let refundRoute: typeof import("../src/app/api/v1/admin/orders/[orderReference]/refund/route");

const filesToCleanUp: string[] = [];

const setupPromise = Promise.all([
  import("../src/lib/prisma"),
  import("../src/lib/admin-service"),
  import("../src/app/api/v1/payments/webhook/route"),
  import("../src/app/api/v1/admin/products/[id]/route"),
  import("../src/lib/catalog-service"),
  import("../src/app/api/v1/admin/uploads/route"),
  import("../src/lib/storage-service"),
  import("../src/app/api/v1/admin/orders/export/route"),
  import("../src/app/api/v1/admin/orders/[orderReference]/refund/route"),
]).then(
  ([
    prismaMod,
    adminServiceMod,
    webhookRouteMod,
    prodDetailRouteMod,
    catalogMod,
    uploadRouteMod,
    storageMod,
    exportRouteMod,
    refundRouteMod,
  ]) => {
    prisma = prismaMod.prisma;
    createAdminSessionForUser = adminServiceMod.createAdminSessionForUser;
    webhookRoute = webhookRouteMod;
    productDetailRoute = prodDetailRouteMod;
    listCatalogProducts = catalogMod.listCatalogProducts;
    uploadRoute = uploadRouteMod;
    storageService = storageMod;
    exportRoute = exportRouteMod;
    refundRoute = refundRouteMod;
  }
);

after(async () => {
  await setupPromise.catch(() => undefined);
  if (prisma) await prisma.$disconnect();
  try {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  } catch {
    // Ignore cleanup error
  }
  for (const f of filesToCleanUp) {
    try {
      if (existsSync(f)) unlinkSync(f);
    } catch {
      // Ignore cleanup error
    }
  }
});

// Helper admin users
const adminActor: AdminUser = {
  id: "usr_admin_e2e_lead",
  email: "principal-auditor@noirgold.test",
  name: "Lead Security Auditor",
  role: "ADMIN",
  createdAt: new Date().toISOString(),
};

const staffActor: AdminUser = {
  id: "usr_staff_e2e_ops",
  email: "staff-ops@noirgold.test",
  name: "Atelier Operations Staff",
  role: "STAFF",
  createdAt: new Date().toISOString(),
};

/* ========================================================================== */
/* TEST 1: Phase 1 — Database & Schema Parity                                 */
/* ========================================================================== */
test("Phase 1: Database & Schema Parity - All 14 tables exist and soft-delete filtering works", async () => {
  await setupPromise;

  // 1. Query sqlite_master to assert all 14 required tables exist on disk
  const rows = await prisma.$queryRawUnsafe<{ name: string }[]>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%' ORDER BY name;"
  );
  const tableNames = rows.map((r) => r.name);

  const requiredTables = [
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

  for (const table of requiredTables) {
    assert.ok(
      tableNames.includes(table),
      `Required table '${table}' must exist on disk in sqlite_master. Found tables: ${tableNames.join(", ")}`
    );
  }

  // 2. Verify deletedAt on Category can be populated and filtered
  const testCat = await prisma.category.create({
    data: {
      name: "Heritage Shawls",
      slug: `heritage-shawls-${Date.now()}`,
      deletedAt: new Date(),
    },
  });
  const activeCats = await prisma.category.findMany({
    where: { id: testCat.id, deletedAt: null },
  });
  assert.equal(activeCats.length, 0, "Soft-deleted Category must be excluded when filtering deletedAt: null");
  const softDeletedCats = await prisma.category.findMany({
    where: { id: testCat.id, deletedAt: { not: null } },
  });
  assert.equal(softDeletedCats.length, 1, "Soft-deleted Category must be retrievable when filtering deletedAt not null");

  // 3. Verify deletedAt on Product can be populated and filtered
  const testProd = await prisma.product.create({
    data: {
      categoryId: testCat.id,
      title: "Pashmina Stole",
      slug: `pashmina-stole-${Date.now()}`,
      description: "Fine cashmere stole",
      primaryImageUrl: "/images/stole.webp",
      pricePkr: 35000,
      deletedAt: new Date(),
    },
  });
  const activeProds = await prisma.product.findMany({
    where: { id: testProd.id, deletedAt: null },
  });
  assert.equal(activeProds.length, 0, "Soft-deleted Product must be excluded when filtering deletedAt: null");
  const softDeletedProds = await prisma.product.findMany({
    where: { id: testProd.id, deletedAt: { not: null } },
  });
  assert.equal(softDeletedProds.length, 1, "Soft-deleted Product must be retrievable when filtering deletedAt not null");

  // 4. Verify deletedAt on Order can be populated and filtered
  const testOrd = await prisma.order.create({
    data: {
      orderReference: `ORD-DEL-PARITY-${Date.now()}`,
      verificationTokenHash: `hash_parity_${Date.now()}`,
      idempotencyKey: `idem_parity_${Date.now()}`,
      customerFullName: "Zainab Shah",
      customerEmail: "zainab@example.com",
      customerPhone: "+923005556677",
      shippingProvince: "Sindh",
      shippingCity: "Karachi",
      shippingArea: "DHA Phase 5",
      shippingStreetAddress: "Sea View Avenue",
      subtotalPkr: 35000,
      deliveryFeePkr: 0,
      totalPkr: 35000,
      paymentMethod: "CASH_ON_DELIVERY",
      paymentStatus: "PENDING",
      orderStatus: "CANCELLED",
      deletedAt: new Date(),
    },
  });
  const activeOrds = await prisma.order.findMany({
    where: { id: testOrd.id, deletedAt: null },
  });
  assert.equal(activeOrds.length, 0, "Soft-deleted Order must be excluded when filtering deletedAt: null");
  const softDeletedOrds = await prisma.order.findMany({
    where: { id: testOrd.id, deletedAt: { not: null } },
  });
  assert.equal(softDeletedOrds.length, 1, "Soft-deleted Order must be retrievable when filtering deletedAt not null");
});

/* ========================================================================== */
/* TEST 2: Phase 2 — Webhook Hardening & RBAC Enforcement                     */
/* ========================================================================== */
test("Phase 2: Webhook Hardening & RBAC Enforcement - Fail-closed secret check, HMAC ingestion & role separation", async () => {
  await setupPromise;

  const adminToken = createAdminSessionForUser(adminActor);
  const staffToken = createAdminSessionForUser(staffActor);

  // 1. Webhook Fallback Prohibition: NODE_ENV=production and PAYMENT_WEBHOOK_SECRET unset -> 500 WEBHOOK_CONFIG_ERROR
  const originalNodeEnv = process.env.NODE_ENV;
  const originalSecret = process.env.PAYMENT_WEBHOOK_SECRET;

  try {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    delete process.env.PAYMENT_WEBHOOK_SECRET;

    const unconfiguredReq = new NextRequest("http://localhost:3000/api/v1/payments/webhook", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        provider: "stripe",
        eventId: "evt_unconfigured_test",
        eventType: "PAYMENT_CAPTURED",
        orderReference: "NG-TEST-UNCONFIGURED",
      }),
    });

    const unconfiguredRes = await webhookRoute.POST(unconfiguredReq);
    assert.equal(unconfiguredRes.status, 500, "Must return HTTP 500 when secret is unconfigured in production");
    const unconfiguredBody = await unconfiguredRes.json();
    assert.equal(unconfiguredBody.success, false);
    assert.equal(unconfiguredBody.error.code, "WEBHOOK_CONFIG_ERROR");
  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv;
    process.env.PAYMENT_WEBHOOK_SECRET = originalSecret || "test_webhook_hmac_secret_key_32bytes_long_ok";
  }

  // 2. Valid HMAC Webhook Ingestion: Send signed payload, assert 200, idempotency, and records written to PaymentAttempt and PaymentEvent
  const webhookOrderRef = `ORD-WHK-E2E-${Date.now()}`;
  const webhookOrder = await prisma.order.create({
    data: {
      orderReference: webhookOrderRef,
      verificationTokenHash: `hash_${webhookOrderRef}`,
      idempotencyKey: `idem_${webhookOrderRef}`,
      customerFullName: "Maryam Qureshi",
      customerEmail: "maryam@example.com",
      customerPhone: "+923214445566",
      shippingProvince: "Punjab",
      shippingCity: "Lahore",
      shippingArea: "Gulberg III",
      shippingStreetAddress: "M.M. Alam Road",
      subtotalPkr: 95000,
      deliveryFeePkr: 0,
      totalPkr: 95000,
      paymentMethod: "ONLINE_CARD",
      paymentStatus: "PENDING",
      orderStatus: "PENDING",
    },
  });

  const configuredSecret = process.env.PAYMENT_WEBHOOK_SECRET!;
  const webhookEventId = `evt_hmac_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const webhookPayload = JSON.stringify({
    provider: "stripe",
    eventId: webhookEventId,
    eventType: "PAYMENT_CAPTURED",
    orderReference: webhookOrderRef,
    amountPkr: 95000,
    providerPaymentId: `ch_e2e_${Date.now()}`,
    timestamp: currentTimestamp,
  });

  const rawBuffer = Buffer.from(webhookPayload, "utf-8");
  const hmacSignature = crypto.createHmac("sha256", configuredSecret).update(rawBuffer).digest("hex");

  const signedWebhookReq = new NextRequest("http://localhost:3000/api/v1/payments/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-signature": hmacSignature,
      "x-timestamp": currentTimestamp.toString(),
    },
    body: rawBuffer,
  });

  const signedWebhookRes = await webhookRoute.POST(signedWebhookReq);
  assert.equal(signedWebhookRes.status, 200, "Signed webhook must return 200 OK");
  const signedWebhookBody = await signedWebhookRes.json();
  assert.equal(signedWebhookBody.success, true);
  assert.equal(signedWebhookBody.orderReference, webhookOrderRef);

  // Assert records written to PaymentAttempt and PaymentEvent
  const persistedAttempt = await prisma.paymentAttempt.findFirst({
    where: { orderId: webhookOrder.id },
    include: { events: true },
  });
  assert.ok(persistedAttempt, "PaymentAttempt must be created in active database");
  assert.equal(persistedAttempt?.status, "CAPTURED");
  assert.equal(persistedAttempt?.capturedAmountPkr, 95000);
  assert.ok(persistedAttempt?.events.length > 0, "PaymentEvent must be recorded");
  assert.equal(persistedAttempt?.events[0].providerEventId, webhookEventId);
  assert.equal(persistedAttempt?.events[0].signatureVerified, true);

  // Assert idempotency on replay
  const replayWebhookReq = new NextRequest("http://localhost:3000/api/v1/payments/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-signature": hmacSignature,
      "x-timestamp": currentTimestamp.toString(),
    },
    body: rawBuffer,
  });
  const replayWebhookRes = await webhookRoute.POST(replayWebhookReq);
  assert.equal(replayWebhookRes.status, 200);
  const replayWebhookBody = await replayWebhookRes.json();
  assert.equal(replayWebhookBody.success, true);
  assert.equal(replayWebhookBody.deduplicated, true, "Replayed event must be safely deduplicated");

  // 3. RBAC Guard (requireAdminAuth):
  // STAFF role attempting destructive action (DELETE /api/v1/admin/products/:id) -> 403
  const targetCategory = await prisma.category.create({
    data: { name: "RBAC Test Cat", slug: `rbac-cat-${Date.now()}` },
  });
  const productToDestroy = await prisma.product.create({
    data: {
      categoryId: targetCategory.id,
      title: "Destructive Action Target",
      slug: `destructive-target-${Date.now()}`,
      description: "RBAC verification test",
      primaryImageUrl: "/images/target.webp",
      pricePkr: 40000,
    },
  });

  const staffDeleteReq = new NextRequest(
    `http://localhost:3000/api/v1/admin/products/${productToDestroy.id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${staffToken}`,
        Origin: "http://localhost:3000",
        Host: "localhost:3000",
      },
    }
  );
  const staffDeleteRes = await productDetailRoute.DELETE(staffDeleteReq, {
    params: Promise.resolve({ id: productToDestroy.id }),
  });
  assert.equal(staffDeleteRes.status, 403, "STAFF role must be rejected with 403 FORBIDDEN on DELETE");
  const staffDeleteBody = await staffDeleteRes.json();
  assert.equal(staffDeleteBody.error.code, "FORBIDDEN_INSUFFICIENT_ROLE");

  // ADMIN role attempting the same destructive action -> 200 OK
  const adminDeleteReq = new NextRequest(
    `http://localhost:3000/api/v1/admin/products/${productToDestroy.id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        Origin: "http://localhost:3000",
        Host: "localhost:3000",
      },
    }
  );
  const adminDeleteRes = await productDetailRoute.DELETE(adminDeleteReq, {
    params: Promise.resolve({ id: productToDestroy.id }),
  });
  assert.equal(adminDeleteRes.status, 200, "ADMIN role must successfully execute DELETE");
  const adminDeleteBody = await adminDeleteRes.json();
  assert.equal(adminDeleteBody.success, true);
  assert.equal(adminDeleteBody.archived, true);
});

/* ========================================================================== */
/* TEST 3: Phase 3 — Product CRUD, Dynamic Variants & Audit Trail             */
/* ========================================================================== */
test("Phase 3: Product CRUD, Dynamic Variants & Audit Trail - Price change auditing, soft-delete and catalog restore", async () => {
  await setupPromise;

  const adminToken = createAdminSessionForUser(adminActor);

  // 1. Create a test product with 3 dynamic variants (custom sizes, colors, and hex values)
  const coutureCategory = await prisma.category.create({
    data: {
      name: "Bridal Atelier",
      slug: `bridal-atelier-${Date.now()}`,
    },
  });

  const productSlug = `zardozi-velvet-sherwani-${Date.now()}`;
  const product = await prisma.product.create({
    data: {
      categoryId: coutureCategory.id,
      title: "Royal Zardozi Velvet Sherwani",
      slug: productSlug,
      description: "Hand-embossed velvet with 24k gold bullion dabka embroidery.",
      primaryImageUrl: "/images/sherwani-front.webp",
      pricePkr: 180000,
      status: "PUBLISHED",
      variants: {
        create: [
          {
            sku: `SHW-${Date.now()}-38`,
            size: "38",
            colorName: "Midnight Noir",
            colorHex: "#0F0F12",
            stockQuantity: 4,
            pricePkr: 180000,
            isActive: true,
          },
          {
            sku: `SHW-${Date.now()}-40`,
            size: "40",
            colorName: "Imperial Gold",
            colorHex: "#C5A059",
            stockQuantity: 6,
            pricePkr: 180000,
            isActive: true,
          },
          {
            sku: `SHW-${Date.now()}-42`,
            size: "42",
            colorName: "Emerald Velvet",
            colorHex: "#0D3822",
            stockQuantity: 3,
            pricePkr: 195000,
            isActive: true,
          },
        ],
      },
    },
    include: { variants: true },
  });
  assert.equal(product.variants.length, 3, "Product must have 3 dynamic variants");

  // Initial catalog check: Product must appear in public storefront
  const catalogInitial = await listCatalogProducts({ search: productSlug });
  assert.equal(catalogInitial.length, 1, "Product must appear in active catalog listings");
  assert.equal(catalogInitial[0].id, product.id);

  // 2. Update base price via PATCH /api/v1/admin/products/:id
  const patchReq = new NextRequest(`http://localhost:3000/api/v1/admin/products/${product.id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      Origin: "http://localhost:3000",
      Host: "localhost:3000",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ basePricePkr: 210000 }),
  });
  const patchRes = await productDetailRoute.PATCH(patchReq, {
    params: Promise.resolve({ id: product.id }),
  });
  assert.equal(patchRes.status, 200, "Base price update PATCH must return 200 OK");
  const patchBody = await patchRes.json();
  assert.equal(patchBody.success, true);
  assert.equal(patchBody.product.pricePkr, 210000);

  // 3. Verify entry automatically appended to SecurityAuditLog with PRODUCT_PRICE_CHANGED
  const priceAuditLog = await prisma.securityAuditLog.findFirst({
    where: {
      entityId: product.id,
      action: "PRODUCT_PRICE_CHANGED",
    },
  });
  assert.ok(priceAuditLog, "SecurityAuditLog must record price modification");
  assert.equal(priceAuditLog.actorEmail, adminActor.email);
  assert.equal(priceAuditLog.entityType, "Product");
  const prevState = JSON.parse(priceAuditLog.previousState || "{}");
  const nextState = JSON.parse(priceAuditLog.newState || "{}");
  assert.equal(prevState.pricePkr, 180000, "Previous price state must match original 180,000 PKR");
  assert.equal(nextState.pricePkr, 210000, "New price state must match updated 210,000 PKR");

  // 4. Soft-delete the product (DELETE)
  const delReq = new NextRequest(`http://localhost:3000/api/v1/admin/products/${product.id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      Origin: "http://localhost:3000",
      Host: "localhost:3000",
    },
  });
  const delRes = await productDetailRoute.DELETE(delReq, {
    params: Promise.resolve({ id: product.id }),
  });
  assert.equal(delRes.status, 200);

  // Assert deletedAt is populated and status becomes ARCHIVED
  const deletedDb = await prisma.product.findUnique({ where: { id: product.id } });
  assert.ok(deletedDb?.deletedAt !== null, "deletedAt timestamp must be populated on soft delete");
  assert.equal(deletedDb?.status, "ARCHIVED");

  // Standard catalog queries exclude it
  const catalogAfterDelete = await listCatalogProducts({ search: productSlug });
  assert.equal(catalogAfterDelete.length, 0, "Soft-deleted product must be excluded from public catalog");

  // 5. Restore the product via PATCH with { action: "RESTORE" }
  const restoreReq = new NextRequest(`http://localhost:3000/api/v1/admin/products/${product.id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      Origin: "http://localhost:3000",
      Host: "localhost:3000",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "RESTORE" }),
  });
  const restoreRes = await productDetailRoute.PATCH(restoreReq, {
    params: Promise.resolve({ id: product.id }),
  });
  assert.equal(restoreRes.status, 200);

  // Assert deletedAt is null and status is restored
  const restoredDb = await prisma.product.findUnique({ where: { id: product.id } });
  assert.equal(restoredDb?.deletedAt, null, "deletedAt must be reset to null");
  assert.ok(
    restoredDb?.status === "PUBLISHED" || restoredDb?.status === "ACTIVE",
    `Status must be restored to active/published, got ${restoredDb?.status}`
  );

  // Verify visible in public catalog again
  const catalogAfterRestore = await listCatalogProducts({ search: productSlug });
  assert.equal(catalogAfterRestore.length, 1, "Restored product must appear back in public storefront catalog");
});

/* ========================================================================== */
/* TEST 4: Phase 4 — Multipart Image Upload Pipeline                          */
/* ========================================================================== */
test("Phase 4: Multipart Image Upload Pipeline - MIME/size validation, WebP buffer ingestion and disk persistence", async () => {
  await setupPromise;

  const adminToken = createAdminSessionForUser(adminActor);

  // 1. MIME rejection: Send an invalid .exe file
  const exeFormData = new FormData();
  exeFormData.append(
    "file",
    new Blob(["MZ_MALICIOUS_EXECUTABLE_HEADER_CONTENT"], { type: "application/x-msdownload" }),
    "payload.exe"
  );
  const exeReq = new NextRequest("http://localhost:3000/api/v1/admin/uploads", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      Origin: "http://localhost:3000",
      Host: "localhost:3000",
    },
    body: exeFormData,
  });
  const exeRes = await uploadRoute.POST(exeReq);
  assert.equal(exeRes.status, 400, "Invalid MIME type must return 400 Bad Request");
  const exeBody = await exeRes.json();
  assert.equal(exeBody.success, false);
  assert.equal(exeBody.error.code, "INVALID_FILE_TYPE");

  // 2. Size rejection: Send a file exceeding 5 MB ceiling
  const oversizedBuffer = Buffer.alloc(5 * 1024 * 1024 + 1024, 0x41);
  const oversizedFormData = new FormData();
  oversizedFormData.append(
    "file",
    new Blob([oversizedBuffer], { type: "image/png" }),
    "giant-couture-dress.png"
  );
  const oversizedReq = new NextRequest("http://localhost:3000/api/v1/admin/uploads", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      Origin: "http://localhost:3000",
      Host: "localhost:3000",
    },
    body: oversizedFormData,
  });
  const oversizedRes = await uploadRoute.POST(oversizedReq);
  assert.equal(oversizedRes.status, 400, "Oversized file must return 400 Bad Request");
  const oversizedBody = await oversizedRes.json();
  assert.equal(oversizedBody.success, false);
  assert.equal(oversizedBody.error.code, "FILE_TOO_LARGE");

  // 3. Valid Upload: Upload a valid WebP image buffer with admin credentials
  const validWebpBuffer = Buffer.alloc(2048, 0x5a); // 2 KB simulated WebP asset
  const validFormData = new FormData();
  validFormData.append(
    "file",
    new Blob([validWebpBuffer], { type: "image/webp" }),
    "atelier-couture-piece.webp"
  );
  const validReq = new NextRequest("http://localhost:3000/api/v1/admin/uploads", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      Origin: "http://localhost:3000",
      Host: "localhost:3000",
    },
    body: validFormData,
  });
  const validRes = await uploadRoute.POST(validReq);
  assert.equal(validRes.status, 200, "Valid WebP upload must return 200 OK");
  const validBody = await validRes.json();
  assert.equal(validBody.success, true);
  assert.ok(validBody.file);
  assert.ok(validBody.file.url.startsWith("/uploads/products/"));
  assert.ok(validBody.file.filename.endsWith(".webp"));
  assert.equal(validBody.file.mimeType, "image/webp");
  assert.equal(validBody.file.sizeBytes, 2048);

  // Assert physical existence of the file in the designated upload directory
  const storageDir = storageService.getLocalStorageDirectory();
  const physicalPath = path.join(storageDir, validBody.file.filename);
  assert.equal(existsSync(physicalPath), true, "File must physically exist in local storage directory");
  filesToCleanUp.push(physicalPath);
});

/* ========================================================================== */
/* TEST 5: Phase 5 — Financial Auditing, CSV Export & Refund Flow             */
/* ========================================================================== */
test("Phase 5: Financial Auditing, CSV Export & Refund Flow - Streaming RFC-4180 export, transactional refund & over-refund guard", async () => {
  await setupPromise;

  const adminToken = createAdminSessionForUser(adminActor);

  // 1. Place an order and mark payment as PAID
  const testRefOrder = `ORD-E2E-FIN-${Date.now()}`;
  const initialOrder = await prisma.order.create({
    data: {
      orderReference: testRefOrder,
      verificationTokenHash: `hash_fin_${testRefOrder}`,
      idempotencyKey: `idem_fin_${testRefOrder}`,
      customerFullName: "Hamza Abbasi",
      customerEmail: "hamza.abbasi@example.com",
      customerPhone: "+923331122334",
      shippingProvince: "Islamabad Capital",
      shippingCity: "Islamabad",
      shippingArea: "F-6/1",
      shippingStreetAddress: "Margalla Road, House 14",
      subtotalPkr: 80000,
      deliveryFeePkr: 0,
      totalPkr: 80000,
      paymentMethod: "ONLINE_CARD",
      paymentStatus: "PAID",
      orderStatus: "CONFIRMED",
      paymentAttempts: {
        create: [
          {
            provider: "stripe",
            paymentMethod: "ONLINE_CARD",
            status: "CAPTURED",
            amountPkr: 80000,
            currency: "PKR",
            attemptKey: `att-e2e-${testRefOrder}`,
            capturedAmountPkr: 80000,
            capturedAt: new Date(),
          },
        ],
      },
    },
    include: { paymentAttempts: true },
  });
  assert.equal(initialOrder.paymentStatus, "PAID");

  // 2. CSV Export: Request GET /api/v1/admin/orders/export?paymentStatus=PAID
  const exportReq = new NextRequest("http://localhost:3000/api/v1/admin/orders/export?paymentStatus=PAID", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });
  const exportRes = await exportRoute.GET(exportReq);
  assert.equal(exportRes.status, 200, "CSV export must return 200 OK");
  assert.equal(
    exportRes.headers.get("content-type"),
    "text/csv; charset=utf-8",
    "Content-Type must be text/csv; charset=utf-8"
  );

  const csvContent = await exportRes.text();
  // Assert RFC-4180 header quoting and columns
  assert.ok(
    csvContent.startsWith('"Order Reference","Date (UTC)"'),
    "CSV header must adhere to RFC-4180 quoted syntax"
  );
  // Verify the order reference and customer details are present in the streamed CSV body
  assert.ok(csvContent.includes(testRefOrder), "CSV body must contain order reference");
  assert.ok(csvContent.includes("Hamza Abbasi"), "CSV body must contain customer name");
  assert.ok(csvContent.includes("hamza.abbasi@example.com"), "CSV body must contain customer email");

  // 3. Attempt an over-refund (amount > order total) -> Assert rejection with HTTP 400
  const overRefundReq = new NextRequest(
    `http://localhost:3000/api/v1/admin/orders/${testRefOrder}/refund`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        Origin: "http://localhost:3000",
        Host: "localhost:3000",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amountPkr: 900000,
        reason: "Over-limit refund test",
        refundMethod: "MANUAL_BANK_TRANSFER",
      }),
    }
  );
  const overRefundRes = await refundRoute.POST(overRefundReq, {
    params: Promise.resolve({ orderReference: testRefOrder }),
  });
  assert.equal(overRefundRes.status, 400, "Over-refund must be rejected with 400 Bad Request");
  const overRefundBody = await overRefundRes.json();
  assert.equal(overRefundBody.success, false);
  assert.equal(overRefundBody.error.code, "REFUND_EXCEEDS_TOTAL");

  // 4. Valid Refund Execution: POST to /api/v1/admin/orders/:id/refund with amountPkr: 5000
  const refundReq = new NextRequest(
    `http://localhost:3000/api/v1/admin/orders/${testRefOrder}/refund`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        Origin: "http://localhost:3000",
        Host: "localhost:3000",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amountPkr: 5000,
        reason: "Customer return",
        refundMethod: "MANUAL_BANK_TRANSFER",
      }),
    }
  );
  const refundRes = await refundRoute.POST(refundReq, {
    params: Promise.resolve({ orderReference: testRefOrder }),
  });
  assert.equal(refundRes.status, 200, "Valid refund must return 200 OK");
  const refundBody = await refundRes.json();
  assert.equal(refundBody.success, true);
  assert.equal(refundBody.remainingBalance, 75000);

  // Verify a record is created in Refund
  const refundRow = await prisma.refund.findFirst({
    where: { id: refundBody.refund.id },
  });
  assert.ok(refundRow, "Refund row must exist in SQLite database");
  assert.equal(refundRow?.amountPkr, 5000);
  assert.equal(refundRow?.reason, "Customer return");
  assert.equal(refundRow?.provider, "MANUAL_BANK_TRANSFER");

  // Verify Order.paymentStatus reflects the refund (PARTIALLY_REFUNDED)
  const updatedOrder = await prisma.order.findUnique({
    where: { id: initialOrder.id },
  });
  assert.equal(
    updatedOrder?.paymentStatus,
    "PARTIALLY_REFUNDED",
    "Order payment status must transition to PARTIALLY_REFUNDED"
  );

  // Verify an immutable log is written to OrderAuditLog
  const orderAudit = await prisma.orderAuditLog.findFirst({
    where: { orderId: initialOrder.id, action: "ORDER_REFUNDED" },
  });
  assert.ok(orderAudit, "OrderAuditLog must contain ORDER_REFUNDED entry");

  // Verify an immutable log is written to SecurityAuditLog
  const secAudit = await prisma.securityAuditLog.findFirst({
    where: { entityId: initialOrder.id, action: "ORDER_REFUNDED" },
  });
  assert.ok(secAudit, "SecurityAuditLog must contain ORDER_REFUNDED entry");
  assert.equal(secAudit.actorEmail, adminActor.email);
  const secAuditNewState = JSON.parse(secAudit.newState || "{}");
  assert.equal(secAuditNewState.refundAmountPkr, 5000);
  assert.equal(secAuditNewState.paymentStatus, "PARTIALLY_REFUNDED");
});
