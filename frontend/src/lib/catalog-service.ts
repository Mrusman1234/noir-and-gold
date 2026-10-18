import { Prisma } from "@prisma/client";
import { ProductDetail, ProductSummary, ProductVariant as UIProductVariant } from "@/types";
import { prisma } from "@/lib/prisma";

/**
 * Persistent product catalog.
 *
 * The storefront and the admin portal both read from and write to the SQLite
 * database through this module. No in-memory or demo catalog is referenced here:
 * a missing database row is reported explicitly instead of being replaced with
 * fabricated data.
 */

export const PUBLISHED_STATUS = "PUBLISHED";
export const ARCHIVED_STATUS = "ARCHIVED";

const AUDIENCES = ["women", "men", "unisex"] as const;
type Audience = (typeof AUDIENCES)[number];

export type CatalogErrorCode =
  | "CATALOG_UNAVAILABLE"
  | "PRODUCT_NOT_FOUND"
  | "VALIDATION_FAILED"
  | "SLUG_CONFLICT";

export class CatalogError extends Error {
  readonly code: CatalogErrorCode;

  constructor(code: CatalogErrorCode, message: string) {
    super(message);
    this.name = "CatalogError";
    this.code = code;
  }
}

export interface CatalogQueryOptions {
  /** Category name or slug. */
  category?: string;
  audience?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

const catalogInclude = {
  category: true,
  images: true,
  variants: true,
} satisfies Prisma.ProductInclude;

type CatalogProductRow = Prisma.ProductGetPayload<{ include: typeof catalogInclude }>;

export interface CatalogVariantInput {
  id?: string;
  sku?: string;
  size?: string;
  colorName?: string;
  colorHex?: string;
  stock?: number;
  stockQuantity?: number;
  pricePkr?: number;
  isActive?: boolean;
}

export interface CatalogImageInput {
  id?: string;
  url?: string;
  alt?: string;
  altText?: string;
  displayOrder?: number;
  sortOrder?: number;
  isPrimary?: boolean;
}

/** Shape accepted by the admin create/update operations. Mirrors ProductDetail. */
export interface CatalogProductWriteInput {
  title?: string;
  slug?: string;
  categoryId?: string;
  categoryName?: string;
  audience?: string;
  description?: string;
  fabric?: string;
  fabricDetails?: string;
  careInstructions?: string[] | string;
  details?: string[];
  pricePkr?: number;
  basePricePkr?: number;
  salePricePkr?: number | null;
  status?: string;
  primaryImageUrl?: string;
  hoverImageUrl?: string | null;
  isNew?: boolean;
  isLimited?: boolean;
  isFeatured?: boolean;
  isSoldOut?: boolean;
  images?: CatalogImageInput[];
  variants?: CatalogVariantInput[];
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function toPositiveIntOrNull(value: unknown): number | null {
  if (!isFiniteNumber(value)) return null;
  const rounded = Math.round(value);
  return Number.isSafeInteger(rounded) && rounded >= 0 ? rounded : null;
}

function normalizeAudience(value: unknown): Audience | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return (AUDIENCES as readonly string[]).includes(normalized) ? (normalized as Audience) : null;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function splitCareInstructions(value: string | string[] | null | undefined): string[] {
  if (Array.isArray(value)) {
    return value.map((line) => line.trim()).filter(Boolean);
  }
  if (typeof value !== "string") return [];
  return value
    .split(/\r?\n|(?<=\.)\s+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function joinCareInstructions(value: string[] | string | undefined): string | null {
  if (Array.isArray(value)) {
    const joined = value.map((line) => line.trim()).filter(Boolean).join(" ");
    return joined || null;
  }
  if (typeof value === "string") return value.trim() || null;
  return null;
}

function activeVariants(product: CatalogProductRow): CatalogProductRow["variants"] {
  return product.variants.filter((variant) => variant.isActive);
}

function toSummary(product: CatalogProductRow): ProductSummary {
  const variants = activeVariants(product);
  const totalStock = variants.reduce((sum, variant) => sum + variant.stockQuantity, 0);

  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    categoryName: product.category.name,
    pricePkr: Math.round(product.pricePkr),
    salePricePkr: product.salePricePkr === null ? null : Math.round(product.salePricePkr),
    primaryImageUrl: product.primaryImageUrl,
    hoverImageUrl: product.hoverImageUrl,
    isNew: product.isNew,
    isLimited: product.isLimited,
    isSoldOut: product.status !== PUBLISHED_STATUS || totalStock === 0,
    availableSizes: [...new Set(variants.map((variant) => variant.size))],
    availableColors: [...new Set(variants.map((variant) => variant.colorName))],
    audience: normalizeAudience(product.audience) ?? undefined,
    createdAt: product.createdAt.toISOString(),
  };
}

function toVariant(variant: CatalogProductRow["variants"][number]): UIProductVariant {
  return {
    id: variant.id,
    size: variant.size,
    colorName: variant.colorName,
    colorHex: variant.colorHex,
    sku: variant.sku,
    stock: variant.stockQuantity,
  };
}

function toDetail(product: CatalogProductRow): ProductDetail {
  const orderedVariants = [...product.variants].sort(
    (a, b) => a.size.localeCompare(b.size) || a.colorName.localeCompare(b.colorName)
  );
  const primaryVariant = activeVariants(product)[0] ?? orderedVariants[0];

  return {
    ...toSummary(product),
    sku: primaryVariant?.sku ?? `NG-${product.slug.toUpperCase()}`,
    description: product.description,
    // `details` has no dedicated column yet; see the Step 16 report for the
    // proposed additive field. Care bullets are preserved below.
    details: [],
    fabric: product.fabricDetails ?? "",
    careInstructions: splitCareInstructions(product.careInstructions),
    images: [...product.images]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((image) => ({
        id: image.id,
        url: image.url,
        alt: image.altText,
        isPrimary: image.isPrimary,
      })),
    variants: orderedVariants.map(toVariant),
    rating: product.rating,
    reviewCount: product.reviewCount,
  };
}

function buildWhere(options: CatalogQueryOptions): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { status: PUBLISHED_STATUS, deletedAt: null };
  const and: Prisma.ProductWhereInput[] = [];

  const audience = normalizeAudience(options.audience);
  if (audience === "women" || audience === "men") {
    and.push({ OR: [{ audience }, { audience: "unisex" }] });
  } else if (audience === "unisex") {
    and.push({ audience: "unisex" });
  }

  const category = options.category?.trim();
  if (category) {
    and.push({ category: { OR: [{ slug: category }, { name: category }] } });
  }

  const search = options.search?.trim();
  if (search) {
    and.push({
      OR: [
        { title: { contains: search } },
        { slug: { contains: search } },
        { description: { contains: search } },
        { category: { name: { contains: search } } },
      ],
    });
  }

  if (and.length > 0) where.AND = and;
  return where;
}

function buildOrderBy(sort?: string): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "price-asc":
      return [{ pricePkr: "asc" }];
    case "price-desc":
      return [{ pricePkr: "desc" }];
    case "name-asc":
      return [{ title: "asc" }];
    case "newest":
      return [{ createdAt: "desc" }];
    case "featured":
    default:
      return [{ isFeatured: "desc" }, { createdAt: "desc" }];
  }
}

