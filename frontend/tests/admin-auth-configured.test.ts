import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

// Configure credentials BEFORE importing the service so the account bootstraps.
process.env.DATABASE_URL = `file:${path.join(tmpdir(), "noir-auth-configured.sqlite").replace(/\\/g, "/")}`;
process.env.ADMIN_EMAIL = "Owner@NoirAndGold.test";
const ADMIN_PASSWORD = randomBytes(18).toString("base64url");
process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
process.env.ADMIN_NAME = "Atelier Owner";

let authenticateAdmin: typeof import("../src/lib/admin-service").authenticateAdmin;
const setupPromise = import("../src/lib/admin-service").then((service) => {
  authenticateAdmin = service.authenticateAdmin;
});

test("configured admin authenticates; wrong password and unknown email are rejected", async () => {
  await setupPromise;
  const ok = await authenticateAdmin("owner@noirandgold.test", ADMIN_PASSWORD);
  assert.ok(ok, "valid credentials should authenticate");
  assert.equal(ok!.user.role, "ADMIN");
  assert.equal(ok!.user.email, "owner@noirandgold.test");
  assert.equal(ok!.user.name, "Atelier Owner");
  assert.match(ok!.token, /^[0-9a-f]{64}$/);

  assert.equal(await authenticateAdmin("owner@noirandgold.test", "wrong-password"), null);
  assert.equal(await authenticateAdmin("someone-else@example.test", ADMIN_PASSWORD), null);
});

test("login rate limiting blocks repeated failures and clears on success", async () => {
  const { clearLoginFailures, loginAllowed, recordLoginFailure } = await import("../src/lib/login-rate-limit");
  const key = `throttle-${randomBytes(4).toString("hex")}`;

  assert.equal(loginAllowed(key), true);
  for (let attempt = 0; attempt < 9; attempt++) recordLoginFailure(key);
  assert.equal(loginAllowed(key), true, "9 failures should still allow attempts");
  recordLoginFailure(key);
  assert.equal(loginAllowed(key), false, "10 failures should block");

  clearLoginFailures(key);
  assert.equal(loginAllowed(key), true, "a successful login clears the counter");
});
