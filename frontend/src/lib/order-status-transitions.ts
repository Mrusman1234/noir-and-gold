import { OrderStatus } from "@/types";

export const VALID_ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "FAILED_DELIVERY", "RETURNED"],
  DELIVERED: ["RETURNED"],
  CANCELLED: [],
  FAILED_DELIVERY: ["CONFIRMED", "CANCELLED"],
  RETURNED: [],
};

export function isValidOrderTransition(currentStatus: OrderStatus, nextStatus: OrderStatus): boolean {
  return currentStatus === nextStatus || VALID_ORDER_TRANSITIONS[currentStatus].includes(nextStatus);
}