/** Storefront product listing, read from the persistent catalog. */
export async function listCatalogProducts(
  options: CatalogQueryOptions = {}
): Promise<ProductSummary[]> {
  const limit = toPositiveIntOrNull(options.limit);
  const page = toPositiveIntOrNull(options.page);
  const take = limit === null || limit === 0 ? undefined : Math.min(200, limit);
  const skip = take && page && page > 1 ? (page - 1) * take : undefined;

  const products = await prisma.product.findMany({
    where: buildWhere(options),
    include: catalogInclude,
    orderBy: buildOrderBy(options.sort),
    ...(take ? { take } : {}),
    ...(skip ? { skip } : {}),
  });

  return products.map(toSummary);
}

/** Persisted slugs of publishable products, used for static path generation. */
export async function listCatalogProductSlugs(): Promise<string[]> {
  const products = await prisma.product.findMany({
    where: { status: PUBLISHED_STATUS },
    select: { slug: true },
    orderBy: { slug: "asc" },
  });
  return products.map((product) => product.slug);
}

async function findProductRow(idOrSlug: string, publishedOnly: boolean): Promise<CatalogProductRow | null> {
  return prisma.product.findFirst({
    where: {
      ...(publishedOnly ? { status: PUBLISHED_STATUS } : {}),
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: catalogInclude,
  });
}

/** Storefront product detail for a published product. Null when it does not exist. */
export async function getCatalogProduct(idOrSlug: string): Promise<ProductDetail | null> {
  if (!idOrSlug.trim()) return null;
  const product = await findProductRow(idOrSlug.trim(), true);
  return product ? toDetail(product) : null;
}

/** Related published products, excluding the current one. */
export async function listRelatedCatalogProducts(
  currentProductId: string,
  audience?: string,
  limit = 4
): Promise<ProductSummary[]> {
  const normalizedAudience = normalizeAudience(audience);
  const products = await prisma.product.findMany({
    where: {
      status: PUBLISHED_STATUS,
      id: { not: currentProductId },
      ...(normalizedAudience
        ? { OR: [{ audience: normalizedAudience }, { audience: "unisex" }] }
        : {}),
    },
    include: catalogInclude,
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: Math.min(24, Math.max(1, limit)),
  });

  return products.map(toSummary);
}

/** Full admin catalog: every product regardless of status, including inactive variants. */
export async function listCatalogProductsAdmin(): Promise<ProductDetail[]> {
  const products = await prisma.product.findMany({
    include: catalogInclude,
    orderBy: [{ createdAt: "desc" }, { slug: "asc" }],
  });
  return products.map(toDetail);
}

/** Admin catalog lookup by id or slug. Null when it does not exist. */
export async function getCatalogProductAdmin(idOrSlug: string): Promise<ProductDetail | null> {
  const product = await findProductRow(idOrSlug.trim(), false);
  return product ? toDetail(product) : null;
}

async function resolveCategoryId(input: CatalogProductWriteInput): Promise<string> {
  const name = input.categoryName?.trim();
  if (!name) {
    throw new CatalogError("VALIDATION_FAILED", "A product category is required.");
  }

  const slug = slugify(name);
  const existing = await prisma.category.findFirst({
    where: { OR: [{ slug }, { name }] },
  });
  if (existing) return existing.id;

  const created = await prisma.category.create({
    data: {
      name,
      slug,
      audience: normalizeAudience(input.audience),
      isActive: true,
    },
  });
  return created.id;
}

const SKU_CHARSET_SIZE = 36;

async function ensureUniqueSku(candidate: string, excludeVariantId?: string): Promise<string> {
  let sku = candidate;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const clash = await prisma.productVariant.findUnique({ where: { sku }, select: { id: true } });
    if (!clash || clash.id === excludeVariantId) return sku;
    sku = `${candidate}-${Math.floor(Math.random() * SKU_CHARSET_SIZE ** 3)
      .toString(SKU_CHARSET_SIZE)
      .toUpperCase()
      .padStart(3, "0")}`;
  }
  throw new CatalogError("VALIDATION_FAILED", `Unable to allocate a unique SKU for "${candidate}".`);
}

