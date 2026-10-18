import crypto from "node:crypto";
import { Refund } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  validateCurrencyConsistency,
  validateIdempotencyKey,
  validateRefundAmount,
  validateRefundTransition,
  validatePkrAmount,
} from "@/lib/payment-domain";

const DEFAULT_REFUND_REASON = "REFUND_REQUESTED";

export interface CreateRefundInput {
  paymentAttemptId: unknown;
  amountPkr: unknown;
  currency: unknown;
  idempotencyKey: unknown;
  reason?: unknown;
  provider?: unknown;
}

export interface VerifiedRefundConfirmation {
  providerEventId: unknown;
  eventType: unknown;
  payloadHash: unknown;
  signatureVerified: unknown;
}

export interface TransitionRefundInput {
  refundId: unknown;
  nextStatus: unknown;
  verifiedProviderConfirmation?: VerifiedRefundConfirmation;
  failureCode?: unknown;
}

export type RefundLedgerResult =
  | { success: true; refund: Refund; reused: boolean }
  | { success: false; code: string; error: string };

export type RefundTransitionResult =
  | { success: true; refund: Refund; eventId?: string }
  | { success: false; code: string; error: string };

class RefundLedgerServiceError extends Error {
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
  if (error instanceof RefundLedgerServiceError) {
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

function normalizeCurrency(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().toUpperCase();
}

function normalizeCreateInput(input: CreateRefundInput): {
  paymentAttemptId: string;
  amountPkr: number;
  currency: string;
  idempotencyKey: string;
  reason: string;
  provider?: string;
} {
  const paymentAttemptId = validateText(input.paymentAttemptId, "payment attempt ID");
  if (!paymentAttemptId) {
    throw new RefundLedgerServiceError("VALIDATION_FAILED", "Payment attempt ID is required.");
  }

  const amountCheck = validatePkrAmount(input.amountPkr);
  if (!amountCheck.valid) throw new RefundLedgerServiceError(amountCheck.code, amountCheck.message);

  const currency = normalizeCurrency(input.currency);
  const currencyCheck = validateCurrencyConsistency(currency, currency);
  if (!currencyCheck.valid) throw new RefundLedgerServiceError(currencyCheck.code, currencyCheck.message);

  const idempotency = validateIdempotencyKey(input.idempotencyKey);
  if (!idempotency.valid) throw new RefundLedgerServiceError(idempotency.code, idempotency.message);

  const reason = input.reason === undefined
    ? DEFAULT_REFUND_REASON
    : validateText(input.reason, "refund reason", 100);
  if (!reason) throw new RefundLedgerServiceError("VALIDATION_FAILED", "Refund reason is invalid.");

  const provider = input.provider === undefined
    ? undefined
    : validateText(input.provider, "provider", 100);
  if (input.provider !== undefined && !provider) {
    throw new RefundLedgerServiceError("VALIDATION_FAILED", "Provider is invalid.");
  }

  return {
    paymentAttemptId,
    amountPkr: input.amountPkr as number,
    currency,
    idempotencyKey: idempotency.normalized,
    reason,
    provider: provider ?? undefined,
  };
}

function refundMatches(
  refund: Refund,
  input: ReturnType<typeof normalizeCreateInput>
): boolean {
  return refund.paymentAttemptId === input.paymentAttemptId &&
    refund.amountPkr === input.amountPkr &&
    refund.currency === input.currency &&
    refund.reason === input.reason &&
    (!input.provider || refund.provider === input.provider);
}

function localEventData(provider: string, refundId: string, status: string) {
  const eventPayload = `local-refund:${refundId}:${status}`;
  return {
    provider,
    providerEventId: `local:refund:${refundId}:${crypto.randomUUID()}`,
    eventType: `REFUND_${status}`,
    payloadHash: crypto.createHash("sha256").update(eventPayload).digest("hex"),
    signatureVerified: false,
    processingStatus: "PROCESSED",
  };
}

function verifiedProviderEvent(
  confirmation: VerifiedRefundConfirmation,
  provider: string
) {
  const providerEventId = validateText(confirmation.providerEventId, "provider event ID", 200);
  const eventType = validateText(confirmation.eventType, "event type", 100);
  const payloadHash = validateText(confirmation.payloadHash, "payload hash", 200);
  if (!providerEventId || !eventType || !payloadHash || confirmation.signatureVerified !== true) {
    throw new RefundLedgerServiceError(
      "INVALID_PROVIDER_CONFIRMATION",
      "A verified provider confirmation is required before recording refund success."
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

function requireCapturedAttempt(attempt: {
  status: string;
  capturedAt: Date | null;
  capturedAmountPkr: number;
  currency: string;
  order: { currency: string };
}): void {
  if (attempt.status !== "CAPTURED" || !attempt.capturedAt) {
    throw new RefundLedgerServiceError(
      "PAYMENT_NOT_CAPTURED",
      "Refunds require a captured payment attempt."
    );
  }
  const capturedCheck = validatePkrAmount(attempt.capturedAmountPkr);
  if (!capturedCheck.valid) {
    throw new RefundLedgerServiceError("INVALID_CAPTURED_AMOUNT", "Captured amount is invalid.");
  }
  const currencyCheck = validateCurrencyConsistency(attempt.order.currency, attempt.currency);
  if (!currencyCheck.valid) throw new RefundLedgerServiceError(currencyCheck.code, currencyCheck.message);
}

async function findMatchingRefund(
  input: ReturnType<typeof normalizeCreateInput>
): Promise<RefundLedgerResult | null> {
  const existing = await prisma.refund.findUnique({
    where: {
      paymentAttemptId_idempotencyKey: {
        paymentAttemptId: input.paymentAttemptId,
        idempotencyKey: input.idempotencyKey,
      },
    },
  });
  if (!existing) return null;
  if (!refundMatches(existing, input)) {
    return {
      success: false,
      code: "IDEMPOTENCY_KEY_REUSED",
      error: "Refund idempotency key was used for a different request.",
    };
  }
  return { success: true, refund: existing, reused: true };
}

export async function createRefund(rawInput: CreateRefundInput): Promise<RefundLedgerResult> {
  let input: ReturnType<typeof normalizeCreateInput>;
  try {
    input = normalizeCreateInput(rawInput);
  } catch (error) {
    return serviceFailure(error);
  }

  const alreadyExists = await findMatchingRefund(input);
  if (alreadyExists) return alreadyExists;

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const attempt = await transaction.paymentAttempt.findUnique({
        where: { id: input.paymentAttemptId },
        include: { order: { select: { currency: true } } },
      });
      if (!attempt) throw new RefundLedgerServiceError("NOT_FOUND", "Payment attempt not found.");

      const existing = await transaction.refund.findUnique({
        where: {
          paymentAttemptId_idempotencyKey: {
            paymentAttemptId: input.paymentAttemptId,
            idempotencyKey: input.idempotencyKey,
          },
        },
      });
      if (existing) {
        if (!refundMatches(existing, input)) {
          throw new RefundLedgerServiceError(
            "IDEMPOTENCY_KEY_REUSED",
            "Refund idempotency key was used for a different request."
          );
        }
        return { refund: existing, reused: true };
      }

      requireCapturedAttempt(attempt);
      if (input.provider && input.provider !== attempt.provider) {
        throw new RefundLedgerServiceError("PROVIDER_MISMATCH", "Provider does not match the payment attempt.");
      }
      const currencyCheck = validateCurrencyConsistency(attempt.currency, input.currency);
      if (!currencyCheck.valid) throw new RefundLedgerServiceError(currencyCheck.code, currencyCheck.message);
      const amountCheck = validateRefundAmount({
        requestedAmountPkr: input.amountPkr,
        capturedAmountPkr: attempt.capturedAmountPkr,
        refundedAmountPkr: attempt.refundedAmountPkr,
        reservedRefundAmountPkr: attempt.refundReservedAmountPkr,
        orderCurrency: attempt.order.currency,
        refundCurrency: input.currency,
      });
      if (!amountCheck.valid) throw new RefundLedgerServiceError(amountCheck.code, amountCheck.message);

      const reserved = await transaction.$executeRaw`
        UPDATE "PaymentAttempt"
        SET "refundReservedAmountPkr" = "refundReservedAmountPkr" + ${input.amountPkr},
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${attempt.id}
          AND "status" = 'CAPTURED'
          AND "capturedAmountPkr" >= "refundedAmountPkr" + "refundReservedAmountPkr" + ${input.amountPkr}
      `;
      if (reserved !== 1) {
        throw new RefundLedgerServiceError(
          "REFUND_LIMIT_EXCEEDED",
          "Refund amount exceeds the available captured amount."
        );
      }

      const refundId = crypto.randomUUID();
      const eventData = localEventData(attempt.provider, refundId, "REQUESTED");
      const refund = await transaction.refund.create({
        data: {
          id: refundId,
          paymentAttemptId: attempt.id,
          provider: attempt.provider,
          amountPkr: input.amountPkr,
          currency: input.currency,
          status: "REQUESTED",
          idempotencyKey: input.idempotencyKey,
          reason: input.reason,
        },
      });
      await transaction.paymentEvent.create({
        data: {
          paymentAttemptId: attempt.id,
          provider: eventData.provider,
          providerEventId: eventData.providerEventId,
          eventType: eventData.eventType,
          payloadHash: eventData.payloadHash,
          signatureVerified: eventData.signatureVerified,
          processingStatus: eventData.processingStatus,
        },
      });
      return { refund, reused: false };
    });
    return { success: true, refund: result.refund, reused: result.reused };
  } catch (error) {
    if (error instanceof RefundLedgerServiceError) return serviceFailure(error);
    if (isUniqueConstraintError(error)) {
      const raced = await findMatchingRefund(input);
      if (raced) return raced;
      return {
        success: false,
        code: "CONCURRENT_REFUND_CONFLICT",
        error: "Refund creation conflicted; retry with the same key.",
      };
    }
    if (isConcurrencyError(error)) {
      return {
        success: false,
        code: "CONCURRENT_REFUND_CONFLICT",
        error: "Refund creation conflicted; retry with the same key.",
      };
    }
    throw error;
  }
}

export async function transitionRefund(
  rawInput: TransitionRefundInput
): Promise<RefundTransitionResult> {
  const refundId = validateText(rawInput.refundId, "refund ID");
  if (!refundId || typeof rawInput.nextStatus !== "string") {
    return { success: false, code: "VALIDATION_FAILED", error: "Refund ID and next status are required." };
  }
  const nextStatus = rawInput.nextStatus;
  const failureCode = rawInput.failureCode === undefined
    ? undefined
    : validateText(rawInput.failureCode, "failure code", 100);
  if (rawInput.failureCode !== undefined && !failureCode) {
    return { success: false, code: "VALIDATION_FAILED", error: "Failure code is invalid." };
  }

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const current = await transaction.refund.findUnique({ where: { id: refundId } });
      if (!current) throw new RefundLedgerServiceError("NOT_FOUND", "Refund not found.");

      const transition = validateRefundTransition(current.status, nextStatus);
      if (!transition.valid) throw new RefundLedgerServiceError(transition.code, transition.message);
      if (current.status === nextStatus) return { refund: current, eventId: undefined };

      const isSuccess = nextStatus === "SUCCEEDED";
      const isRelease = nextStatus === "FAILED" || nextStatus === "CANCELLED";
      if (isSuccess) {
        if (!rawInput.verifiedProviderConfirmation) {
          throw new RefundLedgerServiceError(
            "VERIFIED_PROVIDER_CONFIRMATION_REQUIRED",
            "A verified provider confirmation is required before recording refund success."
          );
        }
        const providerEvent = verifiedProviderEvent(
          rawInput.verifiedProviderConfirmation,
          current.provider
        );
        const moved = await transaction.$executeRaw`
          UPDATE "PaymentAttempt"
          SET "refundReservedAmountPkr" = "refundReservedAmountPkr" - ${current.amountPkr},
              "refundedAmountPkr" = "refundedAmountPkr" + ${current.amountPkr},
              "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" = ${current.paymentAttemptId}
            AND "refundReservedAmountPkr" >= ${current.amountPkr}
            AND "capturedAmountPkr" >= "refundedAmountPkr" + ${current.amountPkr}
        `;
        if (moved !== 1) {
          throw new RefundLedgerServiceError(
            "REFUND_COUNTER_CONFLICT",
            "Refund capacity changed before success was recorded."
          );
        }

        const changed = await transaction.refund.updateMany({
          where: { id: current.id, status: current.status },
          data: { status: nextStatus, completedAt: new Date() },
        });
        if (changed.count !== 1) {
          throw new RefundLedgerServiceError("CONCURRENT_REFUND_CONFLICT", "Refund changed concurrently.");
        }
        const event = await transaction.paymentEvent.create({
          data: {
            paymentAttemptId: current.paymentAttemptId,
            provider: providerEvent.provider,
            providerEventId: providerEvent.providerEventId,
            eventType: providerEvent.eventType,
            payloadHash: providerEvent.payloadHash,
            signatureVerified: providerEvent.signatureVerified,
            processingStatus: providerEvent.processingStatus,
          },
        });
        const refund = await transaction.refund.findUniqueOrThrow({ where: { id: current.id } });
        return { refund, eventId: event.id };
      }

      if (isRelease) {
        const released = await transaction.$executeRaw`
          UPDATE "PaymentAttempt"
          SET "refundReservedAmountPkr" = "refundReservedAmountPkr" - ${current.amountPkr},
              "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" = ${current.paymentAttemptId}
            AND "refundReservedAmountPkr" >= ${current.amountPkr}
        `;
        if (released !== 1) {
          throw new RefundLedgerServiceError(
            "REFUND_COUNTER_CONFLICT",
            "Refund capacity changed before release was recorded."
          );
        }
      }

      const eventData = localEventData(current.provider, current.id, nextStatus);
      const changed = await transaction.refund.updateMany({
        where: { id: current.id, status: current.status },
        data: {
          status: nextStatus,
          completedAt: new Date(),
          ...(nextStatus === "FAILED" && failureCode ? { failureCode } : {}),
        },
      });
      if (changed.count !== 1) {
        throw new RefundLedgerServiceError("CONCURRENT_REFUND_CONFLICT", "Refund changed concurrently.");
      }
      const event = await transaction.paymentEvent.create({
        data: {
          paymentAttemptId: current.paymentAttemptId,
          provider: eventData.provider,
          providerEventId: eventData.providerEventId,
          eventType: eventData.eventType,
          payloadHash: eventData.payloadHash,
          signatureVerified: eventData.signatureVerified,
          processingStatus: eventData.processingStatus,
        },
      });
      const refund = await transaction.refund.findUniqueOrThrow({ where: { id: current.id } });
      return { refund, eventId: event.id };
    });
    return { success: true, refund: result.refund, eventId: result.eventId };
  } catch (error) {
    return serviceFailure(error) as RefundTransitionResult;
  }
}
