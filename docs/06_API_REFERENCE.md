# Document 6: Complete API Reference

## 1. Overview & Authentication Standards

The NOIR & GOLD ecosystem exposes two API tiers:
1. **Frontend Next.js Route Handlers:** Serving at `http://localhost:3000/api/v1` (Order checkout, customer lookups, payment webhooks, administrative operations).
2. **Backend Express REST API:** Serving at `http://localhost:5000/api` (Public product catalog and category listings).

### Authentication Headers:
- **Public Endpoints:** No authentication headers required.
- **Admin Endpoints:** Require an authenticated HTTP-Only cookie named `admin-token` or an `Authorization: Bearer <token>` header, plus an `X-Admin-Role: ADMIN | STAFF` header for privileged operations.
- **Payment Webhook:** Requires `x-payment-signature` (HMAC-SHA256) and `x-payment-timestamp` (Unix epoch seconds).

---

## 2. Express Backend Catalog Endpoints (`:5000`)

### 2.1 List All Products
- **Method:** `GET`
- **Path:** `/api/products`
- **Auth Required:** None
- **Query Parameters:**
  - `category` (optional string): Filter by category slug (e.g., `pret`, `formal`).
  - `search` (optional string): Search across garment title and description.
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "count": 1,
    "data": [
      {
        "id": "prod-001",
        "slug": "noir-velvet-sherwani",
        "title": "Noir Velvet Sherwani",
        "pricePkr": 85000,
        "isSoldOut": false,
        "category": { "name": "Formal", "slug": "formal" },
        "variants": [
          { "id": "var-001", "size": "M", "colorName": "Black", "stock": 4, "sku": "NVS-BLK-M" }
        ],
        "images": [
          { "id": "img-001", "url": "/images/products/prod-001-primary.jpg", "isPrimary": true }
        ]
      }
    ]
  }
  ```
- **Curl Example:**
  ```bash
  curl -X GET "http://localhost:5000/api/products?category=formal"
  ```

### 2.2 Get Product by Slug or ID
- **Method:** `GET`
- **Path:** `/api/products/:idOrSlug`
- **Auth Required:** None
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "prod-001",
      "slug": "noir-velvet-sherwani",
      "title": "Noir Velvet Sherwani",
      "fabric": "Pure Handwoven Velvet",
      "pricePkr": 85000,
      "variants": [...]
    }
  }
  ```
- **Error Response (404 Not Found):**
  ```json
  { "success": false, "error": "Product not found" }
  ```
- **Curl Example:**
  ```bash
  curl -X GET "http://localhost:5000/api/products/noir-velvet-sherwani"
  ```

### 2.3 List Categories
- **Method:** `GET`
- **Path:** `/api/categories`
- **Auth Required:** None
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "cat-001",
        "name": "Formal",
        "slug": "formal",
        "_count": { "products": 4 }
      }
    ]
  }
  ```
- **Curl Example:**
  ```bash
  curl -X GET "http://localhost:5000/api/categories"
  ```

---

## 3. Customer Storefront Endpoints (`:3000`)

### 3.1 Place Customer Order
- **Method:** `POST`
- **Path:** `/api/v1/orders`
- **Auth Required:** None (Rate limited: Max 5 orders per 15 min per phone & IP)
- **Request Body:**
  ```json
  {
    "customer": {
      "fullName": "Fatima Ali",
      "email": "fatima@example.com",
      "phone": "+923001234567",
      "shippingAddress": "House 12, Street 4, F-7/2",
      "city": "Islamabad",
      "province": "Islamabad Capital Territory",
      "postalCode": "44000"
    },
    "items": [
      {
        "variantId": "var-001",
        "quantity": 1
      }
    ],
    "paymentMethod": "COD",
    "notes": "Please deliver before 5 PM"
  }
  ```
- **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "order": {
      "id": "ord-2026-9812",
      "orderStatus": "PENDING",
      "paymentStatus": "PENDING",
      "totalAmountPkr": 85000,
      "shippingFeePkr": 0,
      "token": "a1b2c3d4e5f6...",
      "trackingUrl": "/orders/ord-2026-9812?token=a1b2c3d4e5f6..."
    }
  }
  ```
- **Error Response (422 Unprocessable Content):**
  ```json
  {
    "success": false,
    "error": { "code": "INSUFFICIENT_STOCK", "message": "Requested quantity exceeds available stock." }
  }
  ```
- **Curl Example:**
  ```bash
  curl -X POST "http://localhost:3000/api/v1/orders" \
    -H "Content-Type: application/json" \
    -d '{"customer":{"fullName":"Fatima Ali","phone":"+923001234567","shippingAddress":"F-7","city":"Islamabad","province":"Islamabad Capital Territory"},"items":[{"variantId":"var-001","quantity":1}],"paymentMethod":"COD"}'
  ```