function buildVariantSku(
  baseSku: string,
  size: string,
  colorName: string,
  index: number
): string {
  const sizeCode = size.replace(/[^a-z0-9]/gi, "").toUpperCase() || String(index + 1);
  const colorCode = colorName.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 3) || "CLR";
  return `${baseSku}-${sizeCode}-${colorCode}`;
}

/** Stable SKU base for a product so create and update generate identical codes. */
function defaultSkuBase(slug: string): string {
  return `NG-26-${slug.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 8)}`;
}

function productSkuBase(input: CatalogProductWriteInput, slug: string): string {
  const provided = (input as { sku?: unknown }).sku;
  if (typeof provided === "string" && provided.trim()) return provided.trim().toUpperCase();
  return defaultSkuBase(slug);
}

function variantIdentity(size: string, colorName: string): string {
  return `${size.trim().toLowerCase()}\u0000${colorName.trim().toLowerCase()}`;
}

function validateVariantInput(variant: CatalogVariantInput, index: number): {
  size: string;
  colorName: string;
  colorHex: string;
  stock: number;
} {
  const size = variant.size?.trim();
  const colorName = variant.colorName?.trim();
  if (!size || !colorName) {
    return { size: "", colorName: "", colorHex: "", stock: 0 };
  }
  const stock = toPositiveIntOrNull(variant.stock ?? variant.stockQuantity ?? 0);
  if (stock === null) {
    throw new CatalogError(
      "VALIDATION_FAILED",
      `Variant ${index + 1} (${size} / ${colorName}) must have a non-negative whole-number stock.`
    );
  }
  return {
    size,
    colorName,
    colorHex: variant.colorHex?.trim() || "#0B0A0F",
    stock,
  };
}

