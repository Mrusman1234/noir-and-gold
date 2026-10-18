import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { NextRequest } from "next/server";

// Test setup
const repositoryRoot = path.resolve(__dirname, "..", "..");
const testDbPath = path.join(tmpdir(), "noir-sec-test.sqlite");
copyFileSync(path.join(repositoryRoot, "backend", "prisma", "dev.db"), testDbPath);
process.env.DATABASE_URL = `file:${testDbPath.replace(/\\/g, "/")}`;
process.env.ORDER_VERIFICATION_SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
process.env.ADMIN_EMAIL = "admin@noirgold.test";
const TEST_ADMIN_PASSWORD = randomBytes(16).toString("base64url");
process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;

test("SEC-HIGH-01: Order service enforces line and total quantity limits", async () => {
  const { validateOrderInput, MAX_LINE_QUANTITY, MAX_ORDER_TOTAL_QUANTITY } = await import(
    "../src/lib/order-service"
  );

  assert.equal(MAX_LINE_QUANTITY, 5);
  assert.equal(MAX_ORDER_TOTAL_QUANTITY, 15);

  const baseInput = {
    customer: {
      fullName: "Ayesha Khan",
      email: "ayesha@example.com",
      phone: "+92 300 1234567",
      province: "Islamabad Capital",
      city: "Islamabad",
      area: "F-7",
      streetAddress: "House 12, Street 4, F-7/2",
      postalCode: "44000",
    },
    idempotencyKey: "test-sec-limit-1",
  };

  // Rejects single line > 5
  assert.throws(
    () => {
      validateOrderInput({
        ...baseInput,
        items: [{ productId: "prod-1", size: "M", color: "Black", quantity: 6 }],
      });
    },
    (err: unknown) =>
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "QUANTITY_LIMIT_EXCEEDED"
  );

  // Rejects total quantity > 15
  assert.throws(
    () => {
      validateOrderInput({
        ...baseInput,
        items: [
          { productId: "prod-1", size: "M", color: "Black", quantity: 5 },
          { productId: "prod-2", size: "L", color: "Gold", quantity: 5 },
          { productId: "prod-3", size: "S", color: "Ivory", quantity: 5 },
          { productId: "prod-4", size: "XL", color: "Navy", quantity: 2 }, // Total = 17 > 15
        ],
      });
    },
    (err: unknown) =>
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "QUANTITY_LIMIT_EXCEEDED"
  );

  // Accepts valid quantities within limits
  assert.doesNotThrow(() => {
    validateOrderInput({
      ...baseInput,
      items: [
        { productId: "prod-1", size: "M", color: "Black", quantity: 5 },
        { productId: "prod-2", size: "L", color: "Gold", quantity: 5 },
        { productId: "prod-3", size: "S", color: "Ivory", quantity: 5 }, // Total = 15 <= 15
      ],
    });
  });
});

test("SEC-HIGH-01: Dual checkout rate limiter throttles phone and IP abuse", async () => {
  const {
    checkCheckoutRateLimit,
    recordCheckoutAttempt,
    normalizePhoneNumber,
    clearCheckoutRateLimits,
    MAX_ORDERS_PER_PHONE,
    MAX_ORDERS_PER_IP,
  } = await import("../src/lib/checkout-rate-limit");

  clearCheckoutRateLimits();

  // Test phone normalization across Pakistan number variations
  const p1 = normalizePhoneNumber("+92 300 1234567");
  const p2 = normalizePhoneNumber("0300-1234567");
  const p3 = normalizePhoneNumber("923001234567");
  assert.equal(p1, "923001234567");
  assert.equal(p2, "923001234567");
  assert.equal(p3, "923001234567");

  const testPhone = "+92 321 9876543";
  const testIp = "203.0.113.42";

  // Check initial state
  const initial = checkCheckoutRateLimit(testIp, testPhone);
  assert.equal(initial.allowed, true);

  // Exhaust phone quota (5 orders)
  for (let i = 0; i < MAX_ORDERS_PER_PHONE; i++) {
    recordCheckoutAttempt(`different-ip-${i}`, testPhone);
  }

  // 6th order with the same phone must be blocked, even from a new IP
  const blockedPhone = checkCheckoutRateLimit("new-ip-999", testPhone);
  assert.equal(blockedPhone.allowed, false);
  assert.equal(blockedPhone.reason, "PHONE_LIMIT_EXCEEDED");
  assert.ok((blockedPhone.retryAfterSeconds ?? 0) > 0);

  clearCheckoutRateLimits();

  // Exhaust IP quota (10 orders)
  for (let i = 0; i < MAX_ORDERS_PER_IP; i++) {
    recordCheckoutAttempt(testIp, `+92 345 000000${i}`);
  }

  // 11th order from the same IP must be blocked, even with a new phone
  const blockedIp = checkCheckoutRateLimit(testIp, "+92 333 1112233");
  assert.equal(blockedIp.allowed, false);
  assert.equal(blockedIp.reason, "IP_LIMIT_EXCEEDED");
  assert.ok((blockedIp.retryAfterSeconds ?? 0) > 0);

  clearCheckoutRateLimits();
});

