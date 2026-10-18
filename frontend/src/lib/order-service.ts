import crypto from "crypto";
import {
  PakistaniCustomerAddress,
  OrderRecord,
  CreateOrderRequestDTO,
  CreateOrderResponseDTO,
  PaymentMethod,
} from "@/types";

/**
 * Guest checkout owns the persistent order lifecycle: order creation is written
 * to the database with its inventory decrement in one transaction, admin order
 * reads/updates live in `admin-order-read-service.ts` and
 * `admin-order-update-service.ts`, and guest retrieval requires the HMAC
 * verification token. This module intentionally holds no in-memory order state.
 */
import {
  FREE_SHIPPING_THRESHOLD_PKR,
  ESTIMATED_FLAT_SHIPPING_PKR,
} from "@/lib/constants";
import { prisma } from "./prisma";

export const MAX_LINE_QUANTITY = 5;
export const MAX_ORDER_TOTAL_QUANTITY = 15;

export async function hasExistingOrderByIdempotencyKey(
  idempotencyKey?: string | null
): Promise<boolean> {
  if (!idempotencyKey || typeof idempotencyKey !== "string") return false;
  try {
    const existing = await prisma.order.findUnique({
      where: { idempotencyKey: idempotencyKey.trim() },
      select: { id: true },
    });
    return Boolean(existing);
  } catch {
    return false;
  }
}

/**
 * Validates Pakistani mobile phone numbers.
 * Supported formats:
 * - 03001234567 (11 digits, begins with 03)
 * - +923001234567 (13 characters, begins with +923)
 * - 923001234567 (12 digits, begins with 923)
 * - Allows spaces and hyphens e.g. 0300-1234567
 */
export function validatePakistaniPhone(rawPhone: string): {
  isValid: boolean;
  normalized: string;
  error?: string;
} {
  if (!rawPhone || typeof rawPhone !== "string") {
    return { isValid: false, normalized: "", error: "Phone number is required." };
  }

  // Remove spaces, hyphens, and parentheses
  const cleaned = rawPhone.replace(/[\s\-()]/g, "");

  // Check valid patterns
  const localPattern = /^03\d{9}$/; // 03XXXXXXXXX (11 digits)
  const intlWithPlusPattern = /^\+923\d{9}$/; // +923XXXXXXXXX (13 chars)
  const intlNoPlusPattern = /^923\d{9}$/; // 923XXXXXXXXX (12 digits)

  if (localPattern.test(cleaned)) {
    return { isValid: true, normalized: cleaned };
  }

  if (intlWithPlusPattern.test(cleaned)) {
    // Normalize to standard domestic format: +923001234567 -> 03001234567
    const normalized = "0" + cleaned.slice(3);
    return { isValid: true, normalized };
  }

  if (intlNoPlusPattern.test(cleaned)) {
    // Normalize: 923001234567 -> 03001234567
    const normalized = "0" + cleaned.slice(2);
    return { isValid: true, normalized };
  }

  return {
    isValid: false,
    normalized: cleaned,
    error:
      "Please enter a valid Pakistani mobile number (e.g. 0300-1234567 or +923001234567).",
  };
}

/**
 * Validates optional email format.
 */
