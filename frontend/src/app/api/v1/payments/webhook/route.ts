import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

/** Replay tolerance window: 5 minutes (300 seconds) */
const MAX_TIMESTAMP_DRIFT_SECONDS = 300;

export interface GatewayWebhookPayload {
  provider: string;
  eventId: string;
  eventType: "PAYMENT_CAPTURED" | "PAYMENT_SUCCESS" | "PAYMENT_FAILED" | "PAYMENT_CANCELLED" | string;
  orderReference: string;
  amountPkr?: number;
  currency?: string;
  providerPaymentId?: string;
  transactionId?: string;
  status?: string;
  timestamp?: number | string;
  metadata?: Record<string, unknown>;
}

/**
 * Validates HMAC-SHA256 signature against the raw unparsed request buffer
 * using constant-time comparison to prevent timing side-channel attacks.
 */
export function verifyWebhookSignature(
  rawBody: Buffer,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader || !secret) return false;

  // Normalize signature header (strip possible prefixes like 'sha256=' or 'v1=')
  const cleanSignature = signatureHeader.replace(/^sha256=|^v1=/i, "").trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/i.test(cleanSignature)) {
    return false;
  }

  const computedHex = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex")
    .toLowerCase();

  try {
    const actualBuf = Buffer.from(cleanSignature, "hex");
    const expectedBuf = Buffer.from(computedHex, "hex");
    if (actualBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(actualBuf, expectedBuf);
  } catch {
    return false;
  }
}

/**
 * Validates request timestamp to defend against replay attacks.
 */
