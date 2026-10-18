import { AdminOrderRecord, OrderStatus, PaymentMethod, PaymentStatus } from "@/types";
import { prisma } from "@/lib/prisma";

export interface AdminOrderQuery {
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  from?: string;
  to?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export function normalizeAdminOrderPagination(limit?: number, offset?: number) {
  const normalizedLimit = Number.isSafeInteger(limit)
    ? Math.min(100, Math.max(1, limit as number))
    : 50;
  const normalizedOffset = Number.isSafeInteger(offset) && (offset as number) >= 0
    ? offset as number
    : 0;
  return { limit: normalizedLimit, offset: normalizedOffset };
}

function buildWhere(query: AdminOrderQuery) {
  const where: {
    orderStatus?: string;
    paymentStatus?: string;
    paymentMethod?: { in?: string[]; equals?: string };
    createdAt?: { gte?: Date; lte?: Date };
    OR?: Array<Record<string, unknown>>;
  } = {};
  if (query.status && query.status !== "ALL") where.orderStatus = query.status;
  if (query.paymentStatus && query.paymentStatus !== "ALL") {
    where.paymentStatus = query.paymentStatus;
  }
  if (query.paymentMethod && query.paymentMethod !== "ALL") {
    if (query.paymentMethod === "COD") {
      where.paymentMethod = { equals: "CASH_ON_DELIVERY" };
    } else if (query.paymentMethod === "ONLINE") {
      where.paymentMethod = { in: ["JAZZCASH", "EASYPAISA", "BANK_TRANSFER", "STRIPE", "CARD"] };
    } else {
      where.paymentMethod = { equals: query.paymentMethod };
    }
  }
  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) {
      const fromDate = new Date(query.from);
      if (!isNaN(fromDate.getTime())) where.createdAt.gte = fromDate;
    }
    if (query.to) {
      const toDate = new Date(query.to);
      if (!isNaN(toDate.getTime())) {
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }
  }
  const search = query.search?.trim();
  if (search) {
    where.OR = [
      { orderReference: { contains: search } },
      { customerFullName: { contains: search } },
      { customerPhone: { contains: search } },
      { shippingCity: { contains: search } },
      { courierTrackingNumber: { contains: search } },
    ];
  }
  return where;
}