export function validateEmail(email?: string): boolean {
  if (!email || !email.trim()) return true; // Optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Sanitizes customer input fields and enforces length limits.
 */
function sanitizeCustomerAddress(
  raw: PakistaniCustomerAddress
): PakistaniCustomerAddress {
  return {
    fullName: (raw.fullName || "").trim().slice(0, 100),
    phone: (raw.phone || "").trim(),
    email: raw.email ? raw.email.trim().slice(0, 150) : undefined,
    province: (raw.province || "").trim().slice(0, 60),
    city: (raw.city || "").trim().slice(0, 60),
    area: (raw.area || "").trim().slice(0, 120),
    streetAddress: (raw.streetAddress || "").trim().slice(0, 250),
    postalCode: raw.postalCode ? raw.postalCode.trim().slice(0, 15) : undefined,
    landmark: raw.landmark ? raw.landmark.trim().slice(0, 150) : undefined,
    instructions: raw.instructions ? raw.instructions.trim().slice(0, 500) : undefined,
  };
}

interface NormalizedOrderLine {
  productId: string;
  size: string;
  color: string;
  quantity: number;
}

interface NormalizedCreateOrderRequest {
  customer: PakistaniCustomerAddress;
  items: NormalizedOrderLine[];
  idempotencyKey: string;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
}

class OrderServiceError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly fields?: Record<string, string>
  ) {
    super(message);
    this.name = "OrderServiceError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeCreateOrderRequest(payload: unknown): NormalizedCreateOrderRequest {
  if (!isRecord(payload) || !isRecord(payload.customer)) {
    throw new OrderServiceError(
      "VALIDATION_FAILED",
      "Please provide valid customer and delivery details.",
      { fullName: "Customer details are required." }
    );
  }

  const rawCustomer = payload.customer;
  const fieldErrors: Record<string, string> = {};
  const requiredFields = [
    "fullName",
    "phone",
    "province",
    "city",
    "area",
    "streetAddress",
  ] as const;
  const optionalFields = ["email", "postalCode", "landmark", "instructions"] as const;

  for (const field of requiredFields) {
    if (typeof rawCustomer[field] !== "string") {
      fieldErrors[field] = "This field is required.";
    }
  }
  for (const field of optionalFields) {
    const value = rawCustomer[field];
    if (value !== undefined && value !== null && typeof value !== "string") {
      fieldErrors[field] = "This field must be text.";
    }
  }
  if (Object.keys(fieldErrors).length > 0) {
    throw new OrderServiceError(
      "VALIDATION_FAILED",
      "Please correct the highlighted errors in your customer details.",
      fieldErrors
    );
  }

  const customerInput: PakistaniCustomerAddress = {
    fullName: rawCustomer.fullName as string,
    phone: rawCustomer.phone as string,
    province: rawCustomer.province as string,
    city: rawCustomer.city as string,
    area: rawCustomer.area as string,
    streetAddress: rawCustomer.streetAddress as string,
    email: typeof rawCustomer.email === "string" ? rawCustomer.email : undefined,
    postalCode: typeof rawCustomer.postalCode === "string" ? rawCustomer.postalCode : undefined,
    landmark: typeof rawCustomer.landmark === "string" ? rawCustomer.landmark : undefined,
    instructions: typeof rawCustomer.instructions === "string" ? rawCustomer.instructions : undefined,
  };
  const customer = sanitizeCustomerAddress(customerInput);

  if (customer.fullName.length < 3) {
    fieldErrors.fullName = "Please enter your full name (minimum 3 characters).";
  }
  const phoneCheck = validatePakistaniPhone(customer.phone);
  if (!phoneCheck.isValid) {
    fieldErrors.phone = phoneCheck.error || "Invalid mobile number.";
  } else {
    customer.phone = phoneCheck.normalized;
  }
  if (customer.email && !validateEmail(customer.email)) {
    fieldErrors.email = "Please enter a valid email address.";
  }
  if (!customer.province) fieldErrors.province = "Please select your province or region.";
  if (customer.city.length < 2) fieldErrors.city = "Please enter your delivery city.";
  if (customer.area.length < 2) fieldErrors.area = "Please specify your delivery area.";
  if (customer.streetAddress.length < 5) {
    fieldErrors.streetAddress = "Please provide your complete street address.";
  }
  if (Object.keys(fieldErrors).length > 0) {
    throw new OrderServiceError(
      "VALIDATION_FAILED",
      "Please correct the highlighted errors in your customer details.",
      fieldErrors
    );
  }

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    throw new OrderServiceError("EMPTY_CART", "Cannot create an order with an empty shopping bag.");
  }

  const linesByKey = new Map<string, NormalizedOrderLine>();
  for (const [index, rawLine] of payload.items.entries()) {
    if (!isRecord(rawLine) || typeof rawLine.productId !== "string" ||
      typeof rawLine.size !== "string" || typeof rawLine.color !== "string") {
      throw new OrderServiceError(
        "VALIDATION_FAILED",
        "One or more order lines are malformed.",
        { items: `Order line ${index + 1} must include product, size, color, and quantity.` }
      );
    }
    if (typeof rawLine.quantity !== "number" || !Number.isSafeInteger(rawLine.quantity) || rawLine.quantity <= 0) {
      throw new OrderServiceError(
        "INVALID_QUANTITY",
        `Quantity for order line ${index + 1} must be a positive integer.`,
        { quantity: `Order line ${index + 1} must have a positive whole-number quantity.` }
      );
    }
    if (rawLine.quantity > MAX_LINE_QUANTITY) {
      throw new OrderServiceError(
        "QUANTITY_LIMIT_EXCEEDED",
        `Quantity for order line ${index + 1} exceeds the limit of ${MAX_LINE_QUANTITY} units per garment.`,
        { quantity: `Maximum ${MAX_LINE_QUANTITY} units allowed per garment line.` }
      );
    }
    const line = {
      productId: rawLine.productId.trim(),
      size: rawLine.size.trim(),
      color: rawLine.color.trim(),
      quantity: rawLine.quantity,
    };
    if (!line.productId || !line.size || !line.color) {
      throw new OrderServiceError("VALIDATION_FAILED", "Order lines require product, size, and color.");
    }
    const key = `${line.productId.toLowerCase()}\u0000${line.size.toLowerCase()}\u0000${line.color.toLowerCase()}`;
    const existing = linesByKey.get(key);
    if (existing) {
      const combinedQuantity = existing.quantity + line.quantity;
      if (!Number.isSafeInteger(combinedQuantity)) {
        throw new OrderServiceError("INVALID_QUANTITY", "Combined quantity exceeds the supported range.");
      }
      if (combinedQuantity > MAX_LINE_QUANTITY) {
        throw new OrderServiceError(
          "QUANTITY_LIMIT_EXCEEDED",
          `Combined quantity for this garment exceeds the limit of ${MAX_LINE_QUANTITY} units.`,
          { quantity: `Maximum ${MAX_LINE_QUANTITY} units allowed per garment line.` }
        );
      }
      existing.quantity = combinedQuantity;
    } else {
      linesByKey.set(key, line);
    }
  }

  let totalGarments = 0;
  for (const line of linesByKey.values()) {
    totalGarments += line.quantity;
  }
  if (totalGarments > MAX_ORDER_TOTAL_QUANTITY) {
    throw new OrderServiceError(
      "QUANTITY_LIMIT_EXCEEDED",
      `Total order quantity (${totalGarments}) exceeds the maximum limit of ${MAX_ORDER_TOTAL_QUANTITY} garments for guest Cash on Delivery.`,
      { items: `Maximum ${MAX_ORDER_TOTAL_QUANTITY} garments allowed per order.` }
    );
  }

  const rawIdempotencyKey = payload.idempotencyKey;
  if (rawIdempotencyKey !== undefined && rawIdempotencyKey !== null && typeof rawIdempotencyKey !== "string") {
    throw new OrderServiceError("VALIDATION_FAILED", "The idempotency key must be text.");
  }
  const idempotencyKey = typeof rawIdempotencyKey === "string" && rawIdempotencyKey.trim()
    ? rawIdempotencyKey.trim()
    : crypto.randomBytes(32).toString("hex");
  if (idempotencyKey.length > 200) {
    throw new OrderServiceError("VALIDATION_FAILED", "The idempotency key is too long.");
  }

  const rawMethod = (payload as Record<string, unknown>).paymentMethod;
  let paymentMethod: PaymentMethod = "CASH_ON_DELIVERY";
  if (typeof rawMethod === "string") {
    const upper = rawMethod.trim().toUpperCase();
    if (upper === "JAZZCASH" || upper === "EASYPAISA" || upper === "BANK_TRANSFER") {
      paymentMethod = upper as PaymentMethod;
    } else if (upper === "CASH_ON_DELIVERY") {
      paymentMethod = "CASH_ON_DELIVERY";
    }
  }

  const rawRef = (payload as Record<string, unknown>).paymentReference;
  const paymentReference = typeof rawRef === "string" && rawRef.trim() ? rawRef.trim().slice(0, 120) : undefined;

  return { customer, items: [...linesByKey.values()], idempotencyKey, paymentMethod, paymentReference };
}

