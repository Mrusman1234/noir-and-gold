import { NextRequest, NextResponse } from "next/server";
import {
  createOrder,
  hasExistingOrderByIdempotencyKey,
  validatePakistaniPhone,
} from "@/lib/order-service";
import {
  checkCheckoutRateLimit,
  recordCheckoutOrder,
} from "@/lib/checkout-rate-limit";
import { CreateOrderRequestDTO } from "@/types";

function extractClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }
  return req.headers.get("x-real-ip")?.trim() || "127.0.0.1";
}

export async function POST(req: NextRequest) {
  try {
    let parsedBody: unknown;
    try {
      parsedBody = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: { code: "INVALID_JSON", message: "The order request body must be valid JSON." },
        },
        { status: 400 }
      );
    }
    if (!parsedBody || typeof parsedBody !== "object" || Array.isArray(parsedBody)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_FAILED", message: "The order request body must be an object." },
        },
        { status: 400 }
      );
    }
    const body = parsedBody as CreateOrderRequestDTO;

    // Check optional idempotency header
    const idempotencyHeader = req.headers.get("x-idempotency-key");
    if (idempotencyHeader && !body.idempotencyKey) {
      body.idempotencyKey = idempotencyHeader;
    }

    const idempotencyKey = body.idempotencyKey?.trim();
    const isReplay = await hasExistingOrderByIdempotencyKey(idempotencyKey);

    const clientIp = extractClientIp(req);
    const rawPhone = typeof body.customer?.phone === "string" ? body.customer.phone : "";
    const phoneCheck = validatePakistaniPhone(rawPhone);
    const normalizedPhone = phoneCheck.isValid ? phoneCheck.normalized : undefined;

    // Apply rate limit quota only to new order attempts, never blocking idempotent replays
    if (!isReplay) {
      const rateLimitCheck = checkCheckoutRateLimit({
        ip: clientIp,
        normalizedPhone,
      });

      if (!rateLimitCheck.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: rateLimitCheck.code || "TOO_MANY_ATTEMPTS",
              message:
                rateLimitCheck.message ||
                "Too many checkout attempts. Please wait before placing another order.",
            },
          },
          {
            status: 429,
            headers: rateLimitCheck.retryAfterSeconds
              ? { "Retry-After": String(rateLimitCheck.retryAfterSeconds) }
              : undefined,
          }
        );
      }
    }

    const result = await createOrder(body);

    if (!result.success) {
      const statusCode =
        result.error?.code === "INSUFFICIENT_STOCK" ||
        result.error?.code === "VARIANT_NOT_FOUND" ||
        result.error?.code === "PRODUCT_UNAVAILABLE" ||
        result.error?.code === "IDEMPOTENCY_KEY_REUSED" ||
        result.error?.code === "CONCURRENT_ORDER_CONFLICT"
          ? 409
          : 400;

      return NextResponse.json(result, { status: statusCode });
    }

    // Record the successful order placement against rate limit buckets
    if (!isReplay) {
      recordCheckoutOrder({
        ip: clientIp,
        normalizedPhone,
      });
    }

    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while processing your order. Please try again.",
        },
      },
      { status: 500 }
    );
  }
}