function normalizeImages(input: CatalogProductWriteInput, title: string): CatalogImageInput[] {
  const images = (input.images ?? [])
    .map((image) => ({
      url: image.url?.trim() || input.primaryImageUrl?.trim() || "",
      alt: image.alt?.trim() || title,
      isPrimary: Boolean(image.isPrimary),
    }))
    .filter((image) => image.url);

  if (images.length === 0) {
    const primary = input.primaryImageUrl?.trim();
    if (primary) images.push({ url: primary, alt: title, isPrimary: true });
  }
  if (images.length > 0 && !images.some((image) => image.isPrimary)) {
    images[0].isPrimary = true;
  }
  return images;
}

/** Creates a persistent product record with its variants and images. */
export async function createCatalogProduct(
  input: CatalogProductWriteInput
): Promise<ProductDetail> {
  const title = input.title?.trim();
  if (!title || title.length < 3) {
    throw new CatalogError("VALIDATION_FAILED", "Product title must be at least 3 characters.");
  }

  const pricePkr = isFiniteNumber(input.pricePkr) ? Math.round(input.pricePkr) : NaN;
  if (!Number.isSafeInteger(pricePkr) || pricePkr <= 0) {
    throw new CatalogError("VALIDATION_FAILED", "Price in PKR must be greater than zero.");
  }

  const slug = slugify(input.slug?.trim() || title);
  if (!slug) {
    throw new CatalogError("VALIDATION_FAILED", "Product slug could not be derived from the title.");
  }

  const clash = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
  if (clash) {
    throw new CatalogError("SLUG_CONFLICT", `Product with slug "${slug}" already exists.`);
  }

  const categoryId = await resolveCategoryId(input);
  const images = normalizeImages(input, title);
  if (images.length === 0) {
    throw new CatalogError("VALIDATION_FAILED", "At least one product image is required.");
  }

  const salePricePkr = input.salePricePkr === null || input.salePricePkr === undefined
    ? null
    : Math.round(input.salePricePkr);
  const skuBase = productSkuBase(input, slug);
  const variantInputs = input.variants ?? [];

  const variants = await Promise.all(
    variantInputs.map(async (variant, index) => {
      const normalized = validateVariantInput(variant, index);
      if (!normalized.size) {
        throw new CatalogError("VALIDATION_FAILED", `Variant ${index + 1} requires a size and colour.`);
      }
      const candidate = variant.sku?.trim()
        ? variant.sku.trim().toUpperCase()
        : buildVariantSku(skuBase, normalized.size, normalized.colorName, index);
      return {
        sku: await ensureUniqueSku(candidate),
        size: normalized.size,
        colorName: normalized.colorName,
        colorHex: normalized.colorHex,
        stockQuantity: normalized.stock,
        pricePkr: isFiniteNumber(variant.pricePkr) ? Math.round(variant.pricePkr) : pricePkr,
      };
    })
  );

  const stored = await prisma.product.create({
    data: {
      title,
      slug,
      categoryId,
      description: input.description?.trim() || "",
      fabricDetails: input.fabricDetails?.trim() || input.fabric?.trim() || null,
      careInstructions: joinCareInstructions(input.careInstructions),
      audience: normalizeAudience(input.audience),
      primaryImageUrl: images[0].url!,
      hoverImageUrl: input.hoverImageUrl?.trim() || images[0].url!,
      pricePkr,
      salePricePkr,
      isNew: Boolean(input.isNew),
      isLimited: Boolean(input.isLimited),
      isFeatured: Boolean(input.isFeatured),
      status: input.isSoldOut ? ARCHIVED_STATUS : PUBLISHED_STATUS,
      images: {
        create: images.map((image, index) => ({
          url: image.url!,
          altText: image.alt!,
          displayOrder: index,
          isPrimary: Boolean(image.isPrimary),
        })),
      },
      variants: { create: variants },
    },
    include: catalogInclude,
  });

  return toDetail(stored);
}

