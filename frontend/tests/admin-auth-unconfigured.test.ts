import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

// No ADM* credentials are configured in this process: the portal must fail closed.
process.env.DATABASE_URL = `file:${path.join(tmpdir(), "noir-auth-unconfigured.sqlite").replace(/\\/g, "/")}`;
delete process.env.ADMIN_EMAIL;
delete process.env.ADMIN_PASSWORD;
delete process.env.ADMIN_NAME;

test("admin authentication fails closed when no credentials are configured", async () => {
  const { authenticateAdmin } = await import("../src/lib/admin-service");
  assert.equal(await authenticateAdmin("admin@example.com", "any-password"), null);
  assert.equal(await authenticateAdmin("admin@example.com", ""), null);
});
