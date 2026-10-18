import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canRetryPaymentAttempt,
  validateCurrencyConsistency,
  validateIdempotencyKey,
  validateOrderPaymentSummaryTransition,
  validatePaymentAttemptTransition,
  validatePositiveInteger,
  validatePkrAmount,
  validateQuantity,
  validateRefundAmount,
  validateRefundTransition,
  validateReservationTransition,
} from "../src/lib/payment-domain";

function assertValid(result: { valid: boolean }): void {
  assert.equal(result.valid, true);
}

function assertInvalid(result: { valid: boolean; code?: string }, code: string): void {
  assert.equal(result.valid, false);
  assert.equal(result.code, code);
}

test("payment attempt transitions accept only idempotent or allowed moves", () => {
  const allowed: Array<[string, string]> = [
    ["CREATED", "PENDING"],
    ["CREATED", "FAILED"],
    ["CREATED", "CANCELLED"],
    ["PENDING", "REQUIRES_ACTION"],
    ["PENDING", "AUTHORIZED"],
    ["PENDING", "CAPTURED"],
    ["PENDING", "FAILED"],
    ["PENDING", "CANCELLED"],
    ["PENDING", "EXPIRED"],
    ["REQUIRES_ACTION", "AUTHORIZED"],
    ["REQUIRES_ACTION", "CAPTURED"],
    ["REQUIRES_ACTION", "FAILED"],
    ["REQUIRES_ACTION", "CANCELLED"],
    ["REQUIRES_ACTION", "EXPIRED"],
    ["AUTHORIZED", "CAPTURED"],
    ["AUTHORIZED", "VOIDED"],
    ["AUTHORIZED", "FAILED"],
  ];
  for (const [current, next] of allowed) assertValid(validatePaymentAttemptTransition(current, next));
  for (const status of ["CREATED", "PENDING", "CAPTURED", "FAILED", "EXPIRED", "CANCELLED", "VOIDED"]) {
    assertValid(validatePaymentAttemptTransition(status, status));
  }

  assertInvalid(validatePaymentAttemptTransition("CAPTURED", "PENDING"), "INVALID_TRANSITION");
  assertInvalid(validatePaymentAttemptTransition("FAILED", "CAPTURED"), "INVALID_TRANSITION");
  assertInvalid(validatePaymentAttemptTransition("EXPIRED", "AUTHORIZED"), "INVALID_TRANSITION");
  assertInvalid(validatePaymentAttemptTransition("CANCELLED", "PENDING"), "INVALID_TRANSITION");
  assertInvalid(validatePaymentAttemptTransition("VOIDED", "CAPTURED"), "INVALID_TRANSITION");
  assertInvalid(validatePaymentAttemptTransition("AUTHORIZED", "PENDING"), "INVALID_TRANSITION");
  assertInvalid(validatePaymentAttemptTransition("PENDING", "CREATED"), "INVALID_TRANSITION");
  assertInvalid(validatePaymentAttemptTransition("UNKNOWN", "PENDING"), "INVALID_STATUS");
  assertInvalid(validatePaymentAttemptTransition("PENDING", "UNKNOWN"), "INVALID_STATUS");
});

test("terminal payment attempts retry by creating a new attempt", () => {
  for (const status of ["FAILED", "EXPIRED", "CANCELLED", "VOIDED"]) {
    assert.equal(canRetryPaymentAttempt(status), true);
  }
  for (const status of ["CREATED", "PENDING", "REQUIRES_ACTION", "AUTHORIZED", "CAPTURED"]) {
    assert.equal(canRetryPaymentAttempt(status), false);
  }
});