/** Applies a partial admin update to a persistent product record. */
export async function updateCatalogProduct(
  idOrSlug: string,
  updates: CatalogProductWriteInput
): Promise<ProductDetail> {
  const existing = await prisma.product.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    include: catalogInclude,
  });
  if (!existing) {
    throw new CatalogError("PRODUCT_NOT_FOUND", `Product ${idOrSlug} was not found.`);
  }

  const data: Prisma.ProductUpdateInput = {};

  if (updates.title !== undefined) {
    const title = updates.title.trim();
    if (title.length < 3) {
      throw new CatalogError("VALIDATION_FAILED", "Product title must be at least 3 characters.");
    }
    data.title = title;
  }

  if (updates.slug !== undefined) {
    const cleanSlug = slugify(updates.slug);
    if (!cleanSlug) {
      throw new CatalogError("VALIDATION_FAILED", "Invalid product slug.");
    }
    if (cleanSlug !== existing.slug) {
      const conflict = await prisma.product.findUnique({ where: { slug: cleanSlug } });
      if (conflict && conflict.id !== existing.id) {
        throw new CatalogError("SLUG_CONFLICT", `A product with slug "${cleanSlug}" already exists.`);
      }
      data.slug = cleanSlug;
    }
  }

  const effectivePrice = updates.pricePkr ?? updates.basePricePkr;
  if (effectivePrice !== undefined) {
    const pricePkr = isFiniteNumber(effectivePrice) ? Math.round(effectivePrice) : NaN;
    if (!Number.isSafeInteger(pricePkr) || pricePkr <= 0) {
      throw new CatalogError("VALIDATION_FAILED", "Price in PKR must be greater than zero.");
    }
    data.pricePkr = pricePkr;
  }

  if (updates.salePricePkr !== undefined) {
    data.salePricePkr = updates.salePricePkr === null ? null : Math.round(updates.salePricePkr);
  }
  if (updates.description !== undefined) data.description = updates.description.trim();
  if (updates.fabricDetails !== undefined || updates.fabric !== undefined) {
    data.fabricDetails = (updates.fabricDetails ?? updates.fabric ?? "").trim() || null;
  }
  if (updates.careInstructions !== undefined) {
    data.careInstructions = joinCareInstructions(updates.careInstructions);
  }
  if (updates.audience !== undefined) data.audience = normalizeAudience(updates.audience);
  if (updates.isNew !== undefined) data.isNew = Boolean(updates.isNew);
  if (updates.isLimited !== undefined) data.isLimited = Boolean(updates.isLimited);
  if (updates.isFeatured !== undefined) data.isFeatured = Boolean(updates.isFeatured);
  if (updates.status !== undefined) {
    const norm = updates.status.toUpperCase();
    if (norm === "ACTIVE" || norm === "PUBLISHED") {
      data.status = PUBLISHED_STATUS;
      data.deletedAt = null;
    } else if (norm === "ARCHIVED") {
      data.status = ARCHIVED_STATUS;
      data.deletedAt = new Date();
    } else {
      data.status = norm;
    }
  } else if (updates.isSoldOut !== undefined) {
    data.status = updates.isSoldOut ? ARCHIVED_STATUS : PUBLISHED_STATUS;
    data.deletedAt = updates.isSoldOut ? new Date() : null;
  }
  if (updates.hoverImageUrl !== undefined) {
    data.hoverImageUrl = updates.hoverImageUrl?.trim() || existing.primaryImageUrl;
  }
  if (updates.categoryId !== undefined) {
    data.category = { connect: { id: updates.categoryId } };
  } else if (updates.categoryName !== undefined) {
    data.category = { connect: { id: await resolveCategoryId(updates) } };
  }

  const images = updates.images !== undefined
    ? normalizeImages({ ...updates, primaryImageUrl: updates.primaryImageUrl ?? existing.primaryImageUrl }, updates.title?.trim() || existing.title)
    : null;
  if (images) {
    if (images.length === 0) {
      throw new CatalogError("VALIDATION_FAILED", "At least one product image is required.");
    }
    data.primaryImageUrl = images[0].url!;
    data.images = {
      deleteMany: {},
      create: images.map((image, index) => ({
        url: image.url!,
        altText: image.alt!,
        displayOrder: index,
        isPrimary: Boolean(image.isPrimary),
      })),
    };
  } else if (updates.primaryImageUrl !== undefined) {
    const primary = updates.primaryImageUrl.trim();
    if (!primary) {
      throw new CatalogError("VALIDATION_FAILED", "The primary image URL cannot be empty.");
    }
    data.primaryImageUrl = primary;
  }

  const updated = await prisma.product.update({
    where: { id: existing.id },
    data,
    include: catalogInclude,
  });

  if (updates.variants !== undefined) {
    await reconcileVariants(updated, updates.variants, Math.round(updated.pricePkr));
  }

  const final = await prisma.product.findUniqueOrThrow({
    where: { id: existing.id },
    include: catalogInclude,
  });
  return toDetail(final);
}

