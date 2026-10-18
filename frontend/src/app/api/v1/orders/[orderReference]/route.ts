import { NextRequest, NextResponse } from "next/server";
import { getVerifiedOrder } from "@/lib/order-service";

interface RouteProps {
  params: Promise<{
    orderReference: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteProps) {
  try {
    const { orderReference } = await params;
    const token = req.nextUrl.searchParams.get("token") || "";

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED_ACCESS",
            message: "A verification token is required to view order details.",
          },
        },
        { status: 401 }
      );
    }

    const order = await getVerifiedOrder(orderReference, token);

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ORDER_NOT_FOUND",
            message: "Order not found or invalid verification token.",
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, order }, { status: 200 });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Unable to retrieve order details.",
        },
      },
      { status: 500 }
    );
  }
}