export const validateOrderInput = normalizeCreateOrderRequest;

function getVerificationSecret(): Buffer {
  const secret = process.env.ORDER_VERIFICATION_SECRET;
  if (!secret || !/^[a-f0-9]{64}$/i.test(secret)) {
    throw new Error("ORDER_VERIFICATION_SECRET must be configured as 32 random bytes encoded in hex.");
  }
  return Buffer.from(secret, "hex");
}

function createVerificationToken(orderId: string, idempotencyKey: string): string {
  const digest = crypto
    .createHmac("sha256", getVerificationSecret())
    .update(`noir-gold-order-verification:v1:${orderId}:${idempotencyKey}`)
    .digest("base64url");
  return `v1.${digest}`;
}

function hashVerificationToken(token: string): string {
  return `v1:${crypto.createHash("sha256").update(token).digest("hex")}`;
}

function verificationTokenMatches(storedHash: string, token: string): boolean {
  const parts = /^v1\.([A-Za-z0-9_-]{43})$/.exec(token);
  const storedParts = /^v1:([a-f0-9]{64})$/i.exec(storedHash);
  if (!parts || !storedParts) return false;
  const actual = Buffer.from(crypto.createHash("sha256").update(token).digest("hex"), "hex");
  const expected = Buffer.from(storedParts[1], "hex");
  return crypto.timingSafeEqual(actual, expected);
}