### 3.2 Guest Order Status Lookup
- **Method:** `GET`
- **Path:** `/api/v1/orders/:id?token=:token`
- **Auth Required:** Cryptographic HMAC token parameter matching the order
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "order": {
      "id": "ord-2026-9812",
      "orderStatus": "CONFIRMED",
      "courierName": "TCS Express",
      "trackingNumber": "TCS-998822",
      "items": [...]
    }
  }
  ```
- **Error Response (403 Forbidden):**
  ```json
  { "success": false, "error": { "code": "INVALID_TOKEN", "message": "Access denied." } }
  ```
- **Curl Example:**
  ```bash
  curl -X GET "http://localhost:3000/api/v1/orders/ord-2026-9812?token=VALID_HMAC_TOKEN"
  ```

---

## 4. Payment Gateway Webhook (`:3000`)

### 4.1 Payment Gateway Webhook Route
- **Method:** `POST`
- **Path:** `/api/v1/payments/webhook`
- **Auth Required:** HMAC-SHA256 signature verification (`x-payment-signature`)
- **Headers:**
  - `x-payment-signature`: Hex HMAC-SHA256 signature calculated over the raw body
  - `x-payment-timestamp`: Unix epoch seconds (must be within 300 seconds of current time)
- **Request Body:**
  ```json
  {
    "eventType": "payment.captured",
    "orderId": "ord-2026-9812",
    "transactionId": "txn-jazz-9912",
    "amountPkr": 85000,
    "currency": "PKR",
    "status": "PAID"
  }
  ```
- **Success Response (200 OK):**
  ```json
  { "success": true, "processed": true, "orderId": "ord-2026-9812" }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or invalid HMAC signature
  - `408 Request Timeout`: Webhook timestamp older than 300 seconds (replay attack prevention)
  - `500 Internal Server Error`: `PAYMENT_WEBHOOK_SECRET` unset in production (fail-closed)
- **Curl Example:**
  ```bash
  curl -X POST "http://localhost:3000/api/v1/payments/webhook" \
    -H "Content-Type: application/json" \
    -H "x-payment-signature: VALID_HMAC_HEX" \
    -H "x-payment-timestamp: 1776470400" \
    -d '{"eventType":"payment.captured","orderId":"ord-2026-9812","status":"PAID"}'
  ```

---

## 5. Administrative Endpoints (`:3000`)

### 5.1 Admin Session Authentication
- **Method:** `POST`
- **Path:** `/api/v1/admin/auth/login`
- **Auth Required:** None (Rate-limited: Max 5 failed attempts per 15 min per email)
- **Request Body:**
  ```json
  {
    "email": "director@noirandgold.com",
    "password": "atelier-secret-password",
    "secretKey": "master-passphrase"
  }
  ```
- **Success Response (200 OK):**
  - Sets HTTP-Only cookie: `admin-token=<session_token>`
  ```json
  { "success": true, "role": "ADMIN", "user": { "email": "director@noirandgold.com" } }
  ```

### 5.2 Product Mutation & Soft Delete
- **Method:** `PATCH` / `DELETE`
- **Path:** `/api/v1/admin/products/:id`
- **Auth Required:** Valid session (`ADMIN` or `STAFF` role)
- **PATCH Body (Update Garment & Variants):**
  ```json
  {
    "title": "Noir Velvet Sherwani (2026 Edition)",
    "pricePkr": 89000,
    "variants": [
      { "size": "M", "colorName": "Black", "stock": 6, "sku": "NVS-BLK-M-26", "pricePkr": 89000 }
    ]
  }
  ```
- **PATCH Body (Restore Archived Product):**
  ```json
  { "action": "RESTORE" }
  ```
- **DELETE Method (Soft-Delete / Archive):**
  - Sets `deletedAt = new Date()` and `isSoldOut = true`.

### 5.3 Process Refund
- **Method:** `POST`
- **Path:** `/api/v1/admin/orders/:id/refund`
- **Auth Required:** `ADMIN` Role required
- **Request Body:**
  ```json
  {
    "amountPkr": 25000,
    "reason": "Customer requested size cancellation prior to shipping",
    "refundMethod": "GATEWAY"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "refund": {
      "id": "ref-4412",
      "amountPkr": 25000,
      "status": "COMPLETED",
      "remainingRefundablePkr": 60000
    }
  }
  ```
- **Error Response (400 Bad Request):**
  ```json
  {
    "success": false,
    "error": { "code": "CAPACITY_EXCEEDED", "message": "Refund amount exceeds captured order balance." }
  }
  ```

### 5.4 Streaming CSV Financial Export
- **Method:** `GET`
- **Path:** `/api/v1/admin/orders/export?status=ALL&startDate=2026-01-01`
- **Auth Required:** Valid session (`ADMIN` or `STAFF`)
- **Response Headers:**
  - `Content-Type: text/csv; charset=utf-8`
  - `Content-Disposition: attachment; filename="noir-gold-orders-export-...csv"`
- **Response Format:** RFC-4180 streaming CSV output.
