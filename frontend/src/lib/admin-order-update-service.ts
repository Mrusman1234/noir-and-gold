import { AdminUser, CourierInfo, OrderStatus, PaymentStatus } from "@/types";
import { prisma } from "@/lib/prisma";
import { mapAdminOrder } from "@/lib/admin-order-read-service";
import { isValidOrderTransition } from "@/lib/order-status-transitions";

const ORDER_STATUSES: readonly OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "FAILED_DELIVERY",
  "RETURNED",
];

const PAYMENT_STATUSES: readonly PaymentStatus[] = ["PENDING", "PAID", "FAILED", "REFUNDED"];

export interface AdminOrderUpdateInput {
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  cancellationReason?: string;
  courierInfo?: CourierInfo;
  note?: string;
}

export type AdminOrderUpdateResult =
  | { success: true; order: ReturnType<typeof mapAdminOrder>; message: string }
  | { success: false; code: "NOT_FOUND" | "VALIDATION_FAILED" | "INVALID_TRANSITION" | "CONCURRENT_UPDATE" | "INVENTORY_CONFLICT"; error: string };

class AdminOrderUpdateError extends Error {
  constructor(
    readonly code: Exclude<AdminOrderUpdateResult, { success: true }>["code"],
    message: string
  ) {
    super(message);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseAdminOrderUpdateInput(value: unknown): AdminOrderUpdateInput {
  if (!isRecord(value)) {
    throw new AdminOrderUpdateError("VALIDATION_FAILED", "Request body must be an object.");
  }
  const allowedFields = new Set([
    "orderStatus",
    "paymentStatus",
    "cancellationReason",
    "courierInfo",
    "note",
    // Older admin UI clients may still send this field. It is deliberately ignored.
    "overrideValidation",
  ]);
  const unknownField = Object.keys(value).find((key) => !allowedFields.has(key));
  if (unknownField) {
    throw new AdminOrderUpdateError("VALIDATION_FAILED", `Unsupported order update field: ${unknownField}.`);
  }
  const input: AdminOrderUpdateInput = {};
  const hasOrderStatus = Object.hasOwn(value, "orderStatus");
  const hasPaymentStatus = Object.hasOwn(value, "paymentStatus");
  if (!hasOrderStatus && !hasPaymentStatus) {
    throw new AdminOrderUpdateError("VALIDATION_FAILED", "Provide an order status or payment status to update.");
  }

  if (hasOrderStatus) {
    if (typeof value.orderStatus !== "string" || !ORDER_STATUSES.includes(value.orderStatus as OrderStatus)) {
      throw new AdminOrderUpdateError("VALIDATION_FAILED", "Order status is invalid.");
    }
    input.orderStatus = value.orderStatus as OrderStatus;
  }
  if (hasPaymentStatus) {
    if (typeof value.paymentStatus !== "string" || !PAYMENT_STATUSES.includes(value.paymentStatus as PaymentStatus)) {
      throw new AdminOrderUpdateError("VALIDATION_FAILED", "Payment status is invalid.");
    }
    input.paymentStatus = value.paymentStatus as PaymentStatus;
  }
  if (Object.hasOwn(value, "cancellationReason")) {
    if (typeof value.cancellationReason !== "string" || value.cancellationReason.length > 500) {
      throw new AdminOrderUpdateError("VALIDATION_FAILED", "Cancellation reason must be text of at most 500 characters.");
    }
    input.cancellationReason = value.cancellationReason.trim();
  }
  if (Object.hasOwn(value, "note")) {
    if (typeof value.note !== "string" || value.note.length > 500) {
      throw new AdminOrderUpdateError("VALIDATION_FAILED", "Audit note must be text of at most 500 characters.");
    }
    input.note = value.note.trim();
  }
  if (Object.hasOwn(value, "courierInfo")) {
    if (!isRecord(value.courierInfo) ||
      typeof value.courierInfo.courierName !== "string" ||
      typeof value.courierInfo.trackingNumber !== "string") {
      throw new AdminOrderUpdateError("VALIDATION_FAILED", "Courier name and tracking number are required.");
    }
    const courierName = value.courierInfo.courierName.trim();
    const trackingNumber = value.courierInfo.trackingNumber.trim();
    if (!courierName || courierName.length > 80 || !trackingNumber || trackingNumber.length > 120) {
      throw new AdminOrderUpdateError("VALIDATION_FAILED", "Courier name or tracking number is invalid.");
    }
    input.courierInfo = { courierName, trackingNumber };
  }
  return input;
}

const orderReadInclude = {
  items: { orderBy: { createdAt: "asc" as const } },
  auditLogs: { orderBy: { timestamp: "asc" as const } },
};

function isConcurrencyError(error: unknown): boolean {
  const code = (error as { code?: string })?.code;
  return code === "P1008" || code === "P2028" || code === "P2034";
}

function isInventoryConflictError(error: unknown): boolean {
  return (error as { message?: string })?.message?.startsWith("INVENTORY_CONFLICT:") === true;
}

/**
 * The payment/inventory reservation models exist in schema.prisma but have no
 * applied migration yet, so the `InventoryReservation` table may be absent from
 * a given database. Cancellation must never fail because of an optional,
 * unwired ledger, so we detect the table once and only run the reservation
 * close step when it is actually present.
 */
let reservationTableAvailable: boolean | null = null;
async function isReservationTableAvailable(): Promise<boolean> {
  if (reservationTableAvailable !== null) return reservationTableAvailable;
  try {
    const rows = await prisma.$queryRaw<Array<{ name: string }>>`
      SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'InventoryReservation'
    `;
    reservationTableAvailable = Array.isArray(rows) && rows.length > 0;
  } catch {
    // Non-SQLite provider or probe failure: assume present so coordination runs.
    reservationTableAvailable = true;
  }
  return reservationTableAvailable;
}

export async function updatePersistentAdminOrder(
  orderReference: string,
  rawInput: unknown,
  actor: AdminUser
): Promise<AdminOrderUpdateResult> {
  let input: AdminOrderUpdateInput;
  try {
    input = parseAdminOrderUpdateInput(rawInput);
  } catch (error) {
    if (error instanceof AdminOrderUpdateError) {
      return { success: false, code: error.code, error: error.message };
    }
    throw error;
  }

  try {
    const closingReservations = input.orderStatus === "CANCELLED";
    const reservationCloseEnabled = closingReservations && (await isReservationTableAvailable());
    const order = await prisma.$transaction(async (transaction) => {
      const current = await transaction.order.findUnique({
        where: { orderReference },
        include: orderReadInclude,
      });
      if (!current) throw new AdminOrderUpdateError("NOT_FOUND", `Order ${orderReference} not found.`);

      const orderStatusChanged = input.orderStatus !== undefined && input.orderStatus !== current.orderStatus;
      const paymentStatusChanged = input.paymentStatus !== undefined && input.paymentStatus !== current.paymentStatus;

      if (orderStatusChanged && !isValidOrderTransition(current.orderStatus as OrderStatus, input.orderStatus!)) {
        throw new AdminOrderUpdateError(
          "INVALID_TRANSITION",
          `Cannot transition order status directly from ${current.orderStatus} to ${input.orderStatus}.`
        );
      }
      if (orderStatusChanged && input.orderStatus === "CANCELLED" && !input.cancellationReason?.trim()) {
        throw new AdminOrderUpdateError("VALIDATION_FAILED", "A cancellation reason is required to cancel an order.");
      }
      if (orderStatusChanged && input.orderStatus === "SHIPPED" && !input.courierInfo) {
        throw new AdminOrderUpdateError("VALIDATION_FAILED", "Courier name and tracking number are required to dispatch an order.");
      }

      const cancellationItems = orderStatusChanged && input.orderStatus === "CANCELLED"
        ? await Promise.all(current.items.map(async (item) => {
            if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0) {
              throw new Error(`INVENTORY_CONFLICT: Order item ${item.id} has an invalid quantity.`);
            }
            const variantId = item.catalogVariantId ?? item.variantId;
            const expectedProductId = item.catalogProductId ?? item.productId;
            const variant = await transaction.productVariant.findUnique({ where: { id: variantId } });
            if (!variant || variant.productId !== expectedProductId) {
              throw new Error(`INVENTORY_CONFLICT: Variant for order item ${item.id} is no longer available.`);
            }
            return { item, variant };
          }))
        : [];

      if (!orderStatusChanged && !paymentStatusChanged) return current;

      const updateData: {
        orderStatus?: string;
        paymentStatus?: string;
        cancellationReason?: string;
        courierName?: string;
        courierTrackingNumber?: string;
        dispatchedAt?: Date;
      } = {};
      if (orderStatusChanged) updateData.orderStatus = input.orderStatus;
      if (paymentStatusChanged) updateData.paymentStatus = input.paymentStatus;
      if (orderStatusChanged && input.orderStatus === "CANCELLED") {
        updateData.cancellationReason = input.cancellationReason;
      }
      if (orderStatusChanged && input.orderStatus === "SHIPPED") {
        updateData.courierName = input.courierInfo!.courierName;
        updateData.courierTrackingNumber = input.courierInfo!.trackingNumber;
        updateData.dispatchedAt = new Date();
      }

      const changed = await transaction.order.updateMany({
        where: {
          id: current.id,
          orderStatus: current.orderStatus,
          paymentStatus: current.paymentStatus,
        },
        data: updateData,
      });
      if (changed.count !== 1) {
        throw new AdminOrderUpdateError("CONCURRENT_UPDATE", "Order changed concurrently. Reload and retry the update.");
      }

      const auditActor = `${actor.name} (${actor.role})`;
      if (orderStatusChanged && input.orderStatus === "CANCELLED") {
        for (const { item, variant: preflightVariant } of cancellationItems) {
          const variant = await transaction.productVariant.findUnique({ where: { id: preflightVariant.id } });
          if (!variant || variant.productId !== preflightVariant.productId) {
            throw new Error(`INVENTORY_CONFLICT: Variant for order item ${item.id} disappeared during cancellation.`);
          }

          const restored = await transaction.productVariant.updateMany({
            where: {
              id: variant.id,
              productId: variant.productId,
              stockQuantity: variant.stockQuantity,
            },
            data: { stockQuantity: { increment: item.quantity } },
          });
          if (restored.count !== 1) {
            throw new Error(`INVENTORY_CONFLICT: Variant stock changed during cancellation for order item ${item.id}.`);
          }

          await transaction.inventoryAuditLog.create({
            data: {
              productId: item.productId,
              productTitle: item.productTitle,
              variantId: variant.id,
              sku: item.sku,
              size: item.size,
              colorName: item.color,
              previousStock: variant.stockQuantity,
              newStock: variant.stockQuantity + item.quantity,
              adjustmentDelta: item.quantity,
              reason: `Cancellation restock for ${orderReference}: ${input.cancellationReason!.trim()}`,
              adjustedBy: auditActor,
              orderId: current.id,
            },
          });
        }

        // Option B: close any ACTIVE reservations without a second stock move.
        // The order-owned restock above is the single restore.
        if (reservationCloseEnabled) {
          await transaction.inventoryReservation.updateMany({
            where: { orderId: current.id, status: "ACTIVE" },
            data: { status: "RELEASED", activeReservationKey: null, releasedAt: new Date() },
          });
        }
      }

      if (orderStatusChanged) {
        const statusNote = input.orderStatus === "CANCELLED"
          ? `Cancellation reason: ${input.cancellationReason!.trim()}`
          : input.note || `Status transitioned from ${current.orderStatus} to ${input.orderStatus}`;
        await transaction.orderAuditLog.create({
          data: {
            orderId: current.id,
            action: input.orderStatus === "CANCELLED" ? "ORDER_CANCELLED" : "STATUS_UPDATED",
            performedBy: auditActor,
            previousStatus: current.orderStatus,
            newStatus: input.orderStatus,
            note: statusNote,
          },
        });
      }
      if (paymentStatusChanged) {
        await transaction.orderAuditLog.create({
          data: {
            orderId: current.id,
            action: "PAYMENT_STATUS_UPDATED",
            performedBy: auditActor,
            note: `Payment status transitioned from ${current.paymentStatus} to ${input.paymentStatus}${input.note ? `; ${input.note}` : ""}`,
            previousStatus: current.paymentStatus,
            newStatus: input.paymentStatus,
          },
        });
      }

      return transaction.order.findUniqueOrThrow({
        where: { id: current.id },
        include: orderReadInclude,
      });
    });

    return {
      success: true,
      order: mapAdminOrder(order),
      message: `Order ${orderReference} updated successfully.`,
    };
  } catch (error) {
    if (error instanceof AdminOrderUpdateError) {
      return { success: false, code: error.code, error: error.message };
    }
    if (isConcurrencyError(error)) {
      return {
        success: false,
        code: "CONCURRENT_UPDATE",
        error: "Order changed concurrently. Reload and retry the update.",
      };
    }
    if (isInventoryConflictError(error)) {
      return {
        success: false,
        code: "INVENTORY_CONFLICT",
        error: (error as Error).message.replace(/^INVENTORY_CONFLICT:\s*/, ""),
      };
    }
    throw error;
  }
}
