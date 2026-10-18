import assert from "node:assert/strict";
import { copyFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { NextRequest } from "next/server";
import { AdminUser } from "../src/types";

const repositoryRoot = path.resolve(__dirname, "..", "..");
const temporaryDirectory = mkdtempSync(path.join(tmpdir(), "noir-crud-test-"));
const testDatabasePath = path.join(temporaryDirectory, "crud-test.sqlite");
process.env.DATABASE_URL = `file:${testDatabasePath.replace(/\\/g, "/")}`;
copyFileSync(path.join(repositoryRoot, "backend", "prisma", "dev.db"), testDatabasePath);

let prisma: typeof import("../src/lib/prisma").prisma;
let createAdminSessionForUser: typeof import("../src/lib/admin-service").createAdminSessionForUser;
let productRoute: typeof import("../src/app/api/v1/admin/products/[id]/route");
let listCatalogProducts: typeof import("../src/lib/catalog-service").listCatalogProducts;

const setupPromise = Promise.all([
  import("../src/lib/prisma"),
  import("../src/lib/admin-service"),
  import("../src/app/api/v1/admin/products/[id]/route"),
  import("../src/lib/catalog-service"),
]).then(([prismaMod, adminServiceMod, prodRouteMod, catalogMod]) => {
  prisma = prismaMod.prisma;
  createAdminSessionForUser = adminServiceMod.createAdminSessionForUser;
  productRoute = prodRouteMod;
  listCatalogProducts = catalogMod.listCatalogProducts;
});

after(async () => {
  await setupPromise.catch(() => undefined);
  if (prisma) await prisma.$disconnect();
  rmSync(temporaryDirectory, { recursive: true, force: true });
});

test("CRUD: Updating a product's price logs an audit event and updates the record", async () => {
  await setupPromise;

  const adminUser: AdminUser = {
    id: "usr_admin_crud_1",
    email: "head-couture@noirgold.test",
    name: "Head of Couture",
    role: "ADMIN",
    createdAt: new Date().toISOString(),
  };
  const token = createAdminSessionForUser(adminUser);

  const category = await prisma.category.create({
    data: {
      name: "Couture Sherwanis",
      slug: `couture-sherwanis-${Date.now()}`,
    },
  });

  const product = await prisma.product.create({
    data: {
      categoryId: category.id,
      title: "Hand-Embroidered Raw Silk Prince Coat",
      slug: `prince-coat-${Date.now()}`,
      description: "Artisanal zardozi embroidery on raw silk.",
      primaryImageUrl: "/images/prince-coat.jpg",
      pricePkr: 85000,
      variants: {
        create: [
          {
            sku: `PC-${Date.now()}-M`,
            size: "M",
            colorName: "Ivory Gold",
            colorHex: "#F5F2EB",
            stockQuantity: 4,
            pricePkr: 85000,
          },
        ],
      },
    },
  });

  // Execute price update via PATCH
  const patchReq = new NextRequest(`http://localhost:3000/api/v1/admin/products/${product.id}`, {
    method: "PATCH",
    headers: {
      authorization: `Bearer ${token}`,
      origin: "http://localhost:3000",
      host: "localhost:3000",
      "sec-fetch-site": "same-origin",
      "content-type": "application/json",
    },
    body: JSON.stringify({ basePricePkr: 92000 }),
  });

  const res = await productRoute.PATCH(patchReq, { params: Promise.resolve({ id: product.id }) });
  assert.equal(res.status, 200, "PATCH response must be 200 OK");
  const body = await res.json();
  assert.equal(body.success, true);
  assert.equal(body.product.pricePkr, 92000, "Base price in response must reflect 92,000 PKR");

  // Verify DB record
  const updatedDb = await prisma.product.findUnique({ where: { id: product.id } });
  assert.equal(updatedDb?.pricePkr, 92000, "Database price must be updated to 92,000 PKR");

  // Verify SecurityAuditLog
  const auditLogs = await prisma.securityAuditLog.findMany({
    where: { entityId: product.id, action: { in: ["PRICE_CHANGED", "PRODUCT_PRICE_CHANGED"] } },
  });
  assert.ok(auditLogs.length >= 1, "Price change must log an audit event in SecurityAuditLog");
  assert.equal(auditLogs[0].actorId, adminUser.id);
  assert.equal(auditLogs[0].actorEmail, adminUser.email);
  assert.ok(auditLogs[0].newState.includes("92000"), "Audit log must record new price in state payload");
});

test("CRUD: Adding, modifying, and deactivating variants via PATCH works atomically", async () => {
  await setupPromise;

  const adminUser: AdminUser = {
    id: "usr_admin_crud_2",
    email: "atelier-director@noirgold.test",
    name: "Atelier Director",
    role: "ADMIN",
    createdAt: new Date().toISOString(),
  };
  const token = createAdminSessionForUser(adminUser);

  const category = await prisma.category.create({
    data: {
      name: "Velvet Waistcoats",
      slug: `velvet-waistcoats-${Date.now()}`,
    },
  });

  const product = await prisma.product.create({
    data: {
      categoryId: category.id,
      title: "Royal Velvet Formal Waistcoat",
      slug: `velvet-waistcoat-${Date.now()}`,
      description: "Fine micro-velvet waistcoat with brass filigree buttons.",
      primaryImageUrl: "/images/waistcoat.jpg",
      pricePkr: 32000,
      variants: {
        create: [
          {
            sku: `VW-${Date.now()}-S`,
            size: "S",
            colorName: "Emerald Green",
            colorHex: "#0D3822",
            stockQuantity: 6,
            pricePkr: 32000,
            isActive: true,
          },
          {
            sku: `VW-${Date.now()}-M`,
            size: "M",
            colorName: "Emerald Green",
            colorHex: "#0D3822",
            stockQuantity: 8,
            pricePkr: 32000,
            isActive: true,
          },
        ],
      },
    },
    include: { variants: true },
  });

  const existingS = product.variants.find((v) => v.size === "S")!;
  const existingM = product.variants.find((v) => v.size === "M")!;

  // We will:
  // 1. Modify size S: change stock from 6 -> 12, price -> 34,000 PKR
  // 2. Omit size M so it becomes deactivated (isActive: false)
  // 3. Add a new variant size L with stock 5
  const newSkuL = `VW-${Date.now()}-L`;

  const patchReq = new NextRequest(`http://localhost:3000/api/v1/admin/products/${product.id}`, {
    method: "PATCH",
    headers: {
      authorization: `Bearer ${token}`,
      origin: "http://localhost:3000",
      host: "localhost:3000",
      "sec-fetch-site": "same-origin",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      variants: [
        {
          id: existingS.id,
          sku: existingS.sku,
          size: "S",
          colorName: "Emerald Green",
          colorHex: "#0D3822",
          stock: 12,
          pricePkr: 34000,
          isActive: true,
        },
        {
          sku: newSkuL,
          size: "L",
          colorName: "Emerald Green",
          colorHex: "#0D3822",
          stock: 5,
          pricePkr: 32000,
          isActive: true,
        },
      ],
    }),
  });

  const res = await productRoute.PATCH(patchReq, { params: Promise.resolve({ id: product.id }) });
  assert.equal(res.status, 200, "Variant update PATCH must return 200 OK");

  // Verify DB variants
  const dbVariants = await prisma.productVariant.findMany({
    where: { productId: product.id },
  });

  // Variant S: modified
  const updatedS = dbVariants.find((v) => v.id === existingS.id);
  assert.equal(updatedS?.stockQuantity, 12, "Variant S stock should be 12");
  assert.equal(updatedS?.pricePkr, 34000, "Variant S price should be 34,000 PKR");
  assert.equal(updatedS?.isActive, true, "Variant S should remain active");

  // Variant M: omitted from payload -> deactivated
  const deactivatedM = dbVariants.find((v) => v.id === existingM.id);
  assert.equal(deactivatedM?.isActive, false, "Variant M must be deactivated because it was omitted from the new set");

  // Variant L: created
  const createdL = dbVariants.find((v) => v.sku === newSkuL);
  assert.ok(createdL, "Variant L must exist in database");
  assert.equal(createdL?.size, "L");
  assert.equal(createdL?.stockQuantity, 5);
  assert.equal(createdL?.isActive, true);
});

