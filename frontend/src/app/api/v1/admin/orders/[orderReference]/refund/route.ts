import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { requireAdminAuth } from "@/lib/admin-auth-guard";
import { prisma } from "@/lib/prisma";
import { logSecurityEvent } from "@/lib/audit-logger";

const VALID_REFUND_METHODS = ["ORIGINAL_PAYMENT", "MANUAL_BANK_TRANSFER", "STORE_CREDIT"] as const;
type RefundMethod = (typeof VALID_REFUND_METHODS)[number];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderReference?: string; id?: string }> }
) {
  // 1. Strict RBAC: Only ADMIN can initiate financial refunds
  const auth = await requireAdminAuth(request, ["ADMIN"]);
  if ("status" in auth) return auth;

  const resolvedParams = await params;
  const identifier = resolvedParams.orderReference || resolvedParams.id;

  if (!identifier) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: "Order identifier is required." } },
      { status: 400 }
    );
  }

  // 2. Parse & Validate Payload
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_JSON", message: "Request body must be valid JSON." } },
      { status: 400 }
    );
  }

  const { amountPkr, reason, refundMethod, note } = (body || {}) as {
    amountPkr?: unknown;
    reason?: unknown;
    refundMethod?: unknown;
    note?: unknown;
  };

  const parsedAmount = typeof amountPkr === "number" ? amountPkr : Number(amountPkr);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INVALID_AMOUNT", message: "Refund amount must be a positive number greater than zero." },
      },
      { status: 400 }
    );
  }

  if (typeof reason !== "string" || !reason.trim()) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "REASON_REQUIRED", message: "A substantive reason for the refund must be provided." },
      },
      { status: 400 }
    );
  }

  if (
    typeof refundMethod !== "string" ||
    !VALID_REFUND_METHODS.includes(refundMethod as RefundMethod)
  ) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_REFUND_METHOD",
          message: `Refund method must be one of: ${VALID_REFUND_METHODS.join(", ")}.`,
        },
      },
      { status: 400 }
    );
  }

  const refundAmountPkr = Math.round(parsedAmount);

  try {
    // 3. Transactional Execution
    const transactionResult = await prisma.$transaction(async (tx) => {
      // Find order by ID or orderReference
      const order = await tx.order.findFirst({
        where: {
          OR: [{ orderReference: identifier }, { id: identifier }],
        },
        include: {
          paymentAttempts: {
            include: {
              refunds: true,
            },
          },
        },
      });

      if (!order) {
        return {
          status: 404,
          error: { code: "ORDER_NOT_FOUND", message: `Order ${identifier} not found.` },
        };
      }

      // Calculate already accumulated refunds
      const existingRefundsTotal = order.paymentAttempts
        .flatMap((pa) => pa.refunds)
        .filter((r) => r.status === "COMPLETED" || r.status === "REQUESTED")
        .reduce((sum, r) => sum + r.amountPkr, 0);

      const remainingBalance = order.totalPkr - existingRefundsTotal;

      if (refundAmountPkr > remainingBalance) {
        return {
          status: 400,
          error: {
            code: "REFUND_EXCEEDS_TOTAL",
            message: `Refund amount of PKR ${refundAmountPkr} exceeds the remaining refundable balance of PKR ${remainingBalance}.`,
          },
        };
      }

      // Find or create associated PaymentAttempt
      const existingAttempt =
        order.paymentAttempts.find(
          (pa) => pa.status === "CAPTURED" || pa.status === "PAID"
        ) || order.paymentAttempts[0];

      let targetAttemptId = existingAttempt?.id;

      if (!targetAttemptId) {
        const createdAttempt = await tx.paymentAttempt.create({
          data: {
            orderId: order.id,
            provider:
              refundMethod === "ORIGINAL_PAYMENT"
                ? order.paymentMethod || "MANUAL_BANK_TRANSFER"
                : refundMethod,
            paymentMethod: order.paymentMethod || "MANUAL",
            status: "CAPTURED",
            amountPkr: order.totalPkr,
            currency: order.currency || "PKR",
            attemptKey: `att-refund-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
            capturedAt: new Date(),
            capturedAmountPkr: order.totalPkr,
          },
        });
        targetAttemptId = createdAttempt.id;
      }

      // Create Refund record
      const refundId = crypto.randomUUID();
      const refund = await tx.refund.create({
        data: {
          id: refundId,
          paymentAttemptId: targetAttemptId,
          provider: refundMethod,
          amountPkr: refundAmountPkr,
          currency: order.currency || "PKR",
          status: "COMPLETED",
          idempotencyKey: `ref-${Date.now()}-${crypto.randomBytes(6).toString("hex")}`,
          reason: reason.trim(),
          completedAt: new Date(),
        },
      });

      // Update PaymentAttempt refunded tally
      await tx.paymentAttempt.update({
        where: { id: targetAttemptId },
        data: {
          refundedAmountPkr: { increment: refundAmountPkr },
        },
      });

      // Update Order paymentStatus (Full vs Partial)
      const newTotalRefunded = existingRefundsTotal + refundAmountPkr;
      const newPaymentStatus =
        newTotalRefunded >= order.totalPkr ? "REFUNDED" : "PARTIALLY_REFUNDED";

      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: newPaymentStatus,
        },
      });

      // Append immutable OrderAuditLog record
      const auditNote =
        (typeof note === "string" && note.trim()) ||
        `Issued ${refundMethod} refund of PKR ${refundAmountPkr}. Reason: ${reason.trim()}`;

      await tx.orderAuditLog.create({
        data: {
          orderId: order.id,
          action: "ORDER_REFUNDED",
          performedBy: auth.user.email,
          note: auditNote,
          previousStatus: order.orderStatus,
          newStatus: order.orderStatus,
        },
      });

      // Append SecurityAuditLog record with balance details
      await logSecurityEvent(tx, {
        action: "ORDER_REFUNDED",
        entityType: "ORDER",
        entityId: order.id,
        actorId: auth.user.id,
        actorEmail: auth.user.email,
        previousState: {
          orderTotalPkr: order.totalPkr,
          paymentStatus: order.paymentStatus,
          accumulatedRefundsPkr: existingRefundsTotal,
        },
        newState: {
          orderTotalPkr: order.totalPkr,
          paymentStatus: newPaymentStatus,
          accumulatedRefundsPkr: newTotalRefunded,
          refundId: refund.id,
          refundAmountPkr,
          refundMethod,
        },
        reason: reason.trim(),
      });

      return {
        status: 200,
        refund,
        order: updatedOrder,
        remainingBalance: order.totalPkr - newTotalRefunded,
      };
    });

    if ("error" in transactionResult && transactionResult.error) {
      return NextResponse.json(
        { success: false, error: transactionResult.error },
        { status: transactionResult.status }
      );
    }

    return NextResponse.json({
      success: true,
      refund: transactionResult.refund,
      order: transactionResult.order,
      remainingBalance: transactionResult.remainingBalance,
      message: `Refund of PKR ${refundAmountPkr} processed successfully.`,
    });
  } catch (error) {
    console.error("Refund processing error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "REFUND_EXECUTION_FAILED", message: "Failed to execute transactional refund." },
      },
      { status: 500 }
    );
  }
}
