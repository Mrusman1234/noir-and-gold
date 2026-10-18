import crypto from "node:crypto";
import { PaymentAttempt, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  validateCurrencyConsistency,
  validateIdempotencyKey,
  validatePaymentAttemptTransition,
  validatePkrAmount,
} from "@/lib/payment-domain";

const ACTIVE_ATTEMPT_STATUSES = ["CREATED", "PENDING", "REQUIRES_ACTION", "AUTHORIZED"] as const;
const SUCCESS_CONFIRMATION_STATUSES = ["AUTHORIZED", "CAPTURED"] as const;

export interface CreatePaymentAttemptInput {
  orderId: unknown;
  provider: unknown;
  paymentMethod: unknown;
  amountPkr: unknown;
  currency: unknown;
  attemptKey: unknown;
  initialStatus?: unknown;
}

export interface ProviderConfirmationEvent {
  providerEventId: unknown;
  eventType: unknown;
  payloadHash: unknown;
  signatureVerified: unknown;
}

export interface TransitionPaymentAttemptInput {
  attemptId: unknown;
  nextStatus: unknown;
  providerEvent?: ProviderConfirmationEvent;
}

export type PaymentAttemptServiceResult =
  | { success: true; attempt: PaymentAttempt; reused: boolean }
  | { success: false; code: string; error: string };

export type PaymentAttemptTransitionResult =
  | { success: true; attempt: PaymentAttempt; eventId?: string }
  | { success: false; code: string; error: string };

class PaymentAttemptServiceError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
  }
}

function validateText(value: unknown, fieldName: string, maxLength = 100): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength || /[\u0000-\u001F\u007F]/.test(normalized)) {
    return null;
  }
  return normalized;
}

function serviceFailure(error: unknown): { success: false; code: string; error: string } {
  if (error instanceof PaymentAttemptServiceError) {
    return { success: false, code: error.code, error: error.message };
  }
  throw error;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (error as { code?: string })?.code === "P2002";
}

function isConcurrencyError(error: unknown): boolean {
  const code = (error as { code?: string })?.code;
  return code === "P1008" || code === "P2028" || code === "P2034";
}

function localEventData(provider: string, attemptId: string, status: string): {
  provider: string;
  providerEventId: string;
  eventType: string;
  payloadHash: string;
  signatureVerified: boolean;
  processingStatus: string;
} {
  const eventPayload = `local-payment-attempt:${attemptId}:${status}`;
  return {
    provider,
    providerEventId: `local:${attemptId}:${crypto.randomUUID()}`,
    eventType: `ATTEMPT_${status}`,
    payloadHash: crypto.createHash("sha256").update(eventPayload).digest("hex"),
    signatureVerified: false,
    processingStatus: "PROCESSED",
  };
}

function providerEventData(event: ProviderConfirmationEvent, provider: string) {
  const providerEventId = validateText(event.providerEventId, "provider event ID", 200);
  const eventType = validateText(event.eventType, "event type", 100);
  const payloadHash = validateText(event.payloadHash, "payload hash", 200);
  if (!providerEventId || !eventType || !payloadHash || event.signatureVerified !== true) {
    throw new PaymentAttemptServiceError(
      "INVALID_PROVIDER_EVENT",
      "A verified provider event with valid identifiers is required for payment confirmation."
    );
  }
  return {
    provider,
    providerEventId,
    eventType,
    payloadHash,
    signatureVerified: true,
    processingStatus: "PROCESSED",
  };
}

function immutableRequestMatches(
  attempt: PaymentAttempt,
  input: { orderId: string; provider: string; paymentMethod: string; amountPkr: number; currency: string }
): boolean {
  return attempt.orderId === input.orderId &&
    attempt.provider === input.provider &&
    attempt.paymentMethod === input.paymentMethod &&
    attempt.amountPkr === input.amountPkr &&
    attempt.currency === input.currency;
}

