import { InventoryReservation, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  validateIdempotencyKey,
  validateQuantity,
  validateReservationTransition,
} from "@/lib/payment-domain";

/**
 * Option B inventory model (see docs/payment-inventory-architecture-decision.md).
 *
 * The ORDER owns the single stock decrement (checkout) and the single stock
 * restore (cancellation). A reservation is a lifecycle/expiry tracker only: it
 * records that an order is holding stock for a pending online payment, but it
 * NEVER moves `ProductVariant.stockQuantity`. This removes the previous
 * double-decrement and double-restock hazards by construction.
 */
const RESERVATION_ORDER_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING"] as const;

export interface CreateInventoryReservationInput {
  orderId: unknown;
  productVariantId: unknown;
  quantity: unknown;
  activeReservationKey: unknown;
  expiresAt: unknown;
}

export interface TransitionInventoryReservationInput {
  reservationId: unknown;
  nextStatus: unknown;
}

export type InventoryReservationResult =
  | { success: true; reservation: InventoryReservation; reused: boolean }
  | { success: false; code: string; error: string };

export type InventoryReservationTransitionResult =
  | { success: true; reservation: InventoryReservation }
  | { success: false; code: string; error: string };

class InventoryReservationServiceError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
  }
}

function validateIdentifier(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized && normalized.length <= 200 && !/[\u0000-\u001F\u007F]/.test(normalized)
    ? normalized
    : null;
}

function normalizeExpiry(value: unknown): Date | null {
  const date = value instanceof Date
    ? new Date(value.getTime())
    : typeof value === "string"
      ? new Date(value)
      : null;
  if (!date || Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) return null;
  return date;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (error as { code?: string })?.code === "P2002";
}

function isConcurrencyError(error: unknown): boolean {
  const code = (error as { code?: string })?.code;
  return code === "P1008" || code === "P2028" || code === "P2034";
}

function failure(error: unknown): { success: false; code: string; error: string } {
  if (error instanceof InventoryReservationServiceError) {
    return { success: false, code: error.code, error: error.message };
  }
  throw error;
}

function validateCreateInput(input: CreateInventoryReservationInput) {
  const orderId = validateIdentifier(input.orderId);
  const productVariantId = validateIdentifier(input.productVariantId);
  if (!orderId || !productVariantId) {
    throw new InventoryReservationServiceError("VALIDATION_FAILED", "Order ID and variant ID are required.");
  }

  const quantityCheck = validateQuantity(input.quantity);
  if (!quantityCheck.valid) {
    throw new InventoryReservationServiceError(quantityCheck.code, quantityCheck.message);
  }

  const keyCheck = validateIdempotencyKey(input.activeReservationKey);
  if (!keyCheck.valid) {
    throw new InventoryReservationServiceError(keyCheck.code, keyCheck.message);
  }

  const expiresAt = normalizeExpiry(input.expiresAt);
  if (!expiresAt) {
    throw new InventoryReservationServiceError("INVALID_EXPIRY", "Reservation expiry must be a future date.");
  }

  return {
    orderId,
    productVariantId,
    quantity: input.quantity as number,
    activeReservationKey: keyCheck.normalized,
    expiresAt,
  };
}