/**
 * Reconciles the variant set of a product: matching rows are updated, new rows are
 * created, and variants missing from the payload are deactivated (never deleted)
 * so historical order items keep their live-catalog references.
 */
async function reconcileVariants(
  product: { id: string; slug: string },
  variants: CatalogVariantInput[],
  defaultPricePkr: number
): Promise<void> {
  const productId = product.id;
  const current = await prisma.productVariant.findMany({ where: { productId } });
  const handled = new Set<string>();
  const byIdentity = new Map(current.map((row) => [variantIdentity(row.size, row.colorName), row]));
  const baseSku = defaultSkuBase(product.slug);

  for (const [index, variant] of variants.entries()) {
    const normalized = validateVariantInput(variant, index);
    if (!normalized.size) {
      throw new CatalogError("VALIDATION_FAILED", `Variant ${index + 1} requires a size and colour.`);
    }
    const byId = variant.id ? current.find((row) => row.id === variant.id) : undefined;
    const bySku = variant.sku ? current.find((row) => row.sku === variant.sku?.trim().toUpperCase()) : undefined;
    // The admin UI may send variants without an id, so the size + colour pair is
    // the stable identity used to match an existing row instead of duplicating it.
    const existingRow = byId ?? bySku ?? byIdentity.get(variantIdentity(normalized.size, normalized.colorName));
    const match = existingRow && !handled.has(existingRow.id) ? existingRow : undefined;

    if (match) {
      handled.add(match.id);
      await prisma.productVariant.update({
        where: { id: match.id },
        data: {
          size: normalized.size,
          colorName: normalized.colorName,
          colorHex: normalized.colorHex,
          stockQuantity: normalized.stock,
          isActive: variant.isActive !== undefined ? Boolean(variant.isActive) : true,
          pricePkr: isFiniteNumber(variant.pricePkr) ? Math.round(variant.pricePkr) : match.pricePkr,
        },
      });
      continue;
    }

    const candidate = variant.sku?.trim()
      ? variant.sku.trim().toUpperCase()
      : buildVariantSku(baseSku, normalized.size, normalized.colorName, index);
    await prisma.productVariant.create({
      data: {
        productId,
        sku: await ensureUniqueSku(candidate),
        size: normalized.size,
        colorName: normalized.colorName,
        colorHex: normalized.colorHex,
        stockQuantity: normalized.stock,
        pricePkr: isFiniteNumber(variant.pricePkr) ? Math.round(variant.pricePkr) : defaultPricePkr,
        isActive: variant.isActive !== undefined ? Boolean(variant.isActive) : true,
      },
    });
  }

  const stale = current.filter((row) => !handled.has(row.id) && row.isActive);
  if (stale.length > 0) {
    await prisma.productVariant.updateMany({
      where: { id: { in: stale.map((row) => row.id) } },
      data: { isActive: false },
    });
  }
}