test("SEC-MED-01: Admin login throttles email brute-force across rotating IPs", async () => {
  const {
    checkDualLoginAllowed,
    recordDualLoginFailure,
    clearDualLoginFailures,
    resetAllLoginRateLimits,
    MAX_FAILURES_PER_EMAIL,
  } = await import("../src/lib/login-rate-limit");

  resetAllLoginRateLimits();

  const targetEmail = "director@noirgold.test";

  // Simulate attacker attempting 5 passwords while rotating X-Forwarded-For IP every attempt
  for (let i = 1; i <= MAX_FAILURES_PER_EMAIL; i++) {
    const rotatingIp = `192.0.2.${i}`;
    assert.equal(
      checkDualLoginAllowed(targetEmail, rotatingIp).allowed,
      true,
      `Attempt ${i} should be permitted`
    );
    recordDualLoginFailure(targetEmail, rotatingIp);
  }

  // 6th attempt from completely new IP 203.0.113.100 must be BLOCKED due to email bucket lock
  const locked = checkDualLoginAllowed(targetEmail, "203.0.113.100");
  assert.equal(locked.allowed, false);
  assert.equal(locked.reason, "EMAIL_LOCKED");
  assert.ok(locked.retryAfterSeconds > 0);

  // Clearing upon successful login resets state
  clearDualLoginFailures(targetEmail, "203.0.113.100");
  assert.equal(checkDualLoginAllowed(targetEmail, "203.0.113.100").allowed, true);

  resetAllLoginRateLimits();
});

test("SEC-LOW-01: Admin auth guard enforces CSRF Origin and Sec-Fetch-Site validation", async () => {
  const { authenticateAdmin } = await import("../src/lib/admin-service");
  const { requireAdminAuth } = await import("../src/lib/admin-auth-guard");

  const auth = await authenticateAdmin("admin@noirgold.test", TEST_ADMIN_PASSWORD);
  assert.ok(auth, "Test admin should authenticate");

  // 1. Unauthenticated request -> 401
  const unauthReq = new NextRequest("http://localhost:3000/api/v1/admin/orders");
  const unauthRes = await requireAdminAuth(unauthReq);
  assert.ok("status" in unauthRes);
  assert.equal(unauthRes.status, 401);

  // 2. Cross-site mutating request with valid cookie -> 403 CSRF_FORBIDDEN
  const crossSiteReq = new NextRequest("http://localhost:3000/api/v1/admin/orders/NG-100", {
    method: "PATCH",
    headers: {
      cookie: `noir_admin_session=${auth.token}`,
      "sec-fetch-site": "cross-site",
    },
    body: JSON.stringify({ orderStatus: "CONFIRMED" }),
  });
  const crossSiteRes = await requireAdminAuth(crossSiteReq);
  assert.ok("status" in crossSiteRes);
  assert.equal(crossSiteRes.status, 403);
  const crossSiteBody = await crossSiteRes.json();
  assert.equal(crossSiteBody.error.code, "CSRF_FORBIDDEN");

  // 3. Foreign Origin mutating request with valid cookie -> 403 CSRF_FORBIDDEN
  const evilOriginReq = new NextRequest("http://localhost:3000/api/v1/admin/orders/NG-100", {
    method: "POST",
    headers: {
      cookie: `noir_admin_session=${auth.token}`,
      origin: "https://malicious-phishing-site.example",
      host: "localhost:3000",
    },
    body: JSON.stringify({ note: "Malicious mutation" }),
  });
  const evilOriginRes = await requireAdminAuth(evilOriginReq);
  assert.ok("status" in evilOriginRes);
  assert.equal(evilOriginRes.status, 403);

  // 4. Legitimate same-origin mutating request -> success (returns authenticated user)
  const validReq = new NextRequest("http://localhost:3000/api/v1/admin/orders/NG-100", {
    method: "PATCH",
    headers: {
      cookie: `noir_admin_session=${auth.token}`,
      origin: "http://localhost:3000",
      host: "localhost:3000",
      "sec-fetch-site": "same-origin",
    },
    body: JSON.stringify({ orderStatus: "CONFIRMED" }),
  });
  const validRes = await requireAdminAuth(validReq);
  assert.ok("user" in validRes, "Valid same-origin request should return authenticated user");
  assert.equal(validRes.user.email, "admin@noirgold.test");
});

