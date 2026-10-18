import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

// Credentials are configured before the admin service is imported so the account bootstraps.
process.env.DATABASE_URL = `file:${path.join(tmpdir(), "noir-session-reliability.sqlite").replace(/\\/g, "/")}`;
process.env.ADMIN_EMAIL = "owner@noirandgold.test";
const ADMIN_PASSWORD = randomBytes(18).toString("base64url");
process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
process.env.ADMIN_NAME = "Atelier Owner";

const ADMIN_COOKIE_NAME = "noir_admin_session";

function tokenFromSetCookie(setCookie: string | null): string | null {
  if (!setCookie) return null;
  const match = new RegExp(`${ADMIN_COOKIE_NAME}=([0-9a-f]{64})`).exec(setCookie);
  return match ? match[1] : null;
}

function cookieHeader(token: string): string {
  return `${ADMIN_COOKIE_NAME}=${token}`;
}

async function login(email: string, password: string, ip: string) {
  const { NextRequest } = await import("next/server");
  const { POST } = await import("../src/app/api/v1/admin/auth/login/route");
  return POST(
    new NextRequest("http://localhost/api/v1/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify({ email, password }),
    })
  );
}

async function me(cookie?: string) {
  const { NextRequest } = await import("next/server");
  const { GET } = await import("../src/app/api/v1/admin/auth/me/route");
  return GET(
    new NextRequest("http://localhost/api/v1/admin/auth/me", {
      headers: cookie ? { cookie } : {},
    })
  );
}