test("refund transitions preserve terminal history", () => {
  assertValid(validateRefundTransition("REQUESTED", "PROCESSING"));
  assertValid(validateRefundTransition("REQUESTED", "FAILED"));
  assertValid(validateRefundTransition("REQUESTED", "CANCELLED"));
  assertValid(validateRefundTransition("PROCESSING", "SUCCEEDED"));
  assertValid(validateRefundTransition("PROCESSING", "FAILED"));
  assertValid(validateRefundTransition("REQUESTED", "REQUESTED"));
  assertValid(validateRefundTransition("PROCESSING", "PROCESSING"));
  assertValid(validateRefundTransition("FAILED", "FAILED"));
  assertValid(validateRefundTransition("CANCELLED", "CANCELLED"));
  assertValid(validateRefundTransition("SUCCEEDED", "SUCCEEDED"));
  assertInvalid(validateRefundTransition("SUCCEEDED", "PROCESSING"), "INVALID_TRANSITION");
  assertInvalid(validateRefundTransition("FAILED", "PROCESSING"), "INVALID_TRANSITION");
  assertInvalid(validateRefundTransition("CANCELLED", "SUCCEEDED"), "INVALID_TRANSITION");
  assertInvalid(validateRefundTransition("UNKNOWN", "REQUESTED"), "INVALID_STATUS");
});

test("order payment summary transitions preserve COD-compatible success", () => {
  assertValid(validateOrderPaymentSummaryTransition("PENDING", "PAID"));
  assertValid(validateOrderPaymentSummaryTransition("PENDING", "FAILED"));
  assertValid(validateOrderPaymentSummaryTransition("PAID", "REFUND_PENDING"));
  assertValid(validateOrderPaymentSummaryTransition("PAID", "PARTIALLY_REFUNDED"));
  assertValid(validateOrderPaymentSummaryTransition("PARTIALLY_REFUNDED", "REFUNDED"));
  assertValid(validateOrderPaymentSummaryTransition("REFUND_PENDING", "PAID"));
  assertValid(validateOrderPaymentSummaryTransition("FAILED", "PENDING"));
  assertValid(validateOrderPaymentSummaryTransition("REFUNDED", "REFUNDED"));
  assertInvalid(validateOrderPaymentSummaryTransition("REFUNDED", "PAID"), "INVALID_TRANSITION");
  assertInvalid(validateOrderPaymentSummaryTransition("PAID", "PENDING"), "INVALID_TRANSITION");
  assertInvalid(validateOrderPaymentSummaryTransition("PENDING", "REFUNDED"), "INVALID_TRANSITION");
  assertInvalid(validateOrderPaymentSummaryTransition("UNKNOWN", "PAID"), "INVALID_STATUS");
});

test("reservation transitions release or consume active stock exactly once", () => {
  assertValid(validateReservationTransition("ACTIVE", "CONSUMED"));
  assertValid(validateReservationTransition("ACTIVE", "RELEASED"));
  assertValid(validateReservationTransition("ACTIVE", "EXPIRED"));
  assertValid(validateReservationTransition("ACTIVE", "ACTIVE"));
  assertValid(validateReservationTransition("CONSUMED", "CONSUMED"));
  assertValid(validateReservationTransition("EXPIRED", "EXPIRED"));
  assertValid(validateReservationTransition("RELEASED", "RELEASED"));
  assertInvalid(validateReservationTransition("RELEASED", "ACTIVE"), "INVALID_TRANSITION");
  assertInvalid(validateReservationTransition("CONSUMED", "RELEASED"), "INVALID_TRANSITION");
  assertInvalid(validateReservationTransition("EXPIRED", "CONSUMED"), "INVALID_TRANSITION");
  assertInvalid(validateReservationTransition("UNKNOWN", "ACTIVE"), "INVALID_STATUS");
});

