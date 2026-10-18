import assert from "node:assert/strict";
import { copyFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { NextRequest } from "next/server";
import { AdminUser } from "../src/types";

const repositoryRoot = path.resolve(__dirname, "..", "..");
const temporaryDirectory = mkdtempSync(path.join(tmpdir(), "noir-rbac-test-"));
const testDatabasePath = path.join(temporaryDirectory, "rbac-test.sqlite");
process.env.DATABASE_URL = `file:${testDatabasePath.replace(/\\/g, "/")}`;
copyFileSync(path.join(repositoryRoot, "backend", "prisma", "dev.db"), testDatabasePath);

let prisma: typeof import("../src/lib/prisma").prisma;
let requireAdminAuth: typeof import("../src/lib/admin-auth-guard").requireAdminAuth;
let createAdminSessionForUser: typeof import("../src/lib/admin-service").createAdminSessionForUser;
let productRoute: typeof import("../src/app/api/v1/admin/products/[id]/route");
let categoryRoute: typeof import("../src/app/api/v1/admin/categories/[id]/route");

const setupPromise = Promise.all([
  import("../src/lib/prisma"),
  import("../src/lib/admin-auth-guard"),
  import("../src/lib/admin-service"),
  import("../src/app/api/v1/admin/products/[id]/route"),
  import("../src/app/api/v1/admin/categories/[id]/route"),
]).then(([prismaMod, guardMod, adminServiceMod, prodRouteMod, catRouteMod]) => {
  prisma = prismaMod.prisma;
  requireAdminAuth = guardMod.requireAdminAuth;
  createAdminSessionForUser = adminServiceMod.createAdminSessionForUser;
  productRoute = prodRouteMod;
  categoryRoute = catRouteMod;
});

after(async () => {
  await setupPromise.catch(() => undefined);
  if (prisma) await prisma.$disconnect();
  rmSync(temporaryDirectory, { recursive: true, force: true });
});

test("RBAC: requireAdminAuth enforces role hierarchy and permits unrestricted sessions", async () => {
  await setupPromise;

  const staffUser: AdminUser = {
    id: "usr_staff_001",
    email: "staff@noirgold.test",
    name: "Staff Member",
    role: "STAFF",
    createdAt: new Date().toISOString(),
  };

  const adminUser: AdminUser = {
    id: "usr_admin_001",
    email: "admin@noirgold.test",
    name: "Executive Admin",
    role: "ADMIN",
    createdAt: new Date().toISOString(),
  };

  const staffToken = createAdminSessionForUser(staffUser);
  const adminToken = createAdminSessionForUser(adminUser);

  // 1. Staff accessing an unrestricted endpoint -> 200 (Success)
  const staffUnrestrictedReq = new NextRequest("http://localhost:3000/api/v1/admin/products", {
    headers: { authorization: `Bearer ${staffToken}` },
  });
  const staffUnrestrictedRes = await requireAdminAuth(staffUnrestrictedReq);
  assert.equal("status" in staffUnrestrictedRes, false, "Staff should access unrestricted admin endpoints");
  if (!("status" in staffUnrestrictedRes)) {
    assert.equal(staffUnrestrictedRes.user.role, "STAFF");
  }

  // 2. Staff accessing an ADMIN-only endpoint -> 403 Forbidden
  const staffRestrictedReq = new NextRequest("http://localhost:3000/api/v1/admin/products/test-1", {
    headers: { authorization: `Bearer ${staffToken}` },
  });
  const staffRestrictedRes = await requireAdminAuth(staffRestrictedReq, ["ADMIN"]);
  assert.ok("status" in staffRestrictedRes, "Staff should be blocked from ADMIN-only operations");
  assert.equal(staffRestrictedRes.status, 403);
  const staffBody = await staffRestrictedRes.json();
  assert.equal(staffBody.success, false);
  assert.equal(staffBody.error.code, "FORBIDDEN_INSUFFICIENT_ROLE");
  assert.equal(staffBody.error.message, "You do not have permission to perform this action.");

  // 3. Admin accessing an ADMIN-only endpoint -> 200 (Success)
  const adminRestrictedReq = new NextRequest("http://localhost:3000/api/v1/admin/products/test-1", {
    headers: { authorization: `Bearer ${adminToken}` },
  });
  const adminRestrictedRes = await requireAdminAuth(adminRestrictedReq, ["ADMIN"]);
  assert.equal("status" in adminRestrictedRes, false, "Admin should be permitted on ADMIN-only operations");
  if (!("status" in adminRestrictedRes)) {
    assert.equal(adminRestrictedRes.user.role, "ADMIN");
  }
});

test("RBAC: Product and Category mutating routes reject STAFF with 403 and allow ADMIN with 200", async () => {
  await setupPromise;

  const staffUser: AdminUser = {
    id: "usr_staff_002",
    email: "staff2@noirgold.test",
    name: "Staff Associate",
    role: "STAFF",
    createdAt: new Date().toISOString(),
  };

  const adminUser: AdminUser = {
    id: "usr_admin_002",
    email: "admin2@noirgold.test",
    name: "Senior Administrator",
    role: "ADMIN",
    createdAt: new Date().toISOString(),
  };

  const staffToken = createAdminSessionForUser(staffUser);
  const adminToken = createAdminSessionForUser(adminUser);

  // Setup test category and product
  const category = await prisma.category.create({
    data: {
      name: "RBAC Category Test",
      slug: `rbac-cat-${Date.now()}`,
    },
  });

  const product = await prisma.product.create({
    data: {
      categoryId: category.id,
      title: "RBAC Luxury Suit",
      slug: `rbac-suit-${Date.now()}`,
      description: "Test suit for RBAC verification",
      primaryImageUrl: "/images/test.jpg",
      pricePkr: 45000,
      variants: {
        create: [
          {
            sku: `RBAC-SUIT-${Date.now()}-M`,
            size: "M",
            colorName: "Midnight Black",
            colorHex: "#000000",
            pricePkr: 45000,
            stockQuantity: 10,
          },
        ],
      },
    },
  });

  // A. Product PATCH: STAFF is rejected with 403
  const staffPatchReq = new NextRequest(`http://localhost:3000/api/v1/admin/products/${product.id}`, {
    method: "PATCH",
    headers: {
      authorization: `Bearer ${staffToken}`,
      origin: "http://localhost:3000",
      host: "localhost:3000",
      "sec-fetch-site": "same-origin",
      "content-type": "application/json",
    },
    body: JSON.stringify({ pricePkr: 48000 }),
  });
  const staffPatchRes = await productRoute.PATCH(staffPatchReq, { params: Promise.resolve({ id: product.id }) });
  assert.equal(staffPatchRes.status, 403, "Staff should receive 403 on Product PATCH");
  const staffPatchBody = await staffPatchRes.json();
  assert.equal(staffPatchBody.error.code, "FORBIDDEN_INSUFFICIENT_ROLE");

  // B. Product PATCH: ADMIN is allowed with 200 and triggers SecurityAuditLog
  const adminPatchReq = new NextRequest(`http://localhost:3000/api/v1/admin/products/${product.id}`, {
    method: "PATCH",
    headers: {
      authorization: `Bearer ${adminToken}`,
      origin: "http://localhost:3000",
      host: "localhost:3000",
      "sec-fetch-site": "same-origin",
      "content-type": "application/json",
    },
    body: JSON.stringify({ pricePkr: 49500 }),
  });
  const adminPatchRes = await productRoute.PATCH(adminPatchReq, { params: Promise.resolve({ id: product.id }) });
  assert.equal(adminPatchRes.status, 200, "Admin should receive 200 on Product PATCH");
  const adminPatchBody = await adminPatchRes.json();
  assert.equal(adminPatchBody.success, true);

  // Check audit log for PRICE_CHANGED
  const auditLogs = await prisma.securityAuditLog.findMany({
    where: { entityId: product.id, action: "PRICE_CHANGED" },
  });
  assert.ok(auditLogs.length >= 1, "Price change should record a security audit log");
  assert.equal(auditLogs[0].actorId, adminUser.id);
  assert.equal(auditLogs[0].actorEmail, adminUser.email);

  // C. Category DELETE: STAFF is rejected with 403
  const staffCatDeleteReq = new NextRequest(`http://localhost:3000/api/v1/admin/categories/${category.id}`, {
    method: "DELETE",
    headers: {
      authorization: `Bearer ${staffToken}`,
      origin: "http://localhost:3000",
      host: "localhost:3000",
      "sec-fetch-site": "same-origin",
    },
  });
  const staffCatDeleteRes = await categoryRoute.DELETE(staffCatDeleteReq, { params: Promise.resolve({ id: category.id }) });
  assert.equal(staffCatDeleteRes.status, 403, "Staff should receive 403 on Category DELETE");
  const staffCatDeleteBody = await staffCatDeleteRes.json();
  assert.equal(staffCatDeleteBody.error.code, "FORBIDDEN_INSUFFICIENT_ROLE");

  // D. Category DELETE: ADMIN is allowed with 200 and soft-deletes category
  const adminCatDeleteReq = new NextRequest(`http://localhost:3000/api/v1/admin/categories/${category.id}`, {
    method: "DELETE",
    headers: {
      authorization: `Bearer ${adminToken}`,
      origin: "http://localhost:3000",
      host: "localhost:3000",
      "sec-fetch-site": "same-origin",
    },
  });
  const adminCatDeleteRes = await categoryRoute.DELETE(adminCatDeleteReq, { params: Promise.resolve({ id: category.id }) });
  assert.equal(adminCatDeleteRes.status, 200, "Admin should receive 200 on Category DELETE");
  const adminCatDeleteBody = await adminCatDeleteRes.json();
  assert.equal(adminCatDeleteBody.success, true);

  const updatedCat = await prisma.category.findUnique({ where: { id: category.id } });
  assert.equal(updatedCat?.isActive, false, "Category should be inactive after soft delete");
  assert.ok(updatedCat?.deletedAt !== null, "deletedAt should be populated");
});
