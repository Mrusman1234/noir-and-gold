import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth-guard";
import { adjustVariantStock } from "@/lib/admin-inventory-service";

export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if ("status" in auth) return auth;

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_JSON", message: "Request body must be valid JSON." } },
        { status: 400 }
      );
    }
    const isRecord = typeof body === "object" && body !== null && !Array.isArray(body);
    const payload = isRecord ? body as Record<string, unknown> : {};
    const { productId, variantId, newStock, reason } = payload;

    if (
      typeof productId !== "string" ||
      !productId.trim() ||
      typeof variantId !== "string" ||
      !variantId.trim() ||
      newStock === undefined ||
      reason === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_FIELDS",
            message: "Product ID, variant ID, new stock level, and adjustment reason are required.",
          },
        },
        { status: 400 }
      );
    }

    const res = await adjustVariantStock(
      productId,
      variantId,
      newStock,
      reason,
      auth.user
    );

    if (!res.success) {
      const status = res.code === "NOT_FOUND" ? 404 : res.code === "CONCURRENT_UPDATE" ? 409 : 400;
      return NextResponse.json(
        {
          success: false,
          error: { code: "ADJUSTMENT_FAILED", message: res.error || "Failed to adjust stock." },
        },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      log: res.log,
      message: "Variant stock adjusted and audit trail logged.",
    });
  } catch (error) {
    console.error("Inventory adjust POST error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to adjust stock." } },
      { status: 500 }
    );
  }
}