test("admin session reliability: login, cookies, logout, forgery, expiry and throttling", async (t) => {
  const { NextRequest } = await import("next/server");
  const { POST: logoutPost } = await import("../src/app/api/v1/admin/auth/logout/route");
  const { verifyAdminSession } = await import("../src/lib/admin-service");

  await t.test("login rejects malformed and invalid credentials without issuing a session", async () => {
    const missing = await login("", "", "198.51.100.1");
    assert.equal(missing.status, 400);
    assert.equal((await missing.json()).error.code, "MISSING_CREDENTIALS");
    assert.equal(missing.headers.get("set-cookie"), null, "no cookie may be issued on a failed login");

    const wrong = await login("owner@noirandgold.test", "definitely-wrong", "198.51.100.2");
    assert.equal(wrong.status, 401);
    assert.equal((await wrong.json()).error.code, "INVALID_CREDENTIALS");
    assert.equal(wrong.headers.get("set-cookie"), null);

    const unknown = await login("stranger@example.test", ADMIN_PASSWORD, "198.51.100.3");
    assert.equal(unknown.status, 401);
    assert.equal(unknown.headers.get("set-cookie"), null, "unknown emails must not receive a session");
  });

  await t.test("a successful login sets a hardened cookie that authenticates the session", async () => {
    const response = await login("Owner@NoirAndGold.test", ADMIN_PASSWORD, "198.51.100.4");
    assert.equal(response.status, 200);

    const setCookie = response.headers.get("set-cookie") ?? "";
    assert.match(setCookie, new RegExp(`^${ADMIN_COOKIE_NAME}=`));
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /SameSite=lax/i);
    assert.match(setCookie, /Path=\//i);
    assert.match(setCookie, new RegExp(`Max-Age=${60 * 60 * 24}`));

    const token = tokenFromSetCookie(setCookie);
    assert.ok(token, "the session cookie should carry a token");

    const meResponse = await me(cookieHeader(token!));
    assert.equal(meResponse.status, 200);
    const meBody = await meResponse.json();
    assert.equal(meBody.user.email, "owner@noirandgold.test");
    assert.equal(meBody.user.role, "ADMIN");
    assert.ok(await verifyAdminSession(token!));
  });

  await t.test("logout invalidates the session token", async () => {
    const login_ = await login("owner@noirandgold.test", ADMIN_PASSWORD, "198.51.100.5");
    const token = tokenFromSetCookie(login_.headers.get("set-cookie"));
    assert.ok(token);

    const logoutResponse = await logoutPost(
      new NextRequest("http://localhost/api/v1/admin/auth/logout", {
        method: "POST",
        headers: { cookie: cookieHeader(token!) },
      })
    );
    assert.equal(logoutResponse.status, 200);
    assert.match(String(logoutResponse.headers.get("set-cookie")), /Max-Age=0/i);
    assert.equal(await verifyAdminSession(token!), null);

    const afterLogout = await me(cookieHeader(token!));
    assert.equal(afterLogout.status, 401);
    assert.equal((await afterLogout.json()).error.code, "SESSION_EXPIRED");
  });

  await t.test("forged, malformed and absent session tokens are rejected", async () => {
    const forged = randomBytes(32).toString("hex");
    assert.equal(await verifyAdminSession(forged), null);
    assert.equal(await verifyAdminSession("not-a-token"), null);
    assert.equal(await verifyAdminSession(null), null);
    assert.equal(await verifyAdminSession(""), null);

    const forgedResponse = await me(cookieHeader(forged));
    assert.equal(forgedResponse.status, 401);
    assert.equal((await forgedResponse.json()).error.code, "SESSION_EXPIRED");

    const anonymous = await me();
    assert.equal(anonymous.status, 401);
    assert.equal((await anonymous.json()).error.code, "UNAUTHORIZED");

    const { GET: protectedProducts } = await import("../src/app/api/v1/admin/products/route");
    const protectedResponse = await protectedProducts(
      new NextRequest("http://localhost/api/v1/admin/products")
    );
    assert.equal(protectedResponse.status, 401);
  });

  await t.test("repeated failures from one client are throttled and success clears the counter", async () => {
    const blockedIp = "203.0.113.10";
    for (let attempt = 1; attempt <= 10; attempt += 1) {
      const response = await login("owner@noirandgold.test", "wrong-password", blockedIp);
      assert.equal(response.status, 401, `attempt ${attempt} should be rejected but not throttled`);
    }

    const throttled = await login("owner@noirandgold.test", ADMIN_PASSWORD, blockedIp);
    assert.equal(throttled.status, 429, "the 11th attempt must be throttled even with a valid password");
    assert.equal((await throttled.json()).error.code, "TOO_MANY_ATTEMPTS");
    assert.equal(throttled.headers.get("set-cookie"), null);

    // A different client is unaffected by another client's failures.
    const otherIp = "203.0.113.11";
    for (let attempt = 0; attempt < 9; attempt += 1) {
      await login("owner@noirandgold.test", "wrong-password", otherIp);
    }
    const success = await login("owner@noirandgold.test", ADMIN_PASSWORD, otherIp);
    assert.equal(success.status, 200, "9 failures must still allow a valid sign-in");

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await login("owner@noirandgold.test", "wrong-password", otherIp);
      assert.equal(response.status, 401, "a successful login must clear prior failure tracking");
    }
  });

  await t.test("an expired session is rejected", async () => {
    const response = await login("owner@noirandgold.test", ADMIN_PASSWORD, "203.0.113.12");
    const token = tokenFromSetCookie(response.headers.get("set-cookie"));
    assert.ok(token);
    assert.ok(await verifyAdminSession(token!), "the session should be valid before expiry");

    // Advance the wall clock past the 24 hour session lifetime.
    const realNow = Date.now;
    Date.now = () => realNow() + 24 * 60 * 60 * 1000 + 1000;
    try {
      assert.equal(await verifyAdminSession(token!), null, "a session past its expiry must be rejected");
      const expired = await me(cookieHeader(token!));
      assert.equal(expired.status, 401);
      assert.equal((await expired.json()).error.code, "SESSION_EXPIRED");
    } finally {
      Date.now = realNow;
    }

    // An expired session is purged, so restoring the clock does not revive it.
    assert.equal(await verifyAdminSession(token!), null);
  });
});
