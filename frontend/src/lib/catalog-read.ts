import { cacheLife, cacheTag } from "next/cache";
import { ProductDetail, ProductSummary } from "@/types";
import {
  ProductsQueryOptions,
  getAllProductSlugs,
  getProductBySlug,
  getProductsCatalog,
  getRelatedProducts,
} from "./product-service";

/**
 * Cached storefront catalog reads.
 *
 * The catalog lives in the persistent database. These wrappers cache the
 * storefront reads with the Next.js Cache Components API so storefront pages can
 * be prerendered, and tag every entry with `CATALOG_CACHE_TAG` so an
 * administrative product write can invalidate the storefront immediately.
 *
 * Administrative reads stay uncached (see `getAllProductsAdmin`) so an editor
 * always sees the committed row.
 */

export const CATALOG_CACHE_TAG = "catalog";

export async function readCatalogProducts(
  options?: ProductsQueryOptions
): Promise<ProductSummary[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CATALOG_CACHE_TAG);
  return getProductsCatalog(options);
}

export async function readCatalogProduct(slug: string): Promise<ProductDetail | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CATALOG_CACHE_TAG);
  return getProductBySlug(slug);
}

export async function readCatalogSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CATALOG_CACHE_TAG);
  return getAllProductSlugs();
}

export async function readRelatedCatalogProducts(
  currentProductId: string,
  audience?: string,
  limit: number = 4
): Promise<ProductSummary[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CATALOG_CACHE_TAG);
  return getRelatedProducts(currentProductId, audience, limit);
}