/**
 * Generates an authentic human-readable order reference: e.g. "NG-2026-78421"
 */
function generateOrderReference(): string {
  const currentYear = new Date().getFullYear();
  const randomSuffix = crypto.randomInt(10000, 100000);
  return `NG-${currentYear}-${randomSuffix}`;
}

type ExistingOrderForReplay = Awaited<ReturnType<typeof prisma.order.findUnique>> & {
  items?: Array<{
    productId: string;
    productSlug: string;
    size: string;
    color: string;
    quantity: number;
  }>;
};

function orderMatchesRequest(
  order: NonNullable<ExistingOrderForReplay>,
  request: NormalizedCreateOrderRequest
): boolean {
  const customerMatches =
    order.customerFullName === request.customer.fullName &&
    order.customerPhone === request.customer.phone &&
    (order.customerEmail ?? undefined) === request.customer.email &&
    order.shippingProvince === request.customer.province &&
    order.shippingCity === request.customer.city &&
    order.shippingArea === request.customer.area &&
    order.shippingStreetAddress === request.customer.streetAddress &&
    (order.shippingPostalCode ?? undefined) === request.customer.postalCode &&
    (order.shippingLandmark ?? undefined) === request.customer.landmark &&
    (order.shippingInstructions ?? undefined) === request.customer.instructions;
  if (!customerMatches || !order.items) return false;

  const unmatched = [...order.items];
  for (const requested of request.items) {
    const index = unmatched.findIndex((stored) =>
      (stored.productId.toLowerCase() === requested.productId.toLowerCase() ||
        stored.productSlug.toLowerCase() === requested.productId.toLowerCase()) &&
      stored.size.toLowerCase() === requested.size.toLowerCase() &&
      stored.color.toLowerCase() === requested.color.toLowerCase() &&
      stored.quantity === requested.quantity
    );
    if (index === -1) return false;
    unmatched.splice(index, 1);
  }
  return unmatched.length === 0;
}

function buildCreateOrderResponse(
  order: NonNullable<ExistingOrderForReplay>,
  request: NormalizedCreateOrderRequest
): CreateOrderResponseDTO {
  if (!orderMatchesRequest(order, request)) {
    throw new OrderServiceError(
      "IDEMPOTENCY_KEY_REUSED",
      "This idempotency key was already used for a different order request."
    );
  }

  const verificationToken = createVerificationToken(order.id, request.idempotencyKey);
  if (!verificationTokenMatches(order.verificationTokenHash, verificationToken)) {
    throw new Error("The verification secret does not match the key used for this order.");
  }

  return {
    success: true,
    orderReference: order.orderReference,
    verificationToken,
    totalPkr: order.totalPkr,
    message: "Order previously processed successfully.",
  };
}

function serviceFailure(error: unknown): CreateOrderResponseDTO {
  if (error instanceof OrderServiceError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.fields ? { fields: error.fields } : {}),
      },
    };
  }
  return {
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "Unable to process the order. Please try again.",
    },
  };
}

