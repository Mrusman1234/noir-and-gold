/**
 * Core Domain & UI Types for NOIR & GOLD Frontend & Order Engine
 * Consistent with docs/architecture.md and docs/component-inventory.md
 */

export type UserRole = "CUSTOMER" | "STAFF" | "ADMIN";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "FAILED_DELIVERY"
  | "RETURNED";

export type PaymentMethod =
  | "CASH_ON_DELIVERY"
  | "JAZZCASH"
  | "EASYPAISA"
  | "BANK_TRANSFER";

export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export type ShippingZoneCode = "LOCAL_KARACHI" | "MAJOR_METROS" | "NATIONWIDE";

export interface ShippingZone {
  id: string;
  code: ShippingZoneCode;
  name: string;
  feePkr: number;
  freeThresholdPkr: number;
  estimatedDays: string;
}

export interface ProductSummary {
  id: string;
  title: string;
  slug: string;
  categoryName: string;
  pricePkr: number;
  salePricePkr?: number | null;
  primaryImageUrl: string;
  hoverImageUrl?: string | null;
  isNew?: boolean;
  isLimited?: boolean;
  isSoldOut?: boolean;
  availableSizes: string[];
  availableColors?: string[];
  audience?: "women" | "men" | "unisex";
  createdAt?: string;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary?: boolean;
}

export interface ProductVariant {
  id: string;
  size: string;
  colorName: string;
  colorHex: string;
  sku: string;
  stock: number;
  pricePkr?: number;
}

export interface ProductDetail extends ProductSummary {
  sku: string;
  description: string;
  details: string[];
  fabric: string;
  careInstructions: string[];
  images: ProductImage[];
  variants: ProductVariant[];
  rating?: number;
  reviewCount?: number;
}

export type ProductSortOption =
  | "featured"
  | "price-asc"
  | "price-desc"
  | "name-asc"
  | "newest";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface CartItem {
  id: string; // Composite unique key: e.g. `${productId}-${size}-${color}`
  productId: string;
  slug: string;
  title: string;
  categoryName: string;
  pricePkr: number;
  originalPricePkr?: number | null;
  imageUrl: string;
  size: string;
  color: string;
  quantity: number;
  maxStock: number;
}

/**
 * Pakistani Domestic Provinces and Administrative Regions
 */
export const PAKISTAN_PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad Capital Territory",
  "Azad Jammu & Kashmir",
  "Gilgit-Baltistan",
] as const;

export type PakistanProvince = (typeof PAKISTAN_PROVINCES)[number];

/**
 * Pakistani Shipping and Customer Information Schema
 */
export interface PakistaniCustomerAddress {
  fullName: string;
  phone: string; // e.g. 03001234567 or +923001234567
  email?: string;
  province: string;
  city: string;
  area: string;
  streetAddress: string;
  postalCode?: string;
  landmark?: string;
  instructions?: string;
}

/**
 * Snapshot of line items preserved at purchase time to ensure historical integrity
 */
export interface OrderItemSnapshot {
  productId: string;
  variantId: string;
  sku: string;
  title: string;
  slug: string;
  categoryName: string;
  size: string;
  color: string;
  unitPricePkr: number;
  quantity: number;
  lineTotalPkr: number;
  imageUrl: string;
}

/**
 * Authoritative Server-Side Order Record
 */
export interface CourierInfo {
  courierName: string; // e.g. "TCS", "Leopards", "Trax", "Call Courier"
  trackingNumber: string;
  dispatchedAt?: string;
}

export interface OrderAuditLog {
  id: string;
  timestamp: string;
  action: string;
  performedBy: string;
  note?: string;
  previousStatus?: OrderStatus;
  newStatus?: OrderStatus;
}

