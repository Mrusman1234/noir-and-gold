import assert from "node:assert/strict";
import { copyFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { NextRequest } from "next/server";
import { AdminUser } from "../src/types";

const repositoryRoot = path.resolve(__dirname, "..", "..");
const temporaryDirectory = mkdtempSync(path.join(tmpdir(), "noir-export-test-"));
const testDatabasePath = path.join(temporaryDirectory, "export-test.sqlite");
process.env.DATABASE_URL = `file:${testDatabasePath.replace(/\\/g, "/")}`;
copyFileSync(path.join(repositoryRoot, "backend", "prisma", "dev.db"), testDatabasePath);

let prisma: typeof import("../src/lib/prisma").prisma;
let createAdminSessionForUser: typeof import("../src/lib/admin-service").createAdminSessionForUser;
let exportRoute: typeof import("../src/app/api/v1/admin/orders/export/route");
let refundRoute: typeof import("../src/app/api/v1/admin/orders/[orderReference]/refund/route");
let orderDetailRoute: typeof import("../src/app/api/v1/admin/orders/[orderReference]/route");

const setupPromise = Promise.all([
  import("../src/lib/prisma"),
  import("../src/lib/admin-service"),
  import("../src/app/api/v1/admin/orders/export/route"),
  import("../src/app/api/v1/admin/orders/[orderReference]/refund/route"),
  import("../src/app/api/v1/admin/orders/[orderReference]/route"),
]).then(([prismaMod, adminServiceMod, exportRouteMod, refundRouteMod, orderDetailRouteMod]) => {
  prisma = prismaMod.prisma;
  createAdminSessionForUser = adminServiceMod.createAdminSessionForUser;
  exportRoute = exportRouteMod;
  refundRoute = refundRouteMod;
  orderDetailRoute = orderDetailRouteMod;
});

after(async () => {
  await setupPromise.catch(() => undefined);
  if (prisma) await prisma.$disconnect();
  rmSync(temporaryDirectory, { recursive: true, force: true });
});

test("Export Orders CSV: Unauthenticated request is rejected with 401 UNAUTHORIZED", async () => {
  await setupPromise;

  const request = new NextRequest("http://localhost:3000/api/v1/admin/orders/export", {
    method: "GET",
  });

  const response = await exportRoute.GET(request);
  assert.equal(response.status, 401);

  const body = await response.json();
  assert.equal(body.success, false);
  assert.equal(body.error.code, "UNAUTHORIZED");
});

test("Export Orders CSV: RBAC permits ADMIN and STAFF, rejects CUSTOMER with 403", async () => {
  await setupPromise;

  const customerUser: AdminUser = {
    id: "usr_cust_exp_1",
    email: "customer@noirgold.test",
    name: "Customer User",
    role: "CUSTOMER",
    createdAt: new Date().toISOString(),
  };
  const staffUser: AdminUser = {
    id: "usr_staff_exp_1",
    email: "staff@noirgold.test",
    name: "Staff Logistics",
    role: "STAFF",
    createdAt: new Date().toISOString(),
  };

  const customerToken = createAdminSessionForUser(customerUser);
  const staffToken = createAdminSessionForUser(staffUser);

  // CUSTOMER -> 403 Forbidden
  const reqCustomer = new NextRequest("http://localhost:3000/api/v1/admin/orders/export", {
    method: "GET",
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  const resCustomer = await exportRoute.GET(reqCustomer);
  assert.equal(resCustomer.status, 403);
  const bodyCustomer = await resCustomer.json();
  assert.equal(bodyCustomer.error.code, "FORBIDDEN_INSUFFICIENT_ROLE");

  // STAFF -> 200 OK
  const reqStaff = new NextRequest("http://localhost:3000/api/v1/admin/orders/export", {
    method: "GET",
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  const resStaff = await exportRoute.GET(reqStaff);
  assert.equal(resStaff.status, 200);
});

test("Export Orders CSV: Filters correctly by paymentMethod, paymentStatus, and date range", async () => {
  await setupPromise;

  const adminUser: AdminUser = {
    id: "usr_admin_filter_1",
    email: "cfo@noirgold.test",
    name: "Financial Controller",
    role: "ADMIN",
    createdAt: new Date().toISOString(),
  };
  const token = createAdminSessionForUser(adminUser);

  const testRefA = `ORD-FLT-${Date.now()}-A`;
  const testRefB = `ORD-FLT-${Date.now()}-B`;

  await prisma.order.createMany({
    data: [
      {
        orderReference: testRefA,
        verificationTokenHash: `hash_${testRefA}`,
        idempotencyKey: `idem_${testRefA}`,
        customerFullName: "Ahmed Raza",
        customerEmail: "ahmed@example.com",
        customerPhone: "+923001112233",
        shippingProvince: "Sindh",
        shippingCity: "Karachi",
        shippingArea: "DHA Phase 6",
        shippingStreetAddress: "Khayaban-e-Ittehad",
        subtotalPkr: 75000,
        deliveryFeePkr: 0,
        totalPkr: 75000,
        paymentMethod: "CASH_ON_DELIVERY",
        paymentStatus: "PENDING",
        orderStatus: "CONFIRMED",
        createdAt: new Date("2026-03-01T10:00:00Z"),
      },
      {
        orderReference: testRefB,
        verificationTokenHash: `hash_${testRefB}`,
        idempotencyKey: `idem_${testRefB}`,
        customerFullName: "Fatima Noor",
        customerEmail: "fatima@example.com",
        customerPhone: "+923215556677",
        shippingProvince: "Punjab",
        shippingCity: "Lahore",
        shippingArea: "Cantt",
        shippingStreetAddress: "Mall Road",
        subtotalPkr: 140000,
        deliveryFeePkr: 0,
        totalPkr: 140000,
        paymentMethod: "JAZZCASH",
        paymentStatus: "PAID",
        orderStatus: "DELIVERED",
        createdAt: new Date("2026-04-15T14:30:00Z"),
      },
    ],
  });

  // Filter 1: By paymentStatus=PAID
  const reqPaid = new NextRequest(
    `http://localhost:3000/api/v1/admin/orders/export?paymentStatus=PAID&search=${testRefB}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const resPaid = await exportRoute.GET(reqPaid);
  assert.equal(resPaid.status, 200);
  const csvPaid = await resPaid.text();
  assert.ok(csvPaid.includes(testRefB));
  assert.ok(!csvPaid.includes(testRefA));

  // Filter 2: By Date Range (March 2026 only)
  const reqDate = new NextRequest(
    `http://localhost:3000/api/v1/admin/orders/export?startDate=2026-03-01&endDate=2026-03-31&search=${testRefA}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const resDate = await exportRoute.GET(reqDate);
  assert.equal(resDate.status, 200);
  const csvDate = await resDate.text();
  assert.ok(csvDate.includes(testRefA));
  assert.ok(!csvDate.includes(testRefB));
});

test("Export Orders CSV: Escapes quotes, commas, and special characters per RFC-4180", async () => {
  await setupPromise;

  const adminUser: AdminUser = {
    id: "usr_admin_rfc_1",
    email: "compliance@noirgold.test",
    name: "Compliance Auditor",
    role: "ADMIN",
    createdAt: new Date().toISOString(),
  };
  const token = createAdminSessionForUser(adminUser);

  const testRefSpecial = `ORD-RFC-${Date.now()}`;
  const trickyName = `Mian "Shahid" Qureshi, Esq.`;
  const trickyCity = `Rawalpindi, Cantt`;

  await prisma.order.create({
    data: {
      orderReference: testRefSpecial,
      verificationTokenHash: `hash_${testRefSpecial}`,
      idempotencyKey: `idem_${testRefSpecial}`,
      customerFullName: trickyName,
      customerEmail: "shahid.q@example.com",
      customerPhone: "+923337778899",
      shippingProvince: "Punjab",
      shippingCity: trickyCity,
      shippingArea: "Saddar",
      shippingStreetAddress: 'House 14, St "B", Lane 3',
      subtotalPkr: 92000,
      deliveryFeePkr: 0,
      totalPkr: 92000,
      paymentMethod: "CASH_ON_DELIVERY",
      paymentStatus: "PENDING",
      orderStatus: "PROCESSING",
    },
  });

  const request = new NextRequest(
    `http://localhost:3000/api/v1/admin/orders/export?search=${testRefSpecial}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const response = await exportRoute.GET(request);
  assert.equal(response.status, 200);
  const csvText = await response.text();

  // Verify proper RFC-4180 escaping: embedded quotes doubled and wrapped
  assert.ok(csvText.includes('"Mian ""Shahid"" Qureshi, Esq."'));
  assert.ok(csvText.includes('"Rawalpindi, Cantt"'));
  assert.ok(csvText.includes(testRefSpecial));
});

test("Refund API: Restricts to ADMIN, validates capacity, updates order paymentStatus, and logs audit events", async () => {
  await setupPromise;

  const adminUser: AdminUser = {
    id: "usr_admin_rf_1",
    email: "head-finance@noirgold.test",
    name: "Head of Finance",
    role: "ADMIN",
    createdAt: new Date().toISOString(),
  };
  const staffUser: AdminUser = {
    id: "usr_staff_rf_1",
    email: "staff.ops@noirgold.test",
    name: "Staff Ops",
    role: "STAFF",
    createdAt: new Date().toISOString(),
  };

  const adminToken = createAdminSessionForUser(adminUser);
  const staffToken = createAdminSessionForUser(staffUser);

  const testRefRefund = `ORD-REFUND-${Date.now()}`;
  const order = await prisma.order.create({
    data: {
      orderReference: testRefRefund,
      verificationTokenHash: `hash_${testRefRefund}`,
      idempotencyKey: `idem_${testRefRefund}`,
      customerFullName: "Bilal Tariq",
      customerEmail: "bilal@example.com",
      customerPhone: "+923014443322",
      shippingProvince: "Sindh",
      shippingCity: "Karachi",
      shippingArea: "Bath Island",
      shippingStreetAddress: "Villa 9",
      subtotalPkr: 60000,
      deliveryFeePkr: 0,
      totalPkr: 60000,
      paymentMethod: "BANK_TRANSFER",
      paymentStatus: "PAID",
      orderStatus: "CONFIRMED",
    },
  });

  // 1. Unauthenticated request -> 401
  const reqUnauth = new NextRequest(
    `http://localhost:3000/api/v1/admin/orders/${testRefRefund}/refund`,
    {
      method: "POST",
      body: JSON.stringify({ amountPkr: 20000, reason: "Defective embellishment", refundMethod: "MANUAL_BANK_TRANSFER" }),
    }
  );
  const resUnauth = await refundRoute.POST(reqUnauth, {
    params: Promise.resolve({ orderReference: testRefRefund }),
  });
  assert.equal(resUnauth.status, 401);

  // 2. STAFF role request -> 403 (Only ADMIN can refund)
  const reqStaff = new NextRequest(
    `http://localhost:3000/api/v1/admin/orders/${testRefRefund}/refund`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${staffToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amountPkr: 20000, reason: "Defective embellishment", refundMethod: "MANUAL_BANK_TRANSFER" }),
    }
  );
  const resStaff = await refundRoute.POST(reqStaff, {
    params: Promise.resolve({ orderReference: testRefRefund }),
  });
  assert.equal(resStaff.status, 403);

  // 3. Refund exceeding total (e.g. 70,000 on 60,000 order) -> 400 REFUND_EXCEEDS_TOTAL
  const reqExceed = new NextRequest(
    `http://localhost:3000/api/v1/admin/orders/${testRefRefund}/refund`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amountPkr: 70000, reason: "Too high", refundMethod: "MANUAL_BANK_TRANSFER" }),
    }
  );
  const resExceed = await refundRoute.POST(reqExceed, {
    params: Promise.resolve({ orderReference: testRefRefund }),
  });
  assert.equal(resExceed.status, 400);
  const bodyExceed = await resExceed.json();
  assert.equal(bodyExceed.error.code, "REFUND_EXCEEDS_TOTAL");

  // 4. Partial refund: 25,000 PKR -> Updates order to PARTIALLY_REFUNDED
  const reqPartial = new NextRequest(
    `http://localhost:3000/api/v1/admin/orders/${testRefRefund}/refund`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amountPkr: 25000,
        reason: "Customer requested sleeve alteration refund",
        refundMethod: "MANUAL_BANK_TRANSFER",
        note: "IBFT transfer reference: HBL-98127391",
      }),
    }
  );
  const resPartial = await refundRoute.POST(reqPartial, {
    params: Promise.resolve({ orderReference: testRefRefund }),
  });
  assert.equal(resPartial.status, 200);
  const bodyPartial = await resPartial.json();
  assert.equal(bodyPartial.success, true);
  assert.equal(bodyPartial.order.paymentStatus, "PARTIALLY_REFUNDED");
  assert.equal(bodyPartial.remainingBalance, 35000);

  // 5. Remaining full refund: 35,000 PKR -> Updates order to REFUNDED
  const reqFull = new NextRequest(
    `http://localhost:3000/api/v1/admin/orders/${testRefRefund}/refund`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amountPkr: 35000,
        reason: "Return and full balance settlement",
        refundMethod: "STORE_CREDIT",
      }),
    }
  );
  const resFull = await refundRoute.POST(reqFull, {
    params: Promise.resolve({ orderReference: testRefRefund }),
  });
  assert.equal(resFull.status, 200);
  const bodyFull = await resFull.json();
  assert.equal(bodyFull.success, true);
  assert.equal(bodyFull.order.paymentStatus, "REFUNDED");
  assert.equal(bodyFull.remainingBalance, 0);

  // 6. Verify audit logs created
  const auditLogs = await prisma.orderAuditLog.findMany({
    where: { orderId: order.id, action: "ORDER_REFUNDED" },
  });
  assert.equal(auditLogs.length, 2);

  const securityLogs = await prisma.securityAuditLog.findMany({
    where: { entityId: order.id, action: "ORDER_REFUNDED" },
  });
  assert.equal(securityLogs.length, 2);

  // 7. Verify order detail inspection endpoint exposes payment attempts and refunds
  const reqDetail = new NextRequest(
    `http://localhost:3000/api/v1/admin/orders/${testRefRefund}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${adminToken}` },
    }
  );
  const resDetail = await orderDetailRoute.GET(reqDetail, {
    params: Promise.resolve({ orderReference: testRefRefund }),
  });
  assert.equal(resDetail.status, 200);
  const bodyDetail = await resDetail.json();
  assert.equal(bodyDetail.success, true);
  assert.ok(bodyDetail.order.refunds);
  assert.equal(bodyDetail.order.refunds.length, 2);
  assert.ok(bodyDetail.order.paymentAttempts);
});