/** Creates a guest order and reserves its inventory in one database transaction. */
export async function createOrder(payload: CreateOrderRequestDTO): Promise<CreateOrderResponseDTO> {
  let request: NormalizedCreateOrderRequest;
  try {
    request = normalizeCreateOrderRequest(payload);
    getVerificationSecret();
  } catch (error) {
    return serviceFailure(error);
  }

  for (let referenceAttempt = 0; referenceAttempt < 3; referenceAttempt++) {
    const orderId = crypto.randomUUID();
    const orderReference = generateOrderReference();
    const verificationToken = createVerificationToken(orderId, request.idempotencyKey);
    const verificationTokenHash = hashVerificationToken(verificationToken);

    try {
      return await prisma.$transaction(async (transaction) => {
        const existing = await transaction.order.findUnique({
          where: { idempotencyKey: request.idempotencyKey },
          include: { items: true },
        });
        if (existing) return buildCreateOrderResponse(existing, request);

        const itemSnapshots: Array<{
          productId: string;
          variantId: string;
          sku: string;
          productTitle: string;
          productSlug: string;
          categoryName: string;
          size: string;
          color: string;
          imageUrl: string;
          catalogProductId: string;
          catalogVariantId: string;
          unitPricePkr: number;
          quantity: number;
          lineSubtotalPkr: number;
          discountPkr: number;
          lineTotalPkr: number;
        }> = [];
        let subtotalPkr = 0;
        let discountTotalPkr = 0;

        for (const requested of request.items) {
          const product = await transaction.product.findFirst({
            where: {
              status: "PUBLISHED",
              OR: [{ id: requested.productId }, { slug: requested.productId }],
            },
            include: {
              category: { select: { name: true } },
              variants: { where: { isActive: true } },
            },
          });

          if (!product) {
            throw new OrderServiceError(
              "PRODUCT_UNAVAILABLE",
              "One or more selected garments are no longer available in the catalog."
            );
          }

          const variant = product.variants.find(
            (candidate) =>
              candidate.size.toLowerCase() === requested.size.toLowerCase() &&
              candidate.colorName.toLowerCase() === requested.color.toLowerCase()
          );
          if (!variant) {
            throw new OrderServiceError(
              "VARIANT_NOT_FOUND",
              `Variant (${requested.size} / ${requested.color}) for "${product.title}" is not available.`
            );
          }

          const unitPricePkr = Math.round(product.pricePkr);
          if (!Number.isSafeInteger(unitPricePkr) || unitPricePkr < 0) {
            throw new OrderServiceError("PRODUCT_UNAVAILABLE", "A selected garment has an invalid price.");
          }
          const comparisonPricePkr = product.salePricePkr === null
            ? null
            : Math.round(product.salePricePkr);
          const discountPkr = comparisonPricePkr !== null && comparisonPricePkr > unitPricePkr
            ? (comparisonPricePkr - unitPricePkr) * requested.quantity
            : 0;
          const lineTotalPkr = unitPricePkr * requested.quantity;
          if (!Number.isSafeInteger(lineTotalPkr) || !Number.isSafeInteger(discountPkr)) {
            throw new OrderServiceError("INVALID_QUANTITY", "The order amount exceeds the supported range.");
          }

          const stockUpdate = await transaction.productVariant.updateMany({
            where: {
              id: variant.id,
              productId: product.id,
              isActive: true,
              stockQuantity: { gte: requested.quantity },
            },
            data: { stockQuantity: { decrement: requested.quantity } },
          });
          if (stockUpdate.count !== 1) {
            throw new OrderServiceError(
              "INSUFFICIENT_STOCK",
              `Insufficient inventory for "${product.title}" (${variant.size} • ${variant.colorName}). Please review available stock.`
            );
          }

          subtotalPkr += lineTotalPkr;
          discountTotalPkr += discountPkr;
          if (!Number.isSafeInteger(subtotalPkr) || !Number.isSafeInteger(discountTotalPkr)) {
            throw new OrderServiceError("INVALID_QUANTITY", "The order amount exceeds the supported range.");
          }
          itemSnapshots.push({
            productId: product.id,
            variantId: variant.id,
            sku: variant.sku,
            productTitle: product.title,
            productSlug: product.slug,
            categoryName: product.category.name,
            size: variant.size,
            color: variant.colorName,
            imageUrl: product.primaryImageUrl,
            catalogProductId: product.id,
            catalogVariantId: variant.id,
            unitPricePkr,
            quantity: requested.quantity,
            lineSubtotalPkr: lineTotalPkr,
            discountPkr,
            // pricePkr is already the payable price; comparison savings are display-only.
            lineTotalPkr,
          });
        }

        const deliveryFeePkr = subtotalPkr >= FREE_SHIPPING_THRESHOLD_PKR
          ? 0
          : ESTIMATED_FLAT_SHIPPING_PKR;
        const totalPkr = subtotalPkr + deliveryFeePkr;
        if (!Number.isSafeInteger(totalPkr)) {
          throw new OrderServiceError("INVALID_QUANTITY", "The order total exceeds the supported range.");
        }

        await transaction.order.create({
          data: {
            id: orderId,
            orderReference,
            verificationTokenHash,
            idempotencyKey: request.idempotencyKey,
            customerFullName: request.customer.fullName,
            customerPhone: request.customer.phone,
            customerEmail: request.customer.email ?? null,
            shippingProvince: request.customer.province,
            shippingCity: request.customer.city,
            shippingArea: request.customer.area,
            shippingStreetAddress: request.customer.streetAddress,
            shippingPostalCode: request.customer.postalCode ?? null,
            shippingLandmark: request.customer.landmark ?? null,
            shippingInstructions: request.customer.instructions ?? null,
            subtotalPkr,
            discountTotalPkr,
            deliveryFeePkr,
            totalPkr,
            currency: "PKR",
            paymentMethod: request.paymentMethod,
            paymentStatus: "PENDING",
            orderStatus: "PENDING",
            items: { create: itemSnapshots },
            auditLogs: {
              create: {
                action: "ORDER_CREATED",
                performedBy: "Customer Checkout",
                note: request.paymentReference
                  ? `Order placed via ${request.paymentMethod}. Transaction Ref: ${request.paymentReference}`
                  : `Order placed via ${request.paymentMethod}.`,
                newStatus: "PENDING",
              },
            },
          },
        });

        return {
          success: true,
          orderReference,
          verificationToken,
          totalPkr,
          message: "Your Cash on Delivery order has been successfully placed.",
        };
      });
    } catch (error) {
      try {
        const existing = await prisma.order.findUnique({
          where: { idempotencyKey: request.idempotencyKey },
          include: { items: true },
        });
        if (existing) return buildCreateOrderResponse(existing, request);
      } catch (lookupError) {
        return serviceFailure(lookupError);
      }

      const prismaError = error as { code?: string; meta?: { target?: unknown } };
      if (prismaError?.code === "P2002") {
        const target = JSON.stringify(prismaError.meta?.target ?? "");
        if (target.includes("orderReference") || target.includes("verificationTokenHash")) {
          continue;
        }
      }
      if (prismaError?.code === "P1008" || prismaError?.code === "P2034") {
        return serviceFailure(new OrderServiceError(
          "CONCURRENT_ORDER_CONFLICT",
          "Inventory changed while processing the order. Please retry checkout."
        ));
      }
      return serviceFailure(error);
    }
  }

  return serviceFailure(new OrderServiceError("INTERNAL_ERROR", "Unable to allocate a unique order reference."));
}

function mapPersistedOrder(order: {
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
}, verificationToken: string): OrderRecord {
  return {
    id: order.id,
    orderReference: order.orderReference,
    verificationToken,
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
    paymentMethod: order.paymentMethod as OrderRecord["paymentMethod"],
    paymentStatus: order.paymentStatus as OrderRecord["paymentStatus"],
    orderStatus: order.orderStatus as OrderRecord["orderStatus"],
    courierInfo: order.courierName && order.courierTrackingNumber
      ? {
          courierName: order.courierName,
          trackingNumber: order.courierTrackingNumber,
          dispatchedAt: order.dispatchedAt?.toISOString(),
        }
      : undefined,
    cancellationReason: order.cancellationReason ?? undefined,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

/** Retrieves a guest order only after validating the versioned token hash. */
export async function getVerifiedOrder(
  orderReference: string,
  token: string
): Promise<OrderRecord | null> {
  if (!orderReference || !token) return null;
  const order = await prisma.order.findUnique({
    where: { orderReference },
    include: { items: { orderBy: { createdAt: "asc" } } },
  });
  if (!order || !verificationTokenMatches(order.verificationTokenHash, token)) return null;
  return mapPersistedOrder(order, token);
}