test("amount, quantity, currency, refund, and idempotency validation is strict", () => {
  assertValid(validatePositiveInteger(1, "quantity"));
  assertValid(validatePkrAmount(1));
  assertValid(validateQuantity(1));
  assertInvalid(validatePositiveInteger(0, "quantity"), "INVALID_POSITIVE_INTEGER");
  assertInvalid(validatePositiveInteger(-1, "quantity"), "INVALID_POSITIVE_INTEGER");
  assertInvalid(validatePositiveInteger(1.5, "quantity"), "INVALID_POSITIVE_INTEGER");
  assertInvalid(validatePositiveInteger(Number.NaN, "quantity"), "INVALID_POSITIVE_INTEGER");
  assertInvalid(validatePositiveInteger(Number.POSITIVE_INFINITY, "quantity"), "INVALID_POSITIVE_INTEGER");
  assertInvalid(validatePositiveInteger(Number.MAX_SAFE_INTEGER + 1, "quantity"), "INVALID_POSITIVE_INTEGER");
  assertInvalid(validatePkrAmount("1"), "INVALID_POSITIVE_INTEGER");
  assertInvalid(validateQuantity(-2), "INVALID_POSITIVE_INTEGER");

  assertValid(validateCurrencyConsistency("PKR", "pkr"));
  assertInvalid(validateCurrencyConsistency("PKR", "USD"), "CURRENCY_MISMATCH");
  assertInvalid(validateCurrencyConsistency("PKR", "PK"), "INVALID_CURRENCY");
  assertInvalid(validateCurrencyConsistency("PKR", ""), "INVALID_CURRENCY");
  assertInvalid(validateCurrencyConsistency("PKR", 123), "INVALID_CURRENCY");

  assertValid(validateRefundAmount({
    requestedAmountPkr: 3000,
    capturedAmountPkr: 10000,
    refundedAmountPkr: 0,
    reservedRefundAmountPkr: 0,
    orderCurrency: "PKR",
    refundCurrency: "PKR",
  }));
  assertValid(validateRefundAmount({
    requestedAmountPkr: 3000,
    capturedAmountPkr: 10000,
    refundedAmountPkr: 4000,
    reservedRefundAmountPkr: 3000,
    orderCurrency: "PKR",
    refundCurrency: "PKR",
  }));
  assertInvalid(validateRefundAmount({
    requestedAmountPkr: 4000,
    capturedAmountPkr: 10000,
    refundedAmountPkr: 4000,
    reservedRefundAmountPkr: 3000,
    orderCurrency: "PKR",
    refundCurrency: "PKR",
  }), "REFUND_LIMIT_EXCEEDED");
  assertInvalid(validateRefundAmount({
    requestedAmountPkr: 1,
    capturedAmountPkr: 10000,
    refundedAmountPkr: -1,
    reservedRefundAmountPkr: 0,
    orderCurrency: "PKR",
    refundCurrency: "PKR",
  }), "INVALID_NON_NEGATIVE_INTEGER");
  assertInvalid(validateRefundAmount({
    requestedAmountPkr: Number.POSITIVE_INFINITY,
    capturedAmountPkr: 10000,
    refundedAmountPkr: 0,
    reservedRefundAmountPkr: 0,
    orderCurrency: "PKR",
    refundCurrency: "PKR",
  }), "INVALID_POSITIVE_INTEGER");
  assertInvalid(validateRefundAmount({
    requestedAmountPkr: 1,
    capturedAmountPkr: Number.MAX_SAFE_INTEGER,
    refundedAmountPkr: Number.MAX_SAFE_INTEGER,
    reservedRefundAmountPkr: Number.MAX_SAFE_INTEGER,
    orderCurrency: "PKR",
    refundCurrency: "PKR",
  }), "INVALID_REFUND_LEDGER");
  assertInvalid(validateRefundAmount({
    requestedAmountPkr: 1000,
    capturedAmountPkr: 10000,
    refundedAmountPkr: 0,
    reservedRefundAmountPkr: 0,
    orderCurrency: "PKR",
    refundCurrency: "USD",
  }), "CURRENCY_MISMATCH");

  const validKey = validateIdempotencyKey("  attempt-123 ");
  assert.equal(validKey.valid, true);
  if (validKey.valid) assert.equal(validKey.normalized, "attempt-123");
  assert.equal(validateIdempotencyKey("x").valid, true);
  assert.equal(validateIdempotencyKey("x".repeat(200)).valid, true);
  assertInvalid(validateIdempotencyKey(""), "INVALID_IDEMPOTENCY_KEY");
  assertInvalid(validateIdempotencyKey("   "), "INVALID_IDEMPOTENCY_KEY");
  assertInvalid(validateIdempotencyKey(123), "INVALID_IDEMPOTENCY_KEY");
  assertInvalid(validateIdempotencyKey("x".repeat(201)), "INVALID_IDEMPOTENCY_KEY");
  assertInvalid(validateIdempotencyKey("bad\nkey"), "INVALID_IDEMPOTENCY_KEY");
});