function validateCreateInput(input: CreatePaymentAttemptInput): {
  orderId: string;
  provider: string;
  paymentMethod: string;
  amountPkr: number;
  currency: string;
  attemptKey: string;
} {
  const orderId = validateText(input.orderId, "order ID", 100);
  const provider = validateText(input.provider, "provider", 100);
  const paymentMethod = validateText(input.paymentMethod, "payment method", 100);
  if (!orderId || !provider || !paymentMethod) {
    throw new PaymentAttemptServiceError("VALIDATION_FAILED", "Order, provider, and payment method are required.");
  }

  const amountCheck = validatePkrAmount(input.amountPkr);
  if (!amountCheck.valid) throw new PaymentAttemptServiceError(amountCheck.code, amountCheck.message);
  const amountPkr = input.amountPkr as number;

  const idempotency = validateIdempotencyKey(input.attemptKey);
  if (!idempotency.valid) throw new PaymentAttemptServiceError(idempotency.code, idempotency.message);

  if (input.initialStatus !== undefined && input.initialStatus !== "CREATED") {
    throw new PaymentAttemptServiceError("INVALID_INITIAL_STATUS", "New payment attempts must start in CREATED state.");
  }

  return {
    orderId,
    provider,
    paymentMethod,
    amountPkr,
    currency: typeof input.currency === "string" ? input.currency.trim().toUpperCase() : "",
    attemptKey: idempotency.normalized,
  };
}

export async function createPaymentAttempt(
  rawInput: CreatePaymentAttemptInput
): Promise<PaymentAttemptServiceResult> {
  let input: ReturnType<typeof validateCreateInput>;
  try {
    input = validateCreateInput(rawInput);
  } catch (error) {
    return serviceFailure(error);
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
      include: { paymentAttempts: { orderBy: { createdAt: "desc" } } },
    });
    if (!order) return { success: false, code: "NOT_FOUND", error: "Order not found." };
    if (order.paymentMethod === "CASH_ON_DELIVERY") {
      return { success: false, code: "COD_NOT_ELIGIBLE", error: "COD orders do not create online payment attempts." };
    }
    if (order.paymentStatus === "PAID" || order.paymentStatus === "REFUNDED" || order.orderStatus === "CANCELLED") {
      return { success: false, code: "ORDER_NOT_ELIGIBLE", error: "Order is not eligible for a payment attempt." };
    }
    if (order.paymentMethod !== input.paymentMethod) {
      return { success: false, code: "PAYMENT_METHOD_MISMATCH", error: "Payment method does not match the order." };
    }
    if (order.totalPkr !== input.amountPkr) {
      return { success: false, code: "AMOUNT_MISMATCH", error: "Payment amount does not match the order total." };
    }
    const currencyCheck = validateCurrencyConsistency(order.currency, input.currency);
    if (!currencyCheck.valid) return { success: false, code: currencyCheck.code, error: currencyCheck.message };

    const existingByKey = order.paymentAttempts.find((attempt) => attempt.attemptKey === input.attemptKey);
    if (existingByKey) {
      if (!immutableRequestMatches(existingByKey, input)) {
        return { success: false, code: "IDEMPOTENCY_KEY_REUSED", error: "Payment attempt key was used for a different request." };
      }
      if (!ACTIVE_ATTEMPT_STATUSES.includes(existingByKey.status as typeof ACTIVE_ATTEMPT_STATUSES[number])) {
        return { success: false, code: "ATTEMPT_NOT_RETRYABLE", error: "This payment attempt is terminal; create a new attempt key to retry." };
      }
      return { success: true, attempt: existingByKey, reused: true };
    }

    const activeAttempt = order.paymentAttempts.find((attempt) =>
      ACTIVE_ATTEMPT_STATUSES.includes(attempt.status as typeof ACTIVE_ATTEMPT_STATUSES[number])
    );
    if (activeAttempt) {
      if (!immutableRequestMatches(activeAttempt, input)) {
        return { success: false, code: "ACTIVE_ATTEMPT_CONFLICT", error: "An active payment attempt already exists for different payment details." };
      }
      return { success: true, attempt: activeAttempt, reused: true };
    }

    const latest = order.paymentAttempts[0];
    if (latest && latest.status === "CAPTURED") {
      return { success: false, code: "ATTEMPT_NOT_RETRYABLE", error: "A captured payment attempt cannot be retried." };
    }

    const attemptId = crypto.randomUUID();
    const eventData = localEventData(input.provider, attemptId, "CREATED");
    const created = await prisma.$transaction(async (transaction) => {
      const attempt = await transaction.paymentAttempt.create({
        data: {
          id: attemptId,
          orderId: input.orderId,
          provider: input.provider,
          paymentMethod: input.paymentMethod,
          status: "CREATED",
          amountPkr: input.amountPkr,
          currency: input.currency,
          attemptKey: input.attemptKey,
        },
      });
      await transaction.paymentEvent.create({
        data: {
          paymentAttemptId: attempt.id,
          provider: input.provider,
          providerEventId: eventData.providerEventId,
          eventType: eventData.eventType,
          payloadHash: eventData.payloadHash,
          signatureVerified: eventData.signatureVerified,
          processingStatus: eventData.processingStatus,
        },
      });
      return attempt;
    });
    return { success: true, attempt: created, reused: false };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const raced = await prisma.paymentAttempt.findFirst({
        where: { orderId: input.orderId, attemptKey: input.attemptKey },
      });
      if (raced && immutableRequestMatches(raced, input) && ACTIVE_ATTEMPT_STATUSES.includes(raced.status as typeof ACTIVE_ATTEMPT_STATUSES[number])) {
        return { success: true, attempt: raced, reused: true };
      }
      return { success: false, code: "CONCURRENT_ATTEMPT_CONFLICT", error: "Payment attempt creation conflicted; retry with the same key." };
    }
    if (isConcurrencyError(error)) {
      return { success: false, code: "CONCURRENT_ATTEMPT_CONFLICT", error: "Payment attempt creation conflicted; retry with the same key." };
    }
    throw error;
  }
}

