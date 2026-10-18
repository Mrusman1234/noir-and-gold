import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

// Production mode with an unusable database path: the catalog must fail loudly
// and must never serve the bundled development demo catalog.
// Next.js augments ProcessEnv with a readonly NODE_ENV; this process is dedicated to
// production-mode assertions, so the value is set through a mutable view.
(process.env as Record<string, string | undefined>).NODE_ENV = "production";
process.env.DATABASE_URL = `file:${path
  .join(tmpdir(), "noir-absent-catalog-directory", "absent.sqlite")
  .replace(/\\/g, "/")}`;

function assertCatalogUnavailable(error: unknown): boolean {
  assert.ok(error instanceof Error, "a catalog failure must be an Error");
  assert.equal((error as { code?: string }).code, "CATALOG_UNAVAILABLE");
  const message = (error as Error).message;
  assert.ok(
    !/Midnight Velvet Anarkali Set|Royal Monolith Sherwani/.test(message),
    "demo catalog content must not leak into production errors"
  );
  return true;
}

test("production catalog failures surface explicitly instead of returning demo data", async () => {
  const productService = await import("../src/lib/product-service");

  await assert.rejects(() => productService.getProductsCatalog(), assertCatalogUnavailable);
  await assert.rejects(
    () => productService.getProductBySlug("midnight-velvet-anarkali-set"),
    assertCatalogUnavailable
  );
  await assert.rejects(() => productService.getAllProductSlugs(), assertCatalogUnavailable);
  await assert.rejects(() => productService.getAllProductsAdmin(), assertCatalogUnavailable);
});
