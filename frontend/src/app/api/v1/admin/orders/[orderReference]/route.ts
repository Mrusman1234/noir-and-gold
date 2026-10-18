import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth-guard";
import { getPersistentAdminOrder } from "@/lib/admin-order-read-service";
import { updatePersistentAdminOrder } from "@/lib/admin-order-update-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderReference: string }> }
) {
  const auth = await requireAdminAuth(request);
  if ("status" in auth) return auth;

  try {
    const { orderReference } = await params;
    const order = await getPersistentAdminOrder(orderReference);

    if (!order) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: `Order ${orderReference} not found.` } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Admin order detail API error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch order." } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderReference: string }> }
) {
  const auth = await requireAdminAuth(request);
  if ("status" in auth) return auth;

  const { orderReference } = await params;
  const actor = auth.user;

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

    const result = await updatePersistentAdminOrder(orderReference, body, actor);
    if (!result.success) {
      const status = result.code === "NOT_FOUND"
        ? 404
        : result.code === "INVALID_TRANSITION" || result.code === "CONCURRENT_UPDATE" || result.code === "INVENTORY_CONFLICT"
          ? 409
          : 400;
      return NextResponse.json(
        { success: false, error: { code: result.code, message: result.error } },
        { status }
      );
    }

    return NextResponse.json({ success: true, order: result.order, message: result.message });
  } catch (error) {
    console.error("Order PATCH error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to update order." },
      },
      { status: 500 }
    );
  }
}
