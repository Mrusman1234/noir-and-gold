import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { copyFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import type { CreateOrderRequestDTO, ProductDetail } from "../src/types";

const repositoryRoot = path.resolve(__dirname, "..", "..");
const temporaryDirectory = mkdtempSync(path.join(tmpdir(), "noir-catalog-test-"));
const testDatabasePath = path.join(temporaryDirectory, "catalog.sqlite");
process.env.DATABASE_URL = `file:${testDatabasePath.replace(/\\/g, "/")}`;
process.env.ORDER_VERIFICATION_SECRET = randomBytes(32).toString("hex");

// Clone the applied development schema into an isolated disposable database so
// these tests never touch the developer's working catalog.
copyFileSync(path.join(repositoryRoot, "backend", "prisma", "dev.db"), testDatabasePath);

let prisma: import("@prisma/client").PrismaClient;
let productService: typeof import("../src/lib/product-service");
let catalogService: typeof import("../src/lib/catalog-service");
let createOrder: typeof import("../src/lib/order-service").createOrder;
let getVerifiedOrder: typeof import("../src/lib/order-service").getVerifiedOrder;

const setupPromise = Promise.all([
  import("../src/lib/prisma"),
  import("../src/lib/product-service"),
  import("../src/lib/catalog-service"),
  import("../src/lib/order-service"),
]).then(([prismaModule, products, catalog, orders]) => {
  prisma = prismaModule.prisma;
  productService = products;
  catalogService = catalog;
  createOrder = orders.createOrder;
  getVerifiedOrder = orders.getVerifiedOrder;
});

after(async () => {
  await setupPromise.catch(() => undefined);
  if (prisma) await prisma.$disconnect();
  rmSync(temporaryDirectory, { recursive: true, force: true });
});

/** A separate client proves writes survive a process/service restart. */
async function readWithFreshClient<T>(read: (client: import("@prisma/client").PrismaClient) => Promise<T>) {
  const client = new (await import("@prisma/client")).PrismaClient();
  try {
    return await read(client);
  } finally {
    await client.$disconnect();
  }
}

function newProductInput(overrides: Record<string, unknown> = {}) {
  return {
    title: "Step 16 Persistence Kurta",
    slug: "step-16-persistence-kurta",
    categoryName: "Men's Luxury Casual",
    audience: "men",
    description: "A persistent database-backed garment used by the Step 16 regression suite.",
    fabric: "Handloom Raw Silk",
    careInstructions: ["Dry clean only.", "Steam iron on reverse."],
    pricePkr: 19900,
    salePricePkr: null,
    primaryImageUrl: "/images/product-kurta.svg",
    images: [
      { url: "/images/product-kurta.svg", alt: "Persistence Kurta Front", isPrimary: true },
      { url: "/images/craftsmanship-detail.svg", alt: "Persistence Kurta Detail" },
    ],
    variants: [
      { size: "M", colorName: "Ivory", colorHex: "#F4F0E8", stock: 7 },
      { size: "L", colorName: "Ivory", colorHex: "#F4F0E8", stock: 4 },
    ],
    isNew: true,
    isLimited: false,
    ...overrides,
  };
}

test("persistent catalog: storefront, admin writes, price integrity and stock consistency", async (t) => {
  await setupPromise;

  await t.test("storefront reads the persisted catalog rather than demo data", async () => {
    const catalog = await productService.getProductsCatalog();
    assert.ok(catalog.length >= 8, "seeded catalog should be visible");

    const detail = await productService.getProductBySlug("midnight-velvet-anarkali-set");
    assert.ok(detail, "seeded product should resolve from the database");
    assert.equal(detail!.pricePkr, 24500);
    assert.ok(detail!.variants.length > 0, "variants should come from the database");

    const persisted = await readWithFreshClient((client) =>
      client.product.findUnique({ where: { slug: "midnight-velvet-anarkali-set" }, include: { variants: true } })
    );
    assert.ok(persisted, "database row should exist");
    assert.equal(detail!.variants.length, persisted!.variants.length);
    assert.equal(detail!.primaryImageUrl, persisted!.primaryImageUrl);
  });

  await t.test("admin creation and edits persist across a fresh database client", async () => {
    const created = await productService.createProductRecord(newProductInput());
    assert.equal(created.slug, "step-16-persistence-kurta");
    assert.equal(created.variants.length, 2);
    assert.equal(created.images.length, 2);
    assert.ok(created.sku.length > 0, "a SKU should be allocated");

    const visibleInStorefront = (await productService.getProductsCatalog()).some(
      (product) => product.slug === created.slug
    );
    assert.ok(visibleInStorefront, "a newly created product must be visible to the storefront");

    const persistedRow = await readWithFreshClient((client) =>
      client.product.findUnique({
        where: { slug: created.slug },
        include: { variants: true, images: true },
      })
    );
    assert.ok(persistedRow, "the created product must be committed to the database");
    assert.equal(persistedRow!.variants.length, 2);
    assert.equal(persistedRow!.images.length, 2);

    const updated = await productService.updateProductRecord(created.slug, {
      title: "Step 16 Persistence Kurta (Edited)",
      pricePkr: 21500,
      variants: [{ size: "M", colorName: "Ivory", colorHex: "#F4F0E8", stock: 12 }],
    });
    assert.equal(updated.title, "Step 16 Persistence Kurta (Edited)");
    assert.equal(updated.pricePkr, 21500);

    const afterRestart = await readWithFreshClient((client) =>
      client.product.findUnique({
        where: { slug: created.slug },
        include: { variants: true },
      })
    );
    assert.equal(afterRestart!.title, "Step 16 Persistence Kurta (Edited)");
    assert.equal(afterRestart!.pricePkr, 21500);
    assert.equal(
      afterRestart!.variants.find((variant) => variant.size === "M")!.stockQuantity,
      12
    );
    // Variants omitted from the payload are deactivated, never deleted, so
    // historical order items keep their live-catalog reference.
    const retired = afterRestart!.variants.find((variant) => variant.size === "L")!;
    assert.equal(retired.isActive, false);

    const storefrontDetail = await productService.getProductBySlug(created.slug);
    assert.equal(storefrontDetail!.availableSizes.includes("L"), false);
    assert.equal(storefrontDetail!.availableSizes.includes("M"), true);
  });

  await t.test("archived products leave the storefront but remain in the admin catalog", async () => {
    const archiveTarget = await productService.createProductRecord(
      newProductInput({
        title: "Step 16 Archive Candidate",
        slug: "step-16-archive-candidate",
        variants: [{ size: "Standard", colorName: "Obsidian Black", colorHex: "#0B0A0F", stock: 3 }],
      })
    );

    const archived = await productService.toggleProductSoldOutAdmin(archiveTarget.slug, true);
    assert.equal(archived, true);

    assert.equal(await productService.getProductBySlug(archiveTarget.slug), null);
    const storefront = await productService.getProductsCatalog();
    assert.equal(storefront.some((product) => product.slug === archiveTarget.slug), false);

    const adminCatalog = await productService.getAllProductsAdmin();
    const adminRow = adminCatalog.find((product) => product.slug === archiveTarget.slug);
    assert.ok(adminRow, "archived products must remain editable in the admin catalog");
    assert.equal(adminRow!.isSoldOut, true);

    const republished = await productService.toggleProductSoldOutAdmin(archiveTarget.slug, false);
    assert.equal(republished, true);
    assert.ok(await productService.getProductBySlug(archiveTarget.slug));
  });

  await t.test("checkout uses database prices and decrements stock exactly once", async () => {
    const product = await productService.getProductBySlug("royal-monolith-sherwani");
    assert.ok(product, "seed product should exist");
    const variant = product!.variants.find((candidate) => candidate.stock >= 2);
    assert.ok(variant, "seed product should have variant stock");

    const beforeRow = await readWithFreshClient((client) =>
      client.productVariant.findUniqueOrThrow({ where: { id: variant!.id } })
    );

    const idempotencyKey = `step16-${randomBytes(6).toString("hex")}`;
    // A hostile client tries to dictate the price. The server must ignore it.
    const hostileRequest = {
      customer: {
        fullName: "Step Sixteen Buyer",
        phone: "03001234567",
        province: "Sindh",
        city: "Karachi",
        area: "Clifton Block 4",
        streetAddress: "House 12, Street 5, Block 4",
      },
      items: [
        {
          productId: product!.id,
          size: variant!.size,
          color: variant!.colorName,
          quantity: 2,
          unitPricePkr: 1,
          pricePkr: 1,
          totalPkr: 1,
          lineTotalPkr: 1,
        },
      ],
      idempotencyKey,
    } as unknown as CreateOrderRequestDTO;

    const order = await createOrder(hostileRequest);
    assert.equal(order.success, true, JSON.stringify(order));
    assert.equal(order.totalPkr, beforeRow.pricePkr * 2, "the database price must win");

    const verified = await getVerifiedOrder(order.orderReference!, order.verificationToken!);
    assert.ok(verified, "the order should be retrievable with its verification token");
    assert.equal(verified!.items[0].unitPricePkr, beforeRow.pricePkr);

    const afterRow = await readWithFreshClient((client) =>
      client.productVariant.findUniqueOrThrow({ where: { id: variant!.id } })
    );
    assert.equal(afterRow.stockQuantity, beforeRow.stockQuantity - 2, "stock must drop by the ordered quantity");

    // A retry of the same idempotency key must not sell stock twice.
    const replay = await createOrder(hostileRequest);
    assert.equal(replay.success, true);
    assert.equal(replay.orderReference, order.orderReference);
    const afterReplay = await readWithFreshClient((client) =>
      client.productVariant.findUniqueOrThrow({ where: { id: variant!.id } })
    );
    assert.equal(afterReplay.stockQuantity, afterRow.stockQuantity, "a replay must not decrement stock again");

    const storefrontAfterCheckout = await productService.getProductBySlug("royal-monolith-sherwani");
    const storefrontVariant = storefrontAfterCheckout!.variants.find(
      (candidate) => candidate.id === variant!.id
    );
    assert.equal(
      storefrontVariant!.stock,
      afterReplay.stockQuantity,
      "the storefront must report the same stock the checkout wrote"
    );
  });

  await t.test("invalid and conflicting admin writes are rejected without touching the catalog", async () => {
    const countBefore = await prisma.product.count();

    await assert.rejects(
      () => productService.createProductRecord(newProductInput({ title: "AB", slug: "too-short-title" }) as never),
      (error: Error) => /at least 3 characters/.test(error.message)
    );
    await assert.rejects(
      () => productService.createProductRecord(newProductInput({ pricePkr: 0, slug: "zero-price" }) as never),
      (error: Error) => /greater than zero/.test(error.message)
    );
    await assert.rejects(
      () => productService.createProductRecord(newProductInput({ slug: "midnight-velvet-anarkali-set" }) as never),
      (error: Error) => /already exists/.test(error.message)
    );
    await assert.rejects(
      () => productService.updateProductRecord("does-not-exist", { title: "Ghost Product" }),
      (error: Error) => /was not found/.test(error.message)
    );
    await assert.rejects(
      () => productService.createProductRecord(newProductInput({ slug: "no-category", categoryName: "" }) as never),
      (error: Error) => /category is required/.test(error.message)
    );

    assert.equal(await prisma.product.count(), countBefore, "no partial products may be written");
    assert.equal(await productService.getProductBySlug("does-not-exist"), null);
  });

  await t.test("unknown products resolve to null instead of falling back to fabricated data", async () => {
    assert.equal(await productService.getProductBySlug("no-such-garment-slug"), null);
    const slugs = await productService.getAllProductSlugs();
    assert.equal(slugs.includes("no-such-garment-slug"), false);
    assert.equal(slugs.includes("midnight-velvet-anarkali-set"), true);
  });

  await t.test("catalog reads expose only persisted products for a category audience", async () => {
    const women = await productService.getProductsCatalog({ audience: "women" });
    assert.ok(women.length > 0);
    for (const product of women as ProductDetail[]) {
      assert.ok(
        product.audience === "women" || product.audience === "unisex",
        `${product.slug} should belong to the women/unisex audience`
      );
    }
    const related = await productService.getRelatedProducts("prod-001", "women", 3);
    assert.ok(related.length <= 3);
    assert.equal(related.some((product) => product.id === "prod-001"), false);
  });

  await t.test("catalog service rejects a missing category and duplicate slug explicitly", async () => {
    await assert.rejects(
      () => catalogService.createCatalogProduct({ title: "No Category Garment", pricePkr: 5000 }),
      (error: Error & { code?: string }) => error.code === "VALIDATION_FAILED"
    );
    await assert.rejects(
      () =>
        catalogService.createCatalogProduct({
          title: "Duplicate Slug Garment",
          slug: "midnight-velvet-anarkali-set",
          categoryName: "Women's Luxury Prêt",
          pricePkr: 5000,
        }),
      (error: Error & { code?: string }) => error.code === "SLUG_CONFLICT"
    );
  });
});
