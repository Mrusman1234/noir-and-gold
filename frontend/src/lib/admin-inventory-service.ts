import { AdminUser, InventoryAuditLogEntry, InventoryVariantItem } from "@/types";
import { prisma } from "@/lib/prisma";

const MAX_INVENTORY_REASON_LENGTH = 500;

type InventoryOperationCode = "VALIDATION_FAILED" | "NOT_FOUND" | "CONCURRENT_UPDATE";

export type InventoryOperationResult =
  | { success: true; log: InventoryAuditLogEntry }
  | { success: false; code: InventoryOperationCode; error: string };

function inventoryStatus(stock: number): InventoryVariantItem["status"] {
  if (stock === 0) return "OUT_OF_STOCK";
  if (stock <= 3) return "LOW_STOCK";
  return "IN_STOCK";
}

function mapInventoryAuditLog(log: {
  id: string;
  productId: string;
  productTitle: string;
  variantId: string;
  sku: string;
  size: string;
  colorName: string;
  previousStock: number;
  newStock: number;
  adjustmentDelta: number;
  reason: string;
  adjustedBy: string;
  timestamp: Date;
}): InventoryAuditLogEntry {
  return {
    id: log.id,
    productId: log.productId,
    productTitle: log.productTitle,
    variantId: log.variantId,
    sku: log.sku,
    size: log.size,
    colorName: log.colorName,
    previousStock: log.previousStock,
    newStock: log.newStock,
    adjustmentDelta: log.adjustmentDelta,
    reason: log.reason,
    adjustedBy: log.adjustedBy,
    timestamp: log.timestamp.toISOString(),
  };
}

export async function getInventoryVariants(): Promise<InventoryVariantItem[]> {
  const variants = await prisma.productVariant.findMany({
    include: { product: { include: { category: true } } },
    orderBy: { sku: "asc" },
  });

  return variants.map((variant) => ({
    variantId: variant.id,
    productId: variant.productId,
    productTitle: variant.product.title,
    productSlug: variant.product.slug,
    sku: variant.sku,
    size: variant.size,
    colorName: variant.colorName,
    colorHex: variant.colorHex,
    stock: variant.stockQuantity,
    categoryName: variant.product.category.name,
    pricePkr: variant.product.pricePkr,
    status: inventoryStatus(variant.stockQuantity),
  }));
}

export async function getInventoryAuditLogs(): Promise<InventoryAuditLogEntry[]> {
  const logs = await prisma.inventoryAuditLog.findMany({
    orderBy: [{ timestamp: "desc" }, { id: "desc" }],
  });
  return logs.map(mapInventoryAuditLog);
}

function normalizeStock(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value >= 0 ? value : null;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
  }
  return null;
}

function normalizeReason(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const reason = value.trim();
  if (
    reason.length < 3 ||
    reason.length > MAX_INVENTORY_REASON_LENGTH ||
    /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(reason)
  ) {
    return null;
  }
  return reason;
}

/**
 * Sets an exact stock quantity and records the compare-and-set transition.
 * The existing admin UI sends an exact `newStock` value, so this preserves that
 * contract while preventing stale concurrent writes and negative quantities.
 */
export async function adjustVariantStock(
  productId: unknown,
  variantId: unknown,
  newStock: unknown,
  reason: unknown,
  actor: AdminUser
): Promise<InventoryOperationResult> {
  if (
    typeof productId !== "string" ||
    !productId.trim() ||
    typeof variantId !== "string" ||
    !variantId.trim()
  ) {
    return { success: false, code: "VALIDATION_FAILED", error: "Product ID and variant ID are required." };
  }

  const normalizedStock = normalizeStock(newStock);
  if (normalizedStock === null) {
    return { success: false, code: "VALIDATION_FAILED", error: "Stock quantity must be a non-negative whole number." };
  }

  const normalizedReason = normalizeReason(reason);
  if (!normalizedReason) {
    return { success: false, code: "VALIDATION_FAILED", error: "A valid adjustment reason of 3 to 500 characters is required." };
  }

  try {
    const log = await prisma.$transaction(async (transaction) => {
      const current = await transaction.productVariant.findFirst({
        where: { id: variantId.trim(), productId: productId.trim() },
        include: { product: true },
      });
      if (!current) {
        throw new Error("INVENTORY_VARIANT_NOT_FOUND");
      }
      if (current.stockQuantity < 0) {
        throw new Error("INVENTORY_NEGATIVE_STATE");
      }

      const changed = await transaction.productVariant.updateMany({
        where: {
          id: current.id,
          productId: current.productId,
          stockQuantity: current.stockQuantity,
        },
        data: { stockQuantity: normalizedStock },
      });
      if (changed.count !== 1) {
        throw new Error("INVENTORY_CONCURRENT_UPDATE");
      }

      return transaction.inventoryAuditLog.create({
        data: {
          productId: current.productId,
          productTitle: current.product.title,
          variantId: current.id,
          sku: current.sku,
          size: current.size,
          colorName: current.colorName,
          previousStock: current.stockQuantity,
          newStock: normalizedStock,
          adjustmentDelta: normalizedStock - current.stockQuantity,
          reason: normalizedReason,
          adjustedBy: `${actor.name} (${actor.role})`,
        },
      });
    });

    return { success: true, log: mapInventoryAuditLog(log) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "INVENTORY_VARIANT_NOT_FOUND") {
      return { success: false, code: "NOT_FOUND", error: "Inventory variant not found for the supplied product." };
    }
    if (message === "INVENTORY_CONCURRENT_UPDATE") {
      return { success: false, code: "CONCURRENT_UPDATE", error: "Stock changed concurrently. Reload inventory and retry." };
    }
    if (message === "INVENTORY_NEGATIVE_STATE") {
      return { success: false, code: "CONCURRENT_UPDATE", error: "Inventory contains an invalid negative stock state." };
    }
    throw error;
  }
}
