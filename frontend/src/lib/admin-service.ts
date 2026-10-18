import crypto from "crypto";
import {
  AdminUser,
  AdminSession,
  AdminDashboardMetrics,
  CategoryRecord,
  ProductDetail,
} from "@/types";
import { CatalogError, slugify } from "@/lib/catalog-service";
import {
  createProductRecord,
  deleteProductRecord,
  toggleProductSoldOutAdmin,
  updateProductRecord,
} from "@/lib/product-service";
import { prisma } from "@/lib/prisma";
export {
  getInventoryVariants,
  getInventoryAuditLogs,
  adjustVariantStock,
} from "@/lib/admin-inventory-service";


/**
 * Cookie configuration constants
 */
export const ADMIN_COOKIE_NAME = "noir_admin_session";
export const ADMIN_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24; // 24 hours

/**
 * Bootstrap Administrator and Fulfillment Staff Accounts
 */
interface StoredAdminAccount {
  user: AdminUser;
  salt: string;
  passwordHash: string;
}

const globalForAdmin = globalThis as typeof globalThis & {
  noirAdminAccounts?: Map<string, StoredAdminAccount>;
  noirActiveSessions?: Map<string, AdminSession>;
};

const ADMIN_ACCOUNTS = globalForAdmin.noirAdminAccounts ?? new Map<string, StoredAdminAccount>();
const ACTIVE_SESSIONS = globalForAdmin.noirActiveSessions ?? new Map<string, AdminSession>();

if (process.env.NODE_ENV !== "production") {
  globalForAdmin.noirAdminAccounts = ADMIN_ACCOUNTS;
  globalForAdmin.noirActiveSessions = ACTIVE_SESSIONS;
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 32).toString("hex");
}

/**
 * Bootstrap the administrator account from environment configuration.
 * Credentials are never hardcoded: when ADMIN_EMAIL and ADMIN_PASSWORD are
 * unset, no account exists and the portal rejects every login (fail closed).
 */
function initializeAdminAccounts() {
  if (ADMIN_ACCOUNTS.size > 0) return;

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;

  const salt = crypto.randomBytes(16).toString("hex");
  ADMIN_ACCOUNTS.set(email, {
    user: {
      id: "usr_admin_001",
      email,
      name: process.env.ADMIN_NAME?.trim() || "Administrator",
      role: "ADMIN",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    salt,
    passwordHash: hashPassword(password, salt),
  });
}

initializeAdminAccounts();

/**
 * Authenticate admin or staff member by email & password
 */
export async function authenticateAdmin(
  email: string,
  rawPassword: string
): Promise<{ user: AdminUser; token: string } | null> {
  initializeAdminAccounts();

  const account = ADMIN_ACCOUNTS.get(email.toLowerCase().trim());
  if (!account) return null;

  const testHash = hashPassword(rawPassword, account.salt);
  const isValid = crypto.timingSafeEqual(
    Buffer.from(testHash, "hex"),
    Buffer.from(account.passwordHash, "hex")
  );

  if (!isValid) return null;

  return { user: account.user, token: createAdminSessionForUser(account.user) };
}

/**
 * Creates an active admin session for an authenticated user and returns the token
 */
export function createAdminSessionForUser(user: AdminUser): string {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(
    Date.now() + ADMIN_COOKIE_MAX_AGE_SECONDS * 1000
  ).toISOString();

  const session: AdminSession = {
    token,
    user,
    expiresAt,
  };

  ACTIVE_SESSIONS.set(token, session);
  return token;
}

/**
 * Look up admin user account by email
 */
export function getAdminUserByEmail(email: string): AdminUser | null {
  initializeAdminAccounts();
  const account = ADMIN_ACCOUNTS.get(email.toLowerCase().trim());
  return account ? account.user : null;
}

/**
 * Verify admin session from cookie token or Bearer token
 */
export async function verifyAdminSession(token?: string | null): Promise<AdminUser | null> {
  if (!token) return null;

  const session = ACTIVE_SESSIONS.get(token);
  if (!session) return null;

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    ACTIVE_SESSIONS.delete(token);
    return null;
  }

  return session.user;
}

/**
 * Invalidate admin session on logout
 */
export async function invalidateAdminSession(token?: string | null): Promise<boolean> {
  if (!token) return false;
  return ACTIVE_SESSIONS.delete(token);
}

/**
 * Aggregate authoritative executive dashboard metrics
 */
