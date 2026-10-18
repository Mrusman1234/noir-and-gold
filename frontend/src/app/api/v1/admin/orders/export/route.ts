import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth-guard";
import { prisma } from "@/lib/prisma";

/**
 * Formats a value strictly adhering to RFC-4180 CSV specifications.
 * Encloses text values in double quotes and escapes embedded double quotes as `""`.
 */
function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '""';
  if (typeof val === "number" || typeof val === "boolean") {
    return String(val);
  }
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request, ["ADMIN", "STAFF"]);
  if ("status" in auth) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const paymentMethodFilter = searchParams.get("paymentMethod");
    const paymentStatusFilter = searchParams.get("paymentStatus");
    const orderStatusFilter = searchParams.get("orderStatus") || searchParams.get("status");
    const startDateParam = searchParams.get("startDate") || searchParams.get("from");
    const endDateParam = searchParams.get("endDate") || searchParams.get("to");
    const search = searchParams.get("search")?.trim();

    const where: {
      orderStatus?: string;
      paymentStatus?: string;
      paymentMethod?: { in?: string[]; equals?: string };
      createdAt?: { gte?: Date; lte?: Date };
      OR?: Array<Record<string, unknown>>;
    } = {};

    if (orderStatusFilter && orderStatusFilter !== "ALL") {
      where.orderStatus = orderStatusFilter;
    }

    if (paymentStatusFilter && paymentStatusFilter !== "ALL") {
      where.paymentStatus = paymentStatusFilter;
    }

    if (paymentMethodFilter && paymentMethodFilter !== "ALL") {
      if (paymentMethodFilter === "COD" || paymentMethodFilter === "CASH_ON_DELIVERY") {
        where.paymentMethod = { equals: "CASH_ON_DELIVERY" };
      } else if (paymentMethodFilter === "ONLINE_CARD" || paymentMethodFilter === "CARD") {
        where.paymentMethod = { in: ["ONLINE_CARD", "CARD", "STRIPE"] };
      } else if (paymentMethodFilter === "ONLINE") {
        where.paymentMethod = {
          in: ["ONLINE_CARD", "CARD", "STRIPE", "JAZZCASH", "EASYPAISA", "BANK_TRANSFER"],
        };
      } else {
        where.paymentMethod = { equals: paymentMethodFilter };
      }
    }

    if (startDateParam || endDateParam) {
      where.createdAt = {};
      if (startDateParam) {
        const parsedStart = new Date(startDateParam);
        if (!isNaN(parsedStart.getTime())) {
          where.createdAt.gte = parsedStart;
        }
      }
      if (endDateParam) {
        const parsedEnd = new Date(endDateParam);
        if (!isNaN(parsedEnd.getTime())) {
          // If only YYYY-MM-DD or time is midnight, extend to end-of-day
          if (
            parsedEnd.getUTCHours() === 0 &&
            parsedEnd.getUTCMinutes() === 0 &&
            parsedEnd.getUTCSeconds() === 0
          ) {
            parsedEnd.setHours(23, 59, 59, 999);
          }
          where.createdAt.lte = parsedEnd;
        }
      }
    }

    if (search) {
      where.OR = [
        { orderReference: { contains: search } },
        { customerFullName: { contains: search } },
        { customerPhone: { contains: search } },
        { shippingCity: { contains: search } },
        { courierTrackingNumber: { contains: search } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const headers = [
      "Order Reference",
      "Date (UTC)",
      "Customer Name",
      "Phone",
      "Email",
      "City",
      "Payment Method",
      "Payment Status",
      "Order Status",
      "Items Count",
      "Subtotal (PKR)",
      "Delivery Fee (PKR)",
      "Total (PKR)",
      "Courier",
      "Tracking Number",
    ];

    const rows = orders.map((order) => {
      const itemsCount = order.items.reduce((sum, item) => sum + (item.quantity || 1), 0);

      return [
        escapeCsvField(order.orderReference),
        escapeCsvField(order.createdAt.toISOString()),
        escapeCsvField(order.customerFullName),
        escapeCsvField(order.customerPhone),
        escapeCsvField(order.customerEmail || "N/A"),
        escapeCsvField(order.shippingCity),
        escapeCsvField(order.paymentMethod),
        escapeCsvField(order.paymentStatus),
        escapeCsvField(order.orderStatus),
        escapeCsvField(itemsCount),
        escapeCsvField(order.subtotalPkr),
        escapeCsvField(order.deliveryFeePkr),
        escapeCsvField(order.totalPkr),
        escapeCsvField(order.courierName || "N/A"),
        escapeCsvField(order.courierTrackingNumber || "N/A"),
      ];
    });

    const csvContent = [headers.map(escapeCsvField).join(","), ...rows.map((row) => row.join(","))].join("\r\n");
    const timestamp = Date.now();

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="noir-orders-${timestamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Order CSV export error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "EXPORT_FAILED", message: "Failed to generate CSV export for orders." },
      },
      { status: 500 }
    );
  }
}