/** Marks a product archived (sold out / deactivated) or republished. */
export async function setCatalogProductArchived(
  idOrSlug: string,
  isSoldOut: boolean
): Promise<boolean> {
  const result = await prisma.product.updateMany({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    data: {
      status: isSoldOut ? ARCHIVED_STATUS : PUBLISHED_STATUS,
      deletedAt: isSoldOut ? new Date() : null,
    },
  });
  return result.count > 0;
}

/** Count of products currently hidden from the storefront. */
export async function countArchivedCatalogProducts(): Promise<number> {
  return prisma.product.count({ where: { status: ARCHIVED_STATUS } });
}

/**
 * Deletes a product.
 * If the product has historical orders or audit records, it is safely soft-deleted
 * (status: ARCHIVED, variants: inactive) so order history is never corrupted.
 * If there are no order dependencies, it is hard-deleted from the database.
 */
export async function deleteCatalogProduct(
  idOrSlug: string
): Promise<{ deleted: boolean; archived: boolean }> {
  const existing = await prisma.product.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    include: {
      orderItems: { select: { id: true }, take: 1 },
      variants: {
        include: {
          orderItems: { select: { id: true }, take: 1 },
          inventoryReservations: { select: { id: true }, take: 1 },
        },
      },
    },
  });

  if (!existing) {
    throw new CatalogError("PRODUCT_NOT_FOUND", `Product "${idOrSlug}" does not exist.`);
  }

  const hasOrderItems =
    existing.orderItems.length > 0 ||
    existing.variants.some(
      (v) => v.orderItems.length > 0 || v.inventoryReservations.length > 0
    );

  if (hasOrderItems) {
    await prisma.$transaction([
      prisma.product.update({
        where: { id: existing.id },
        data: { status: ARCHIVED_STATUS, deletedAt: new Date() },
      }),
      prisma.productVariant.updateMany({
        where: { productId: existing.id },
        data: { isActive: false },
      }),
    ]);
    return { deleted: true, archived: true };
  }

  // Safe to remove completely (cascading variants and images)
  await prisma.product.delete({
    where: { id: existing.id },
  });

  return { deleted: true, archived: false };
}

