import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

// This file runs in its own process: production mode must mark the admin session
// cookie Secure in addition to HttpOnly and SameSite.
// Next.js augments ProcessEnv with a readonly NODE_ENV; this process is dedicated to
// production-mode assertions, so the value is set through a mutable view.
(process.env as Record<string, string | undefined>).NODE_ENV = "production";
process.env.DATABASE_URL = `file:${path.join(tmpdir(), "noir-cookie-production.sqlite").replace(/\\/g, "/")}`;
process.env.ADMIN_EMAIL = "owner@noirandgold.test";
const ADMIN_PASSWORD = randomBytes(18).toString("base64url");
process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;

test("production login issues a Secure, HttpOnly, SameSite session cookie", async () => {
  const { NextRequest } = await import("next/server");
  const { POST } = await import("../src/app/api/v1/admin/auth/login/route");

  const response = await POST(
    new NextRequest("http://localhost/api/v1/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "198.51.100.50" },
      body: JSON.stringify({ email: "owner@noirandgold.test", password: ADMIN_PASSWORD }),
    })
  );

  assert.equal(response.status, 200);
  const setCookie = response.headers.get("set-cookie") ?? "";
  assert.match(setCookie, /^noir_admin_session=/);
  assert.match(setCookie, /Secure/i, "production session cookies must be Secure");
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=lax/i);
  assert.match(setCookie, /Path=\//i);
});