test("CRUD: Soft-deleting a product sets deletedAt and archiving excludes it from standard public catalog listings", async () => {
  await setupPromise;

  const adminUser: AdminUser = {
    id: "usr_admin_crud_3",
    email: "curator@noirgold.test",
    name: "Archive Curator",
    role: "ADMIN",
    createdAt: new Date().toISOString(),
  };
  const token = createAdminSessionForUser(adminUser);

  const category = await prisma.category.create({
    data: {
      name: "Limited Shawls",
      slug: `limited-shawls-${Date.now()}`,
    },
  });

  const uniqueSlug = `pashmina-shawl-${Date.now()}`;
  const product = await prisma.product.create({
    data: {
      categoryId: category.id,
      title: "Hand-Spun Kashmiri Pashmina Shawl",
      slug: uniqueSlug,
      description: "Fine weave with antique tilla needlework.",
      primaryImageUrl: "/images/shawl.jpg",
      pricePkr: 120000,
      status: "PUBLISHED",
      variants: {
        create: [
          {
            sku: `SHAWL-${Date.now()}-STD`,
            size: "Standard",
            colorName: "Antique Ivory",
            colorHex: "#FAF6F0",
            stockQuantity: 2,
            pricePkr: 120000,
            isActive: true,
          },
        ],
      },
    },
  });

  // 1. Initial State: visible in public storefront catalog listings
  const publicBefore = await listCatalogProducts({ search: uniqueSlug });
  assert.equal(publicBefore.length, 1, "Published product must be listed in public catalog");
  assert.equal(publicBefore[0].id, product.id);

  // 2. Soft-delete product via DELETE endpoint
  const deleteReq = new NextRequest(`http://localhost:3000/api/v1/admin/products/${product.id}`, {
    method: "DELETE",
    headers: {
      authorization: `Bearer ${token}`,
      origin: "http://localhost:3000",
      host: "localhost:3000",
      "sec-fetch-site": "same-origin",
    },
  });
  const deleteRes = await productRoute.DELETE(deleteReq, { params: Promise.resolve({ id: product.id }) });
  assert.equal(deleteRes.status, 200, "DELETE endpoint should return 200");
  const deleteBody = await deleteRes.json();
  assert.equal(deleteBody.success, true);
  assert.equal(deleteBody.archived, true);

  // Check DB product state
  const deletedDb = await prisma.product.findUnique({ where: { id: product.id } });
  assert.equal(deletedDb?.status, "ARCHIVED");
  assert.ok(deletedDb?.deletedAt !== null, "Product deletedAt timestamp must be populated");

  // Check audit log
  const auditLogs = await prisma.securityAuditLog.findMany({
    where: { entityId: product.id, action: "PRODUCT_SOFT_DELETED" },
  });
  assert.ok(auditLogs.length >= 1, "PRODUCT_SOFT_DELETED audit log must be recorded");

  // 3. Public catalog check: soft-deleted/archived product must be excluded
  const publicAfter = await listCatalogProducts({ search: uniqueSlug });
  assert.equal(publicAfter.length, 0, "Soft-deleted/archived product must be excluded from public catalog");

  // 4. Restore product via PATCH { action: "RESTORE" }
  const restoreReq = new NextRequest(`http://localhost:3000/api/v1/admin/products/${product.id}`, {
    method: "PATCH",
    headers: {
      authorization: `Bearer ${token}`,
      origin: "http://localhost:3000",
      host: "localhost:3000",
      "sec-fetch-site": "same-origin",
      "content-type": "application/json",
    },
    body: JSON.stringify({ action: "RESTORE" }),
  });
  const restoreRes = await productRoute.PATCH(restoreReq, { params: Promise.resolve({ id: product.id }) });
  assert.equal(restoreRes.status, 200, "Restore action must return 200");
  const restoreBody = await restoreRes.json();
  assert.equal(restoreBody.success, true);

  const restoredDb = await prisma.product.findUnique({ where: { id: product.id } });
  assert.equal(restoredDb?.status, "PUBLISHED");
  assert.equal(restoredDb?.deletedAt, null, "deletedAt must be reset to null upon restore");

  // Verify visible in public catalog again
  const publicRestored = await listCatalogProducts({ search: uniqueSlug });
  assert.equal(publicRestored.length, 1, "Restored product must appear back in public catalog");
});