export interface OrderRecord {
  id: string;
  orderReference: string; // e.g. "NG-2026-89412"
  verificationToken: string; // Secure random token to guard guest order access
  customer: PakistaniCustomerAddress;
  items: OrderItemSnapshot[];
  subtotalPkr: number;
  discountTotalPkr: number;
  deliveryFeePkr: number;
  totalPkr: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  courierInfo?: CourierInfo;
  cancellationReason?: string;
  auditLogs?: OrderAuditLog[];
  paymentAttempts?: PaymentAttemptAuditDTO[];
  refunds?: RefundAuditDTO[];
  idempotencyKey?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PaymentEventAuditDTO {
  id: string;
  eventType: string;
  provider: string;
  providerEventId: string;
  processingStatus: string;
  signatureVerified: boolean;
  failureReason?: string | null;
  receivedAt: string;
}

export interface RefundAuditDTO {
  id: string;
  paymentAttemptId?: string;
  amountPkr: number;
  status: string;
  provider: string;
  reason: string;
  requestedAt: string;
  completedAt?: string | null;
}

export interface PaymentAttemptAuditDTO {
  id: string;
  provider: string;
  paymentMethod: string;
  status: string;
  amountPkr: number;
  currency: string;
  providerPaymentId?: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  capturedAt?: string | null;
  createdAt: string;
  events?: PaymentEventAuditDTO[];
  refunds?: RefundAuditDTO[];
}

/** Admin order read DTO. Verification credentials and idempotency keys stay private. */
export type AdminOrderRecord = Omit<OrderRecord, "verificationToken" | "idempotencyKey">;

/** Internal Prisma-shaped record; never expose verificationTokenHash to clients. */
export interface PersistedOrderRecord {
  id: string;
  orderReference: string;
  verificationTokenHash: string;
  idempotencyKey: string;
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
  currency: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  courierName: string | null;
  courierTrackingNumber: string | null;
  dispatchedAt: Date | null;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: PersistedOrderItemRecord[];
  auditLogs: PersistedOrderAuditLogRecord[];
}

/** Order-time fields remain intact if the linked catalog records are deleted. */
export interface PersistedOrderItemRecord {
  id: string;
  orderId: string;
  productId: string;
  variantId: string;
  sku: string;
  productTitle: string;
  productSlug: string;
  categoryName: string;
  size: string;
  color: string;
  imageUrl: string;
  catalogProductId: string | null;
  catalogVariantId: string | null;
  unitPricePkr: number;
  quantity: number;
  lineSubtotalPkr: number;
  discountPkr: number;
  lineTotalPkr: number;
  createdAt: Date;
}

export interface PersistedOrderAuditLogRecord {
  id: string;
  orderId: string;
  timestamp: Date;
  action: string;
  performedBy: string;
  note: string | null;
  previousStatus: OrderStatus | null;
  newStatus: OrderStatus | null;
}

/**
 * Client Checkout Submission Payload
 */
export interface CreateOrderRequestDTO {
  customer: PakistaniCustomerAddress;
  items: Array<{
    productId: string;
    size: string;
    color: string;
    quantity: number;
  }>;
  idempotencyKey?: string;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
}

/**
 * Server Order Creation Response
 */
export interface CreateOrderResponseDTO {
  success: boolean;
  orderReference?: string;
  verificationToken?: string;
  totalPkr?: number;
  message?: string;
  error?: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}

/**
 * Admin User and Session Management
 */
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface AdminSession {
  token: string;
  user: AdminUser;
  expiresAt: string;
}

/**
 * Admin Executive Dashboard KPI Metrics
 */
export interface AdminDashboardMetrics {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalCollectedRevenuePkr: number; // Strictly delivered and collected COD
  pendingRevenuePkr: number; // Potential pipeline revenue awaiting collection
  lowStockVariantCount: number;
  outOfStockVariantCount: number;
  totalProductsCount: number;
}

/**
 * Variant Inventory Item with Product Context
 */
export interface InventoryVariantItem {
  variantId: string;
  productId: string;
  productTitle: string;
  productSlug: string;
  sku: string;
  size: string;
  colorName: string;
  colorHex: string;
  stock: number;
  categoryName: string;
  pricePkr: number;
  status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
}

/**
 * Inventory Audit Log Record
 */
export interface InventoryAuditLogEntry {
  id: string;
  productId: string;
  productTitle: string;
  variantId: string;
  sku: string;
  size: string;
  colorName: string;
  previousStock: number;
  newStock: number;
  adjustmentDelta: number;
  reason: string;
  adjustedBy: string;
  timestamp: string;
}

/**
 * Admin Category Management Model
 */
export interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  audience: "women" | "men" | "unisex";
  isActive: boolean;
  productCount: number;
  createdAt: string;
}