export function verifyTimestampFreshness(
  timestampHeader: string | null,
  payloadTimestamp?: number | string
): boolean {
  const tsRaw = timestampHeader || (payloadTimestamp !== undefined ? String(payloadTimestamp) : null);
  if (!tsRaw) {
    // If no timestamp is provided at all, we permit in relaxed mode, but when provided, strictly enforce
    return true;
  }

  let tsSeconds: number;
  if (/^\d{13}$/.test(tsRaw.trim())) {
    // Milliseconds Unix timestamp
    tsSeconds = Math.floor(Number(tsRaw.trim()) / 1000);
  } else if (/^\d{10}$/.test(tsRaw.trim())) {
    // Seconds Unix timestamp
    tsSeconds = Number(tsRaw.trim());
  } else {
    // Try ISO string
    const parsed = Date.parse(tsRaw.trim());
    if (isNaN(parsed)) return false;
    tsSeconds = Math.floor(parsed / 1000);
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const diff = Math.abs(nowSeconds - tsSeconds);
  return diff <= MAX_TIMESTAMP_DRIFT_SECONDS;
}

export async function POST(request: NextRequest) {
  let rawBuffer: Buffer | null = null;
  try {
    // 1. Read raw body as ArrayBuffer for cryptographic fidelity
    const arrayBuffer = await request.arrayBuffer();
    rawBuffer = Buffer.from(arrayBuffer);

    if (rawBuffer.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "EMPTY_PAYLOAD", message: "Request body cannot be empty." } },
        { status: 400 }
      );
    }

    // 2. Extract signature and timestamp headers
    const signatureHeader =
      request.headers.get("x-signature") ||
      request.headers.get("x-signature-sha256") ||
      request.headers.get("x-webhook-signature") ||
      request.headers.get("x-gateway-signature");

    const timestampHeader =
      request.headers.get("x-timestamp") ||
      request.headers.get("x-webhook-timestamp");

    let webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;
    if (!webhookSecret || webhookSecret.trim().length === 0) {
      if (process.env.NODE_ENV === "test") {
        webhookSecret = "test_webhook_hmac_secret_key_32bytes_long_ok";
      } else {
        console.error("Critical Security Failure: PAYMENT_WEBHOOK_SECRET is not configured.");
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "WEBHOOK_CONFIG_ERROR",
              message: "Payment webhook secret is not configured.",
            },
          },
          { status: 500 }
        );
      }
    } else if (webhookSecret.length < 32 && process.env.NODE_ENV !== "test") {
      console.error("Critical Security Failure: PAYMENT_WEBHOOK_SECRET is shorter than 32 characters.");
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "WEBHOOK_CONFIG_ERROR",
            message: "Payment webhook secret is not configured.",
          },
        },
        { status: 500 }
      );
    }

    // 3. Cryptographic HMAC verification
    const isSignatureValid = verifyWebhookSignature(rawBuffer, signatureHeader, webhookSecret);
    if (!isSignatureValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_SIGNATURE",
            message: "HMAC signature verification failed. Untrusted webhook sender.",
          },
        },
        { status: 401 }
      );
    }

    // 4. Parse JSON payload
    let payload: GatewayWebhookPayload;
    try {
      payload = JSON.parse(rawBuffer.toString("utf-8"));
    } catch {
      return NextResponse.json(
        { success: false, error: { code: "MALFORMED_JSON", message: "Invalid JSON payload." } },
        { status: 400 }
      );
    }

    // 5. Verify timestamp freshness (replay protection)
    const isTimestampFresh = verifyTimestampFreshness(timestampHeader, payload.timestamp);
    if (!isTimestampFresh) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "REPLAY_DETECTED",
            message: "Webhook timestamp expired or exceeds allowed drift window (300s).",
          },
        },
        { status: 400 }
      );
    }

    // 6. Validate mandatory payload fields
    const provider = (
      typeof payload.provider === "string" && payload.provider.trim()
        ? payload.provider.trim().toLowerCase()
        : (request.headers.get("x-provider") || "stripe")
    ).toLowerCase();

    const eventId = (
      typeof payload.eventId === "string" && payload.eventId.trim()
        ? payload.eventId.trim()
        : (request.headers.get("x-event-id") || "")
    ).trim();

    const rawStatus = payload.status;
    let eventType = typeof payload.eventType === "string" ? payload.eventType.trim().toUpperCase() : "";
    if (!eventType && rawStatus === "SUCCESS") {
      eventType = "PAYMENT_CAPTURED";
    }

    const orderReference = typeof payload.orderReference === "string" ? payload.orderReference.trim().toUpperCase() : "";

    if (!provider || !eventId || !eventType || !orderReference) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_FAILED",
            message: "Webhook requires provider, eventId, eventType, and orderReference.",
          },
        },
        { status: 400 }
      );
    }

    // 7. Deduplication: Check if provider + eventId was already processed
    const existingEvent = await prisma.paymentEvent.findUnique({
      where: {
        provider_providerEventId: {
          provider,
          providerEventId: eventId,
        },
      },
    });

    if (existingEvent) {
      return NextResponse.json(
        {
          success: true,
          deduplicated: true,
          message: "Event already recorded and processed.",
          eventId: existingEvent.id,
        },
        { status: 200 }
      );
    }

    // 8. Find target order
    const order = await prisma.order.findUnique({
      where: { orderReference },
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ORDER_NOT_FOUND",
            message: `No order found with reference ${orderReference}.`,
          },
        },
        { status: 404 }
      );
    }

    // 9. Atomic Ledger Processing in Transaction
    const payloadHash = crypto.createHash("sha256").update(rawBuffer).digest("hex");

    const result = await prisma.$transaction(async (tx) => {
      // Find or create PaymentAttempt
      let attempt = await tx.paymentAttempt.findFirst({
        where: { orderId: order.id, provider },
      });

      if (!attempt) {
        attempt = await tx.paymentAttempt.create({
          data: {
            id: crypto.randomUUID(),
            orderId: order.id,
            provider,
            paymentMethod: order.paymentMethod,
            amountPkr: order.totalPkr,
            currency: "PKR",
            attemptKey: `webhook_att_${crypto.randomUUID()}`,
            status: "CREATED",
          },
        });
      }

      // Record PaymentEvent
      const paymentEvent = await tx.paymentEvent.create({
        data: {
          id: crypto.randomUUID(),
          paymentAttemptId: attempt.id,
          provider,
          providerEventId: eventId,
          eventType,
          payloadHash,
          signatureVerified: true,
          processingStatus: "PROCESSED",
          processedAt: new Date(),
        },
      });

      // Handle Event Types
      const isSuccess = eventType === "PAYMENT_CAPTURED" || eventType === "PAYMENT_SUCCESS";
      const isFailed = eventType === "PAYMENT_FAILED" || eventType === "PAYMENT_CANCELLED";

      if (isSuccess) {
        const capturedAmount = typeof payload.amountPkr === "number" && payload.amountPkr > 0
          ? Math.round(payload.amountPkr)
          : order.totalPkr;

        await tx.paymentAttempt.update({
          where: { id: attempt.id },
          data: {
            status: "CAPTURED",
            capturedAmountPkr: capturedAmount,
            capturedAt: new Date(),
            providerPaymentId:
              payload.providerPaymentId ||
              payload.transactionId ||
              undefined,
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: "PAID",
            orderStatus: order.orderStatus === "PENDING" ? "PROCESSING" : order.orderStatus,
          },
        });

        await tx.orderAuditLog.create({
          data: {
            orderId: order.id,
            action: "GATEWAY_PAYMENT_VERIFIED",
            performedBy: `GatewayWebhook:${provider}`,
            previousStatus: order.paymentStatus,
            newStatus: "PAID",
            note: `Online payment of PKR ${capturedAmount} confirmed via verified ${provider} webhook (Event: ${eventId}).`,
          },
        });
      } else if (isFailed) {
        await tx.paymentAttempt.update({
          where: { id: attempt.id },
          data: {
            status: "FAILED",
            failedAt: new Date(),
            failureMessage: `Payment failed according to gateway webhook event: ${eventType}`,
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: "FAILED",
          },
        });

        await tx.orderAuditLog.create({
          data: {
            orderId: order.id,
            action: "GATEWAY_PAYMENT_FAILED",
            performedBy: `GatewayWebhook:${provider}`,
            previousStatus: order.paymentStatus,
            newStatus: "FAILED",
            note: `Payment attempt failed via ${provider} webhook (Event: ${eventId}).`,
          },
        });
      }

      return { eventId: paymentEvent.id, attemptId: attempt.id };
    });

    return NextResponse.json({
      success: true,
      message: `Webhook event ${eventId} processed successfully.`,
      eventId: result.eventId,
      attemptId: result.attemptId,
      orderReference,
    });
  } catch (error: unknown) {
    const prismaErr = error as { code?: string } | null;
    if (prismaErr && typeof prismaErr === "object" && prismaErr.code === "P2002" && rawBuffer) {
      try {
        const bodyText = rawBuffer.toString("utf-8");
        const parsed = JSON.parse(bodyText);
        if (parsed.provider && parsed.eventId) {
          const raced = await prisma.paymentEvent.findUnique({
            where: {
              provider_providerEventId: {
                provider: String(parsed.provider).trim().toLowerCase(),
                providerEventId: String(parsed.eventId).trim(),
              },
            },
          });
          if (raced) {
            return NextResponse.json(
              {
                success: true,
                deduplicated: true,
                message: "Event already recorded and processed.",
                eventId: raced.id,
              },
              { status: 200 }
            );
          }
        }
      } catch {
        // Fall through to general server error
      }
    }
    console.error("Gateway Webhook processing error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to process webhook event." },
      },
      { status: 500 }
    );
  }
}
