import { ProductDetail, ProductSummary } from "@/types";
import { DEMO_PRODUCT_DETAILS } from "./demo-catalog";
import { DEMO_PRODUCTS } from "./demo-data";
import {
  CatalogError,
  CatalogProductWriteInput,
  CatalogQueryOptions,
  countArchivedCatalogProducts,
  createCatalogProduct,
  deleteCatalogProduct,
  getCatalogProduct,
  getCatalogProductAdmin,
  listCatalogProductSlugs,
  listCatalogProducts,
  listCatalogProductsAdmin,
  listRelatedCatalogProducts,
  setCatalogProductArchived,
  updateCatalogProduct,
} from "./catalog-service";

/**
 * Storefront + admin catalog facade.
 *
 * Reads and writes go to the persistent SQLite catalog through
 * `catalog-service.ts`. The bundled demo catalog (`demo-catalog.ts`) is only
 * consulted outside production so a developer without a configured database can
 * still browse the storefront; production surfaces an explicit error instead of
 * silently serving fabricated products.
 */

export type ProductsQueryOptions = CatalogQueryOptions;

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function describeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (typeof (error as { code?: string })?.code === "string") {
    return `${(error as { code?: string }).code}: ${message}`;
  }
  return message;
}

function unavailable(scope: string, error: unknown): CatalogError {
  if (error instanceof CatalogError) return error;
  return new CatalogError(
    "CATALOG_UNAVAILABLE",
    `The product catalog is unavailable (${scope}). ${describeError(error)}`
  );
}

/**
 * Runs a persistent catalog read. Outside production a database failure logs a
 * warning and serves isolated demo data; in production it throws immediately so
 * the failure is visible rather than masked.
 */
async function readCatalog<T>(scope: string, load: () => Promise<T>, demo?: () => T): Promise<T> {
  try {
    return await load();
  } catch (error) {
    if (!isProduction() && demo) {
      console.warn(
        `[catalog] ${scope}: database catalog unavailable (${describeError(error)}). ` +
          "Serving the development-only demo catalog. Production never falls back to demo data."
      );
      return demo();
    }
    throw unavailable(scope, error);
  }
}

function demoCatalogList(): ProductSummary[] {
  return DEMO_PRODUCTS;
}

function demoCatalogDetail(slug: string): ProductDetail | null {
  return DEMO_PRODUCT_DETAILS[slug] ?? null;
}

function demoCatalogAdmin(): ProductDetail[] {
  return Object.values(DEMO_PRODUCT_DETAILS);
}

/** Product detail for a published product, or null when it does not exist. */
export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const trimmed = slug?.trim();
  if (!trimmed) return null;

  const product = await readCatalog(
    `product "${trimmed}"`,
    () => getCatalogProduct(trimmed),
    () => demoCatalogDetail(trimmed)
  );

  return product ?? null;
}

/** Published product list for the storefront. */
export async function getProductsCatalog(options?: ProductsQueryOptions): Promise<ProductSummary[]> {
  return readCatalog("product listing", () => listCatalogProducts(options ?? {}), demoCatalogList);
}

/** Published slugs, used for static path generation. */
export async function getAllProductSlugs(): Promise<string[]> {
  return readCatalog(
    "product slugs",
    () => listCatalogProductSlugs(),
    () => Object.keys(DEMO_PRODUCT_DETAILS)
  );
}

/** Related products for a product detail page. */
export async function getRelatedProducts(
  currentProductId: string,
  audience?: string,
  limit: number = 4
): Promise<ProductSummary[]> {
  return readCatalog(
    "related products",
    () => listRelatedCatalogProducts(currentProductId, audience, limit),
    () =>
      DEMO_PRODUCTS.filter((product) => {
        if (product.id === currentProductId) return false;
        if (audience && product.audience && product.audience !== audience && product.audience !== "unisex") {
          return false;
        }
        return true;
      }).slice(0, limit)
  );
}

/** Every product, including archived ones, for the admin catalog view. */
export async function getAllProductsAdmin(): Promise<ProductDetail[]> {
  return readCatalog("admin product listing", () => listCatalogProductsAdmin(), demoCatalogAdmin);
}

/** Single product for admin editing, including non-published records. */
export async function getProductAdminByIdOrSlug(idOrSlug: string): Promise<ProductDetail | null> {
  const trimmed = idOrSlug?.trim();
  if (!trimmed) return null;
  return readCatalog(
    `admin product "${trimmed}"`,
    () => getCatalogProductAdmin(trimmed),
    () =>
      Object.values(DEMO_PRODUCT_DETAILS).find(
        (product) => product.id === trimmed || product.slug === trimmed
      ) ?? null
  );
}

/**
 * Admin writes never fall back to demo data: a failed write must surface, because
 * silently writing to memory is exactly the defect this module used to have.
 */
export async function createProductRecord(
  input: CatalogProductWriteInput
): Promise<ProductDetail> {
  return createCatalogProduct(input);
}

export async function updateProductRecord(
  idOrSlug: string,
  updates: CatalogProductWriteInput
): Promise<ProductDetail> {
  return updateCatalogProduct(idOrSlug, updates);
}

export async function toggleProductSoldOutAdmin(
  idOrSlug: string,
  isSoldOut: boolean
): Promise<boolean> {
  return setCatalogProductArchived(idOrSlug, isSoldOut);
}

export async function deleteProductRecord(
  idOrSlug: string
): Promise<{ deleted: boolean; archived: boolean }> {
  return deleteCatalogProduct(idOrSlug);
}

export async function countArchivedProducts(): Promise<number> {
  return countArchivedCatalogProducts();
}

export { CatalogError };