test("SEC-MED-03 & SEC-MED-04: Next.js configuration security checks", async () => {
  const nextConfigModule = await import("../next.config");
  const nextConfig = nextConfigModule.default;

  // Remote patterns must not have wildcards or insecure HTTP
  assert.ok(nextConfig.images?.remotePatterns, "Remote patterns should be defined");
  for (const pattern of nextConfig.images.remotePatterns) {
    assert.equal(pattern.protocol, "https", "All remote image protocols must be HTTPS");
    assert.notEqual(pattern.hostname, "**", "Wildcard hostname is forbidden");
    assert.notEqual(pattern.hostname, "*", "Wildcard hostname is forbidden");
  }

  // Security headers must be present
  assert.ok(typeof nextConfig.headers === "function", "headers() function must be defined");
  const headersConfig = await nextConfig.headers();
  assert.ok(Array.isArray(headersConfig));

  interface HeaderRule {
    source: string;
    headers: Array<{ key: string; value: string }>;
  }
  const rootRule = (headersConfig as unknown as HeaderRule[]).find((h) => h.source === "/:path*");
  assert.ok(rootRule, "Root path security headers rule must exist");

  const headerKeys = rootRule.headers.map((h) => h.key.toLowerCase());
  assert.ok(headerKeys.includes("content-security-policy"), "CSP header missing");
  assert.ok(headerKeys.includes("x-frame-options"), "X-Frame-Options missing");
  assert.ok(headerKeys.includes("x-content-type-options"), "X-Content-Type-Options missing");
  assert.ok(headerKeys.includes("referrer-policy"), "Referrer-Policy missing");
  assert.ok(headerKeys.includes("strict-transport-security"), "HSTS missing");
  assert.equal(nextConfig.productionBrowserSourceMaps, false, "Production browser source maps must be disabled");
});

test("SEC-MED-01: Admin login route returns HTTP 429 and Retry-After header when locked", async () => {
  const { POST } = await import("../src/app/api/v1/admin/auth/login/route");
  const { resetAllLoginRateLimits } = await import("../src/lib/login-rate-limit");
  resetAllLoginRateLimits();

  const attackEmail = "target-admin@noirgold.test";
  const clientIp = "192.168.1.50";

  // Send 10 failed attempts from single client IP
  for (let i = 0; i < 10; i++) {
    const res = await POST(
      new NextRequest("http://localhost/api/v1/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": clientIp },
        body: JSON.stringify({ email: attackEmail, password: "wrong-password" }),
      })
    );
    assert.equal(res.status, 401);
  }

  // 11th attempt must be rejected with 429 and Retry-After
  const throttledRes = await POST(
    new NextRequest("http://localhost/api/v1/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": clientIp },
      body: JSON.stringify({ email: attackEmail, password: "any-password" }),
    })
  );
  assert.equal(throttledRes.status, 429);
  assert.ok(throttledRes.headers.get("retry-after"));
  const body = await throttledRes.json();
  assert.equal(body.error.code, "TOO_MANY_ATTEMPTS");

  resetAllLoginRateLimits();
});

test("Check 1 (SQL Injection): Parameterized queries safely neutralize injection payloads", async () => {
  const { getPersistentAdminOrders, normalizeAdminOrderPagination } = await import(
    "../src/lib/admin-order-read-service"
  );

  // Pagination bounds enforcement
  const pDefault = normalizeAdminOrderPagination(undefined, undefined);
  assert.equal(pDefault.limit, 50, "Default limit should be 50");
  assert.equal(pDefault.offset, 0);

  const p1 = normalizeAdminOrderPagination(-5, -10);
  assert.equal(p1.limit, 1, "Negative limit should clamp to minimum 1");
  assert.equal(p1.offset, 0);

  const p2 = normalizeAdminOrderPagination(1000000, 20);
  assert.equal(p2.limit, 100, "Excessive limit should clamp to maximum 100");
  assert.equal(p2.offset, 20);

  // Malicious SQL injection payloads in search and status parameters
  const sqlPayloads = [
    "' OR '1'='1",
    "'; DROP TABLE \"Order\"; --",
    "admin' UNION SELECT 1, 2, 3 --",
    "1' AND SLEEP(5) --",
  ];

  for (const maliciousInput of sqlPayloads) {
    const result = await getPersistentAdminOrders({
      search: maliciousInput,
      status: maliciousInput,
      limit: 10,
      offset: 0,
    });
    // Queries execute safely through Prisma parameterization and return empty results instead of crashing or leaking
    assert.equal(Array.isArray(result.orders), true);
    assert.equal(typeof result.total, "number");
  }
});

test("Check 6 (BOLA / IDOR): Guest order lookup requires matching cryptographic HMAC token", async () => {
  const { getVerifiedOrder } = await import("../src/lib/order-service");

  // Lookup with missing token -> null
  const noToken = await getVerifiedOrder("NG-2026-99999", "");
  assert.equal(noToken, null);

  // Lookup with forged token -> null
  const forgedToken = await getVerifiedOrder(
    "NG-2026-99999",
    "v1.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
  );
  assert.equal(forgedToken, null);

  // Non-existent order with synthetic token -> null
  const missingOrder = await getVerifiedOrder("NG-2026-00000", "v1.validformatlookingfaketoken123456789012345678");
  assert.equal(missingOrder, null);
});