export async function transitionPaymentAttempt(
  rawInput: TransitionPaymentAttemptInput
): Promise<PaymentAttemptTransitionResult> {
  const attemptId = validateText(rawInput.attemptId, "attempt ID", 100);
  const nextStatus = rawInput.nextStatus;
  if (!attemptId || typeof nextStatus !== "string") {
    return { success: false, code: "VALIDATION_FAILED", error: "Attempt ID and next status are required." };
  }

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const current = await transaction.paymentAttempt.findUnique({ where: { id: attemptId } });
      if (!current) throw new PaymentAttemptServiceError("NOT_FOUND", "Payment attempt not found.");

      const transition = validatePaymentAttemptTransition(current.status, nextStatus);
      if (!transition.valid) throw new PaymentAttemptServiceError(transition.code, transition.message);
      if (current.status === nextStatus) return { attempt: current, eventId: undefined };

      const isConfirmation = SUCCESS_CONFIRMATION_STATUSES.includes(
        nextStatus as typeof SUCCESS_CONFIRMATION_STATUSES[number]
      );
      if (isConfirmation && !rawInput.providerEvent) {
        throw new PaymentAttemptServiceError(
          "UNVERIFIED_PROVIDER_CONFIRMATION",
          "A verified provider event is required for payment confirmation."
        );
      }
      const eventData = isConfirmation
        ? providerEventData(rawInput.providerEvent!, current.provider)
        : rawInput.providerEvent
          ? providerEventData(rawInput.providerEvent, current.provider)
          : localEventData(current.provider, current.id, nextStatus);

      const updateData: Prisma.PaymentAttemptUpdateInput = { status: nextStatus };
      const now = new Date();
      if (nextStatus === "AUTHORIZED") updateData.authorizedAt = now;
      if (nextStatus === "CAPTURED") {
        updateData.capturedAt = now;
        updateData.capturedAmountPkr = current.amountPkr;
      }
      if (nextStatus === "FAILED") updateData.failedAt = now;
      if (nextStatus === "CANCELLED") updateData.cancelledAt = now;
      if (nextStatus === "VOIDED") updateData.voidedAt = now;

      const changed = await transaction.paymentAttempt.updateMany({
        where: { id: current.id, status: current.status },
        data: updateData,
      });
      if (changed.count !== 1) {
        throw new PaymentAttemptServiceError("CONCURRENT_ATTEMPT_CONFLICT", "Payment attempt changed concurrently.");
      }

      const event = await transaction.paymentEvent.create({
        data: {
          paymentAttemptId: current.id,
          provider: eventData.provider,
          providerEventId: eventData.providerEventId,
          eventType: eventData.eventType,
          payloadHash: eventData.payloadHash,
          signatureVerified: eventData.signatureVerified,
          processingStatus: eventData.processingStatus,
        },
      });
      const attempt = await transaction.paymentAttempt.findUniqueOrThrow({ where: { id: current.id } });
      return { attempt, eventId: event.id };
    });
    return { success: true, attempt: result.attempt, eventId: result.eventId };
  } catch (error) {
    return serviceFailure(error) as PaymentAttemptTransitionResult;
  }
}
