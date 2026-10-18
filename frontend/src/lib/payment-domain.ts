export const PAYMENT_ATTEMPT_STATUSES = [
  "CREATED",
  "PENDING",
  "REQUIRES_ACTION",
  "AUTHORIZED",
  "CAPTURED",
  "FAILED",
  "CANCELLED",
  "EXPIRED",
  "VOIDED",
] as const;

export type PaymentAttemptStatus = (typeof PAYMENT_ATTEMPT_STATUSES)[number];

export const PAYMENT_ATTEMPT_TERMINAL_STATUSES: readonly PaymentAttemptStatus[] = [
  "CAPTURED",
  "FAILED",
  "CANCELLED",
  "EXPIRED",
  "VOIDED",
];

export const REFUND_STATUSES = [
  "REQUESTED",
  "PROCESSING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
] as const;

export type RefundStatus = (typeof REFUND_STATUSES)[number];

export const ORDER_PAYMENT_SUMMARY_STATUSES = [
  "PENDING",
  "AUTHORIZED",
  "PAID",
  "FAILED",
  "REFUND_PENDING",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
] as const;

export type OrderPaymentSummaryStatus = (typeof ORDER_PAYMENT_SUMMARY_STATUSES)[number];

export const RESERVATION_STATUSES = ["ACTIVE", "CONSUMED", "RELEASED", "EXPIRED"] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export type ValidationResult =
  | { valid: true }
  | { valid: false; code: string; message: string };

export type IdempotencyKeyValidationResult =
  | { valid: true; normalized: string }
  | { valid: false; code: string; message: string };

const PAYMENT_ATTEMPT_TRANSITIONS: Record<PaymentAttemptStatus, readonly PaymentAttemptStatus[]> = {
  CREATED: ["PENDING", "FAILED", "CANCELLED"],
  PENDING: ["REQUIRES_ACTION", "AUTHORIZED", "CAPTURED", "FAILED", "CANCELLED", "EXPIRED"],
  REQUIRES_ACTION: ["AUTHORIZED", "CAPTURED", "FAILED", "CANCELLED", "EXPIRED"],
  AUTHORIZED: ["CAPTURED", "VOIDED", "FAILED"],
  CAPTURED: [],
  FAILED: [],
  CANCELLED: [],
  EXPIRED: [],
  VOIDED: [],
};

const REFUND_TRANSITIONS: Record<RefundStatus, readonly RefundStatus[]> = {
  REQUESTED: ["PROCESSING", "FAILED", "CANCELLED"],
  PROCESSING: ["SUCCEEDED", "FAILED"],
  SUCCEEDED: [],
  FAILED: [],
  CANCELLED: [],
};

const ORDER_PAYMENT_SUMMARY_TRANSITIONS: Record<
  OrderPaymentSummaryStatus,
  readonly OrderPaymentSummaryStatus[]
> = {
  PENDING: ["AUTHORIZED", "PAID", "FAILED"],
  AUTHORIZED: ["PAID", "FAILED"],
  PAID: ["REFUND_PENDING", "PARTIALLY_REFUNDED", "REFUNDED"],
  FAILED: ["PENDING"],
  REFUND_PENDING: ["PAID", "PARTIALLY_REFUNDED", "REFUNDED"],
  PARTIALLY_REFUNDED: ["REFUND_PENDING", "REFUNDED"],
  REFUNDED: [],
};

const RESERVATION_TRANSITIONS: Record<ReservationStatus, readonly ReservationStatus[]> = {
  ACTIVE: ["CONSUMED", "RELEASED", "EXPIRED"],
  CONSUMED: [],
  RELEASED: [],
  EXPIRED: [],
};

function transitionResult<T extends string>(
  states: readonly T[],
  transitions: Record<T, readonly T[]>,
  current: string,
  next: string,
  label: string
): ValidationResult {
  if (!states.includes(current as T) || !states.includes(next as T)) {
    return { valid: false, code: "INVALID_STATUS", message: `${label} status is invalid.` };
  }
  if (current === next || transitions[current as T].includes(next as T)) {
    return { valid: true };
  }
  return {
    valid: false,
    code: "INVALID_TRANSITION",
    message: `${label} cannot transition from ${current} to ${next}.`,
  };
}

export function validatePaymentAttemptTransition(
  current: string,
  next: string
): ValidationResult {
  return transitionResult(
    PAYMENT_ATTEMPT_STATUSES,
    PAYMENT_ATTEMPT_TRANSITIONS,
    current,
    next,
    "Payment attempt"
  );
}

export function canRetryPaymentAttempt(status: string): boolean {
  return ["FAILED", "EXPIRED", "CANCELLED", "VOIDED"].includes(status);
}