export function mapAdminOrder(order: {
  id: string;
  orderReference: string;
  customerFullName: string;
  customerPhone: string;
  customerEmail: string | null;
  shippingProvince: string;
  shippingCity: string;
  shippingArea: string;
  shippingStreetAddress: string;
  shippingPostalCode: string | null;
  shippingLandmark: string | null;
  shippingInstructions: string | null;
  subtotalPkr: number;
  discountTotalPkr: number;
  deliveryFeePkr: number;
  totalPkr: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  courierName: string | null;
  courierTrackingNumber: string | null;
  dispatchedAt: Date | null;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    productId: string;
    variantId: string;
    sku: string;
    productTitle: string;
    productSlug: string;
    categoryName: string;
    size: string;
    color: string;
    unitPricePkr: number;
    quantity: number;
    lineTotalPkr: number;
    imageUrl: string;
  }>;
  auditLogs: Array<{
    id: string;
    timestamp: Date;
    action: string;
    performedBy: string;
    note: string | null;
    previousStatus: string | null;
    newStatus: string | null;
  }>;
  paymentAttempts?: Array<{
    id: string;
    provider: string;
    paymentMethod: string;
    status: string;
    amountPkr: number;
    currency: string;
    providerPaymentId: string | null;
    failureCode: string | null;
    failureMessage: string | null;
    capturedAt: Date | null;
    createdAt: Date;
    events?: Array<{
      id: string;
      eventType: string;
      provider: string;
      providerEventId: string;
      processingStatus: string;
      signatureVerified: boolean;
      failureReason: string | null;
      receivedAt: Date;
    }>;
    refunds?: Array<{
      id: string;
      paymentAttemptId?: string;
      amountPkr: number;
      currency: string;
      status: string;
      provider: string;
      reason: string;
      requestedAt: Date;
      completedAt: Date | null;
    }>;
  }>;
}): AdminOrderRecord {
  return {
    id: order.id,
    orderReference: order.orderReference,
    customer: {
      fullName: order.customerFullName,
      phone: order.customerPhone,
      email: order.customerEmail ?? undefined,
      province: order.shippingProvince,
      city: order.shippingCity,
      area: order.shippingArea,
      streetAddress: order.shippingStreetAddress,
      postalCode: order.shippingPostalCode ?? undefined,
      landmark: order.shippingLandmark ?? undefined,
      instructions: order.shippingInstructions ?? undefined,
    },
    items: order.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      sku: item.sku,
      title: item.productTitle,
      slug: item.productSlug,
      categoryName: item.categoryName,
      size: item.size,
      color: item.color,
      unitPricePkr: item.unitPricePkr,
      quantity: item.quantity,
      lineTotalPkr: item.lineTotalPkr,
      imageUrl: item.imageUrl,
    })),
    subtotalPkr: order.subtotalPkr,
    discountTotalPkr: order.discountTotalPkr,
    deliveryFeePkr: order.deliveryFeePkr,
    totalPkr: order.totalPkr,
    paymentMethod: order.paymentMethod as PaymentMethod,
    paymentStatus: order.paymentStatus as PaymentStatus,
    orderStatus: order.orderStatus as OrderStatus,
    courierInfo: order.courierName && order.courierTrackingNumber
      ? {
          courierName: order.courierName,
          trackingNumber: order.courierTrackingNumber,
          dispatchedAt: order.dispatchedAt?.toISOString(),
        }
      : undefined,
    cancellationReason: order.cancellationReason ?? undefined,
    auditLogs: order.auditLogs.map((entry) => ({
      id: entry.id,
      timestamp: entry.timestamp.toISOString(),
      action: entry.action,
      performedBy: entry.performedBy,
      note: entry.note ?? undefined,
      previousStatus: (entry.previousStatus as OrderStatus | null) ?? undefined,
      newStatus: (entry.newStatus as OrderStatus | null) ?? undefined,
    })),
    paymentAttempts: order.paymentAttempts?.map((pa) => ({
      id: pa.id,
      provider: pa.provider,
      paymentMethod: pa.paymentMethod,
      status: pa.status,
      amountPkr: pa.amountPkr,
      currency: pa.currency,
      providerPaymentId: pa.providerPaymentId,
      failureCode: pa.failureCode,
      failureMessage: pa.failureMessage,
      capturedAt: pa.capturedAt?.toISOString() || null,
      createdAt: pa.createdAt.toISOString(),
      events: pa.events?.map((ev) => ({
        id: ev.id,
        eventType: ev.eventType,
        provider: ev.provider,
        providerEventId: ev.providerEventId,
        processingStatus: ev.processingStatus,
        signatureVerified: ev.signatureVerified,
        failureReason: ev.failureReason,
        receivedAt: ev.receivedAt.toISOString(),
      })),
      refunds: pa.refunds?.map((rf) => ({
        id: rf.id,
        paymentAttemptId: pa.id,
        amountPkr: rf.amountPkr,
        status: rf.status,
        provider: rf.provider,
        reason: rf.reason,
        requestedAt: rf.requestedAt.toISOString(),
        completedAt: rf.completedAt?.toISOString() || null,
      })),
    })),
    refunds: order.paymentAttempts?.flatMap((pa) =>
      (pa.refunds || []).map((rf) => ({
        id: rf.id,
        paymentAttemptId: pa.id,
        amountPkr: rf.amountPkr,
        status: rf.status,
        provider: rf.provider,
        reason: rf.reason,
        requestedAt: rf.requestedAt.toISOString(),
        completedAt: rf.completedAt?.toISOString() || null,
      }))
    ),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

const adminOrderInclude = {
  items: { orderBy: { createdAt: "asc" as const } },
  auditLogs: { orderBy: { timestamp: "asc" as const } },
};

export const adminOrderDetailInclude = {
  items: { orderBy: { createdAt: "asc" as const } },
  auditLogs: { orderBy: { timestamp: "asc" as const } },
  paymentAttempts: {
    orderBy: { createdAt: "desc" as const },
    include: {
      events: { orderBy: { receivedAt: "desc" as const } },
      refunds: { orderBy: { requestedAt: "desc" as const } },
    },
  },
};

export async function getPersistentAdminOrders(query: AdminOrderQuery = {}): Promise<{
  orders: AdminOrderRecord[];
  total: number;
}> {
  const { limit, offset } = normalizeAdminOrderPagination(query.limit, query.offset);
  const where = buildWhere(query);
  const [total, records] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: adminOrderInclude,
      orderBy: [{ createdAt: "desc" }, { orderReference: "desc" }],
      skip: offset,
      take: limit,
    }),
  ]);
  return { orders: records.map(mapAdminOrder), total };
}

export async function getPersistentAdminOrder(
  identifier: string
): Promise<AdminOrderRecord | null> {
  const order = await prisma.order.findFirst({
    where: {
      OR: [
        { orderReference: identifier },
        { id: identifier },
      ],
    },
    include: adminOrderDetailInclude,
  });
  return order ? mapAdminOrder(order) : null;
}