import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth-guard";
import { getPersistentAdminOrders } from "@/lib/admin-order-read-service";

function parseIntegerParam(value: string | null): number | undefined {
  if (value === null || !/^\d+$/.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if ("status" in auth) return auth;

  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") || "ALL";
    const paymentStatus = searchParams.get("paymentStatus") || "ALL";
    const paymentMethod = searchParams.get("paymentMethod") || "ALL";
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;
    const search = searchParams.get("search") || "";
    const limit = parseIntegerParam(searchParams.get("limit"));
    const offset = parseIntegerParam(searchParams.get("offset"));

    const result = await getPersistentAdminOrders({
      status,
      paymentStatus,
      paymentMethod,
      from,
      to,
      search,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      orders: result.orders,
      total: result.total,
    });
  } catch (error) {
    console.error("Admin orders list API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to fetch orders." },
      },
      { status: 500 }
    );
  }
}