export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  const [
    totalOrders,
    pendingOrders,
    confirmedOrders,
    processingOrders,
    shippedOrders,
    deliveredOrders,
    cancelledOrders,
    collectedRevenue,
    pipelineRevenue,
    totalProductsCount,
    variants,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { orderStatus: "PENDING" } }),
    prisma.order.count({ where: { orderStatus: "CONFIRMED" } }),
    prisma.order.count({ where: { orderStatus: "PROCESSING" } }),
    prisma.order.count({ where: { orderStatus: "SHIPPED" } }),
    prisma.order.count({ where: { orderStatus: "DELIVERED" } }),
    prisma.order.count({ where: { orderStatus: { in: ["CANCELLED", "FAILED_DELIVERY", "RETURNED"] } } }),
    prisma.order.aggregate({
      where: { orderStatus: "DELIVERED", paymentStatus: "PAID" },
      _sum: { totalPkr: true },
    }),
    prisma.order.aggregate({
      where: { orderStatus: { notIn: ["CANCELLED", "FAILED_DELIVERY"] } },
      _sum: { totalPkr: true },
    }),
    prisma.product.count(),
    prisma.productVariant.findMany({ select: { stockQuantity: true } }),
  ]);

  const lowStockVariantCount = variants.filter(
    (variant) => variant.stockQuantity > 0 && variant.stockQuantity <= 3
  ).length;
  const outOfStockVariantCount = variants.filter(
    (variant) => variant.stockQuantity === 0
  ).length;

  return {
    totalOrders,
    pendingOrders,
    confirmedOrders,
    processingOrders,
    shippedOrders,
    deliveredOrders,
    cancelledOrders,
    totalCollectedRevenuePkr: collectedRevenue._sum.totalPkr ?? 0,
    pendingRevenuePkr: pipelineRevenue._sum.totalPkr ?? 0,
    lowStockVariantCount,
    outOfStockVariantCount,
    totalProductsCount,
  };
}

/**
 * Category Management — persisted in the SQLite catalog.
 */
function mapCategoryRecord(category: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  audience: string | null;
  isActive: boolean;
  createdAt: Date;
  _count?: { products: number };
}): CategoryRecord {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    audience:
      category.audience === "women" || category.audience === "men" || category.audience === "unisex"
        ? category.audience
        : "unisex",
    isActive: category.isActive,
    productCount: category._count?.products ?? 0,
    createdAt: category.createdAt.toISOString(),
  };
}

export async function getCategoriesAdmin(): Promise<CategoryRecord[]> {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
  return categories.map(mapCategoryRecord);
}

export async function createCategoryAdmin(data: {
  name: string;
  slug: string;
  description: string;
  audience: "women" | "men" | "unisex";
}): Promise<{ success: boolean; category?: CategoryRecord; error?: string }> {
  const name = data.name?.trim();
  if (!name || name.length < 2) {
    return { success: false, error: "Category name must be at least 2 characters." };
  }

  const cleanSlug = slugify(data.slug || name);
  if (!cleanSlug) {
    return { success: false, error: "Category slug could not be derived from the name." };
  }

  const existing = await prisma.category.findUnique({ where: { slug: cleanSlug } });
  if (existing) {
    return { success: false, error: `A category with slug "${cleanSlug}" already exists.` };
  }

  const created = await prisma.category.create({
    data: {
      name,
      slug: cleanSlug,
      description: (data.description || "").trim() || null,
      audience: data.audience,
      isActive: true,
    },
    include: { _count: { select: { products: true } } },
  });

  return { success: true, category: mapCategoryRecord(created) };
}

export async function toggleCategoryStatusAdmin(id: string, isActive: boolean): Promise<boolean> {
  const result = await prisma.category.updateMany({ where: { id }, data: { isActive } });
  return result.count > 0;
}

/**
 * Product Management Operations — persisted in the SQLite catalog.
 *
 * These deliberately have no in-memory fallback: a failed write must surface so
 * an administrator never believes an unreserved change was saved.
 */
function catalogErrorMessage(error: unknown): string {
  if (error instanceof CatalogError) return error.message;
  console.error("Admin catalog write failed:", error);
  return "The catalog database rejected the change. Please try again.";
}

export async function createProductAdmin(
  productData: Omit<ProductDetail, "id">
): Promise<{ success: boolean; product?: ProductDetail; error?: string }> {
  try {
    const product = await createProductRecord(productData);
    return { success: true, product };
  } catch (error) {
    return { success: false, error: catalogErrorMessage(error) };
  }
}

export async function updateProductAdmin(
  id: string,
  updates: Partial<ProductDetail>
): Promise<{ success: boolean; product?: ProductDetail; error?: string }> {
  try {
    const product = await updateProductRecord(id, updates);
    return { success: true, product };
  } catch (error) {
    return { success: false, error: catalogErrorMessage(error) };
  }
}

export async function toggleProductArchiveAdmin(
  id: string,
  isSoldOut: boolean
): Promise<boolean> {
  return toggleProductSoldOutAdmin(id, isSoldOut);
}

export async function deleteProductAdmin(
  id: string
): Promise<{ success: boolean; archived?: boolean; error?: string }> {
  try {
    const res = await deleteProductRecord(id);
    return { success: true, archived: res.archived };
  } catch (error) {
    return { success: false, error: catalogErrorMessage(error) };
  }
}