export function validateRefundTransition(current: string, next: string): ValidationResult {
  return transitionResult(REFUND_STATUSES, REFUND_TRANSITIONS, current, next, "Refund");
}

export function validateOrderPaymentSummaryTransition(
  current: string,
  next: string
): ValidationResult {
  return transitionResult(
    ORDER_PAYMENT_SUMMARY_STATUSES,
    ORDER_PAYMENT_SUMMARY_TRANSITIONS,
    current,
    next,
    "Order payment summary"
  );
}

export function validateReservationTransition(current: string, next: string): ValidationResult {
  return transitionResult(
    RESERVATION_STATUSES,
    RESERVATION_TRANSITIONS,
    current,
    next,
    "Inventory reservation"
  );
}

export function validatePositiveInteger(value: unknown, fieldName: string): ValidationResult {
  if (!Number.isSafeInteger(value) || (value as number) <= 0) {
    return {
      valid: false,
      code: "INVALID_POSITIVE_INTEGER",
      message: `${fieldName} must be a positive safe integer.`,
    };
  }
  return { valid: true };
}

export function validatePkrAmount(value: unknown): ValidationResult {
  return validatePositiveInteger(value, "PKR amount");
}

export function validateQuantity(value: unknown): ValidationResult {
  return validatePositiveInteger(value, "Quantity");
}

export function validateCurrencyConsistency(expected: unknown, actual: unknown): ValidationResult {
  if (typeof expected !== "string" || typeof actual !== "string") {
    return { valid: false, code: "INVALID_CURRENCY", message: "Currency must be a three-letter code." };
  }
  const expectedCurrency = expected.trim().toUpperCase();
  const actualCurrency = actual.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(expectedCurrency) || !/^[A-Z]{3}$/.test(actualCurrency)) {
    return { valid: false, code: "INVALID_CURRENCY", message: "Currency must be a three-letter code." };
  }
  if (expectedCurrency !== actualCurrency) {
    return { valid: false, code: "CURRENCY_MISMATCH", message: "Payment currency does not match the order currency." };
  }
  return { valid: true };
}

export function validateRefundAmount(input: {
  requestedAmountPkr: unknown;
  capturedAmountPkr: unknown;
  refundedAmountPkr: unknown;
  reservedRefundAmountPkr: unknown;
  orderCurrency: unknown;
  refundCurrency: unknown;
}): ValidationResult {
  const amountChecks = [
    validatePkrAmount(input.requestedAmountPkr),
    validateNonNegativeInteger(input.capturedAmountPkr, "Captured amount"),
    validateNonNegativeInteger(input.refundedAmountPkr, "Refunded amount"),
    validateNonNegativeInteger(input.reservedRefundAmountPkr, "Reserved refund amount"),
  ];
  const invalidAmount = amountChecks.find((result) => !result.valid);
  if (invalidAmount) return invalidAmount;

  const currencyCheck = validateCurrencyConsistency(input.orderCurrency, input.refundCurrency);
  if (!currencyCheck.valid) return currencyCheck;

  const requested = input.requestedAmountPkr as number;
  const captured = input.capturedAmountPkr as number;
  const refunded = input.refundedAmountPkr as number;
  const reserved = input.reservedRefundAmountPkr as number;
  const alreadyAllocated = refunded + reserved;
  if (!Number.isSafeInteger(alreadyAllocated)) {
    return {
      valid: false,
      code: "INVALID_REFUND_LEDGER",
      message: "Refund ledger totals exceed the supported safe integer range.",
    };
  }
  if (alreadyAllocated > captured || requested > captured - alreadyAllocated) {
    return {
      valid: false,
      code: "REFUND_LIMIT_EXCEEDED",
      message: "Refund amount exceeds the available captured amount.",
    };
  }
  return { valid: true };
}

function validateNonNegativeInteger(value: unknown, fieldName: string): ValidationResult {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    return {
      valid: false,
      code: "INVALID_NON_NEGATIVE_INTEGER",
      message: `${fieldName} must be a non-negative safe integer.`,
    };
  }
  return { valid: true };
}

export function validateIdempotencyKey(value: unknown): IdempotencyKeyValidationResult {
  if (typeof value !== "string") {
    return { valid: false, code: "INVALID_IDEMPOTENCY_KEY", message: "Idempotency key must be text." };
  }
  const normalized = value.trim();
  if (
    !normalized ||
    normalized.length > 200 ||
    /[\u0000-\u001F\u007F]/.test(normalized)
  ) {
    return {
      valid: false,
      code: "INVALID_IDEMPOTENCY_KEY",
      message: "Idempotency key must contain 1 to 200 printable characters.",
    };
  }
  return { valid: true, normalized };
}