export async function createInventoryReservation(
  rawInput: CreateInventoryReservationInput
): Promise<InventoryReservationResult> {
  let input: ReturnType<typeof validateCreateInput>;
  try {
    input = validateCreateInput(rawInput);
  } catch (error) {
    return failure(error);
  }

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const order = await transaction.order.findUnique({ where: { id: input.orderId } });
      if (!order) throw new InventoryReservationServiceError("NOT_FOUND", "Order not found.");
      if (order.paymentMethod === "CASH_ON_DELIVERY") {
        throw new InventoryReservationServiceError("COD_NOT_ELIGIBLE", "COD orders do not create payment reservations.");
      }
      if (!RESERVATION_ORDER_STATUSES.includes(order.orderStatus as typeof RESERVATION_ORDER_STATUSES[number]) || order.paymentStatus !== "PENDING") {
        throw new InventoryReservationServiceError("ORDER_NOT_ELIGIBLE", "Order is not eligible for an active reservation.");
      }

      const variant = await transaction.productVariant.findUnique({
        where: { id: input.productVariantId },
      });
      if (!variant) throw new InventoryReservationServiceError("NOT_FOUND", "Product variant not found.");
      if (!variant.isActive) throw new InventoryReservationServiceError("VARIANT_INACTIVE", "Product variant is inactive.");

      // NOTE (Option B): stock is already held by the order at checkout, so a
      // reservation neither checks nor decrements `stockQuantity` here.

      const existingByKey = await transaction.inventoryReservation.findUnique({
        where: { activeReservationKey: input.activeReservationKey },
      });
      if (existingByKey) {
        if (
          existingByKey.orderId !== input.orderId ||
          existingByKey.productVariantId !== input.productVariantId ||
          existingByKey.quantity !== input.quantity
        ) {
          throw new InventoryReservationServiceError("RESERVATION_KEY_REUSED", "Reservation key was used for different reservation data.");
        }
        return { reservation: existingByKey, reused: true };
      }

      const existingActive = await transaction.inventoryReservation.findFirst({
        where: {
          orderId: input.orderId,
          productVariantId: input.productVariantId,
          status: "ACTIVE",
        },
      });
      if (existingActive) {
        if (existingActive.quantity !== input.quantity) {
          throw new InventoryReservationServiceError("ACTIVE_RESERVATION_CONFLICT", "A different active reservation already exists.");
        }
        return { reservation: existingActive, reused: true };
      }

      const reservation = await transaction.inventoryReservation.create({
        data: {
          orderId: input.orderId,
          productVariantId: input.productVariantId,
          quantity: input.quantity,
          status: "ACTIVE",
          activeReservationKey: input.activeReservationKey,
          expiresAt: input.expiresAt,
        },
      });
      return { reservation, reused: false };
    });
    return { success: true, reservation: result.reservation, reused: result.reused };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const existing = await prisma.inventoryReservation.findUnique({
        where: { activeReservationKey: input.activeReservationKey },
      });
      if (
        existing &&
        existing.orderId === input.orderId &&
        existing.productVariantId === input.productVariantId &&
        existing.quantity === input.quantity
      ) {
        return { success: true, reservation: existing, reused: true };
      }
      return { success: false, code: "CONCURRENT_RESERVATION_CONFLICT", error: "Reservation creation conflicted; retry the same request." };
    }
    if (isConcurrencyError(error)) {
      return { success: false, code: "CONCURRENT_RESERVATION_CONFLICT", error: "Reservation creation conflicted; retry the same request." };
    }
    return failure(error);
  }
}

export async function transitionInventoryReservation(
  input: TransitionInventoryReservationInput
): Promise<InventoryReservationTransitionResult> {
  const reservationId = validateIdentifier(input.reservationId);
  const nextStatus = input.nextStatus;
  if (!reservationId || typeof nextStatus !== "string") {
    return { success: false, code: "VALIDATION_FAILED", error: "Reservation ID and next status are required." };
  }

  try {
    const reservation = await prisma.$transaction(async (transaction) => {
      const current = await transaction.inventoryReservation.findUnique({
        where: { id: reservationId },
      });
      if (!current) throw new InventoryReservationServiceError("NOT_FOUND", "Reservation not found.");

      const transition = validateReservationTransition(current.status, nextStatus);
      if (!transition.valid) throw new InventoryReservationServiceError(transition.code, transition.message);
      if (current.status === nextStatus) return current;

      const now = new Date();
      const updateData: Prisma.InventoryReservationUpdateInput = {
        status: nextStatus,
        activeReservationKey: null,
        ...(nextStatus === "CONSUMED" ? { consumedAt: now } : { releasedAt: now }),
      };
      // NOTE (Option B): terminal transitions never mutate stock. The order owns
      // the single restore, so releasing/expiring a reservation cannot double-count.
      const changed = await transaction.inventoryReservation.updateMany({
        where: { id: current.id, status: "ACTIVE" },
        data: updateData,
      });
      if (changed.count !== 1) {
        throw new InventoryReservationServiceError("CONCURRENT_RESERVATION_CONFLICT", "Reservation changed concurrently.");
      }

      return transaction.inventoryReservation.findUniqueOrThrow({ where: { id: current.id } });
    });
    return { success: true, reservation };
  } catch (error) {
    return failure(error) as InventoryReservationTransitionResult;
  }
}
