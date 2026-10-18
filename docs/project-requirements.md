# Project Requirements Specification

**Project:** NOIR & GOLD — Luxury Apparel E-Commerce Store  
**Target Market:** Pakistan  
**Document Version:** 1.0.0  
**Status:** Approved for Architecture & Implementation Planning  
**Date:** October 2026  

---

## 1. Executive Summary & Brand Identity

### 1.1 Brand Overview
- **Working Brand Name:** NOIR & GOLD (designed with complete brand-token isolation to allow frictionless rebranding to an alternative brand name at any time without database refactoring).
- **Core Market Positioning:** High-end boutique fashion and pret wear, offering curated ready-to-wear, formal, and contemporary fusion apparel for discerning customers.
- **Aesthetic Core:** Dark luxury, editorial photography, moody obsidian and deep-purple backdrops, restrained gold accents, sharp architectural typography, and responsive mobile-first performance.

### 1.2 Target Audience & Market Profile
- **Geography:** Urban Pakistan (Primary tier: Karachi, Lahore, Islamabad, Rawalpindi; Secondary tier: Faisalabad, Multan, Peshawar, Sialkot, Gujranwala, Quetta).
- **Demographics:** Men and women aged 20–48; fashion-conscious professionals, wedding attendees, and luxury lifestyle shoppers.
- **Device Usage:** Predominantly mobile devices (78%+ expected mobile traffic) on Pakistani mobile networks (4G/LTE) and home fiber broadband.
- **Currency & Purchasing Habit:** Pakistani Rupee (PKR). High preference for Cash on Delivery (COD) as the primary transaction mechanism for luxury online purchases due to regional trust factors.

---

## 2. Functional Requirements

### 2.1 Customer Storefront

#### 2.1.1 Catalog & Navigation
- **Hierarchy:** Primary divisions (Men, Women), primary categories (e.g., Pret, Formal, Festive, Luxury Casual, Outerwear, Accessories), and subcategories.
- **Curated Collections:** Themed campaign collections (e.g., "Velvet Nocturne 2026", "Gold Edit", "Silk Monolith") capable of grouping products across categories.
- **Search & Discovery:**
  - Fast keyword search across product titles, descriptions, categories, and tags.
  - Faceted filtering: Category, Subcategory, Size (XS, S, M, L, XL, Custom), Color, Price Range (PKR minimum to maximum), and In-Stock toggle.
  - Sorting: Newest Arrivals, Price: Low to High, Price: High to Low, Best Sellers.
  - Pagination: Clean page-based pagination with total results count and items-per-page selector.

#### 2.1.2 Product Details Experience
- **Media Presentation:** Multi-angle high-resolution gallery with primary viewport, thumbnail carousel, zoom/pan capability, and responsive srcset.
- **Variant Matrix Selection:**
  - Interactive color swatch selector with image gallery synchronization.
  - Size selector with real-time stock availability check.
  - Dynamic SKU and inventory count badge ("In Stock", "Only 2 items left", "Sold Out").
- **Product Information:**
  - Editorial description, fabric composition (e.g., Raw Silk, Pure Velvet, Egyptian Cotton), embellishment details, and care/wash instructions.
  - Interactive Size Guide modal displaying measurements in both inches and centimeters (Chest, Waist, Hips, Length, Shoulders).
  - Recommended & Related Products carousel.

#### 2.1.3 Cart & Wishlist
- **Cart Management:**
  - Persistent cart state for guests (browser storage) and synchronized database cart for authenticated users.
  - Slide-over cart drawer accessible from any page, plus a dedicated full cart page.
  - Real-time quantity adjustments with immediate inventory validation (cannot exceed available stock).
  - Order subtotal calculation in PKR with estimated shipping charges.
- **Wishlist:**
  - One-click wishlist toggle on product cards and product details.
  - Persistent saved items list with direct "Move to Cart" action.

#### 2.1.4 Customer Account & Identity
- **Authentication:**
  - Registration with full name, email address, Pakistani phone number (`+92 3XX XXXXXXX`), and password.
  - Secure login with email and password; session management via secure HttpOnly cookies.
  - Password reset via tokenized email link.
- **Account Dashboard:**
  - Profile overview and personal information editing.
  - Address Book: Manage multiple Pakistani shipping addresses (Label, Recipient Name, Phone Number, Street Address, Nearest Landmark, City, Province, Postal Code).
  - Order History: Tabulated order records with date, order ID, status badge, PKR total, and detailed breakdown.
  - Order Detail View: Itemized invoice, shipping destination, tracking updates, and delivery status.

#### 2.1.5 Checkout & Order Placement (Cash on Delivery)
- **Pakistani Address Validation:**
  - Mandatory contact phone number validated against Pakistani mobile operator prefixes (`0300`-`0349`).
  - Nearest Landmark field (critical for Pakistani courier dispatch and last-mile delivery accuracy).
  - Structured City selection with automatic shipping zone rate lookup.
  - Province selection (Sindh, Punjab, Khyber Pakhtunkhwa, Balochistan, Islamabad Capital Territory, Azad Jammu & Kashmir, Gilgit-Baltistan).
- **Shipping Calculation:**
  - Dynamic delivery charge calculation based on destination zone:
    - Same City (e.g., Karachi Local: Flat PKR 200).
    - Major Metropolitans (Lahore, Islamabad/Rawalpindi: Flat PKR 300).
    - Nationwide / Rest of Pakistan: Flat PKR 400.
    - Free shipping threshold (e.g., Orders above PKR 7,500 qualify for free delivery).
- **Payment Method:**
  - Cash on Delivery (COD) as the default and initial payment method.
  - Clear COD disclosure: "Pay cash to the courier representative upon delivery of your parcel."
- **Order Confirmation:**
  - Atomic database transaction creating the order, locking inventory, and generating a unique human-friendly order identifier (e.g., `NG-2026-10492`).
  - Clear order success screen with printable summary, order number, delivery timeline estimate (3–5 business days), and customer support contact details.
  - Public order tracking interface: Query status via Order ID and Phone Number/Email without requiring full account login.

#### 2.1.6 Promotions & Static Content
- **Coupons:**
  - Coupon code entry field in cart and checkout.
  - Support for percentage discounts (e.g., 10% off) or flat PKR deductions (e.g., PKR 1,000 off).
  - Validation rules: Expiration date, minimum order spend, per-user limits, and overall usage limits.
- **Content Pages:**
  - Return & Exchange Policy (standard 7-day Pakistani boutique inspection and exchange terms).
  - Shipping & Delivery Timeline guide.
  - Size Chart & Measurement Guide.
  - About NOIR & GOLD brand story.
  - Contact Us page with direct inquiry form, WhatsApp link, and customer care email.

---

### 2.2 Admin Dashboard

#### 2.2.1 Secure Access & Overview
- **Authentication:** Dedicated admin login route with role-based authorization guard (`ADMIN`, `STAFF`).
- **Executive Metrics:**
  - Total Sales (PKR) over selectable date ranges (Today, This Week, This Month, All Time).
  - Order metrics: Total Orders, Pending Confirmation, Out for Delivery, Delivered, Cancelled.
  - Inventory alerts: Critical low-stock and out-of-stock items requiring replenishment.
  - Recent order feed with one-click drill-down.

#### 2.2.2 Catalog Management
- **Category & Subcategory Management:**
  - Create, update, reorder, and deactivate categories.
  - Upload banner imagery and set SEO slugs and descriptions.
- **Product Management:**
  - Create and edit products with title, slug, rich-text description, care instructions, and categories.
  - Multi-image management: Upload, rearrange order, set primary thumbnail, delete.
  - Variant Matrix Generator: Define colors and sizes, automatically generating unique SKUs with individual pricing, sale price, and stock levels.
  - Product status toggles: Draft, Published, Archived.

#### 2.2.3 Inventory Management
- **Stock Tracking:** Real-time stock levels per variant SKU.
- **Stock Adjustments:** Quick inline increment/decrement with required audit note (e.g., "Stock intake from factory", "Damaged in transit", "Physical inventory count adjustment").
- **Inventory Audit Log:** Chronological record of all stock adjustments, indicating user, timestamp, SKU, and variance.

#### 2.2.4 Order Fulfillment & Status Workflow
- **Order Management Screen:** Filter orders by status, date range, shipping zone, and search by customer name, phone number, or Order ID.
- **Order Lifecycle States:**
  1. `PENDING` (New COD order placed, awaiting store review)
  2. `CONFIRMED` (Order confirmed via phone call or automated verification)
  3. `PROCESSING` (Packed in warehouse, ready for dispatch)
  4. `SHIPPED` (Handed over to courier; tracking ID and courier name assigned)
  5. `DELIVERED` (Courier completed delivery and collected cash)
  6. `CANCELLED` (Customer requested cancellation or customer unreachable)
  7. `FAILED_DELIVERY` (Courier returned parcel after multiple failed delivery attempts)
  8. `RETURNED` (Item returned and verified at warehouse)
- **Fulfillment Operations:**
  - Assign courier partner name (e.g., TCS, Trax, Leopards, Call Courier) and manual Tracking Consignment Number.
  - Internal order notes visible only to staff.
  - Printable standardized Packing Slip and Invoice.

#### 2.2.5 Customer Directory & Promotions
- **Customer Directory:** View customer accounts, total orders placed, lifetime spend (PKR), default shipping address, and order history.
- **Coupon Manager:** Create, update, and deactivate promo codes with validity periods, discount types, minimum order spend, and usage caps.
- **Shipping Zones Configuration:** Manage delivery zones, flat shipping fees per zone, and free-shipping order thresholds.
- **Audit Logs:** System activity log recording critical administrative operations (price modifications, order cancellations, stock overrides).

---

## 3. Non-Functional Requirements

### 3.1 Performance & Responsiveness
- **Page Load Times:** Core Web Vitals target: Largest Contentful Paint (LCP) < 2.5s, Interaction to Next Paint (INP) < 200ms, Cumulative Layout Shift (CLS) < 0.1 on 4G networks.
- **Rendering Strategy:** Server-Side Rendering (SSR) or Incremental Static Regeneration (ISR) for high-traffic public catalog pages; Client-Side Rendering (CSR) for interactive dynamic elements (cart, checkout, admin forms).
- **Image Optimization:** Automated responsive image delivery via Next.js Image component with modern WebP/AVIF formatting, responsive sizes, and explicit aspect ratios to prevent layout shifts.

### 3.2 Security & Data Protection
- **Session Management:** JSON Web Tokens (JWT) stored in secure, `HttpOnly`, `SameSite=Strict` cookies. No sensitive auth tokens in `localStorage`.
- **Password Security:** Salted and hashed passwords using Argon2id or bcrypt (cost factor 12).
- **Protection Measures:**
  - Rate limiting on authentication routes (preventing brute-force attacks).
  - Cross-Site Scripting (XSS) prevention through sanitized inputs and framework escaping.
  - Cross-Site Request Forgery (CSRF) defenses.
  - SQL Injection prevention enforced via Prisma ORM parameterized queries.
  - Secure HTTP headers configured via Helmet on the Express server.
- **Financial & Inventory Integrity:**
  - Price tampering prevention: Frontend never supplies item prices or order totals during checkout. The Express backend recalculates all item prices, discounts, and shipping charges directly from database records.
  - Concurrency control: Database transactions with row-level locks prevent stock overselling during simultaneous checkouts.

### 3.3 Usability, Accessibility & Localization
- **Accessibility:** WCAG 2.1 Level AA compliance, specifically ensuring adequate color contrast ratios between dark purple/obsidian surfaces and gold/pearl typography.
- **Forms & Inputs:** Standardized input validation with immediate, clear error feedback in human-readable English. Pakistani phone format helper hints.
- **Responsive Fluidity:** Adaptive layouts across 320px (compact mobile), 390px (standard mobile), 768px (tablet), 1024px (small desktop), and 1440px+ (large display).

---

## 4. User Roles and Permissions Matrix

| Capability / Resource | Guest | Registered Customer | Store Staff (`STAFF`) | Super Admin (`ADMIN`) |
| :--- | :---: | :---: | :---: | :---: |
| Browse Catalog & Collections | ✅ | ✅ | ✅ | ✅ |
| Add to Cart & Create COD Order | ✅ | ✅ | ✅ | ✅ |
| Manage Saved Addresses & Profile | ❌ | ✅ | ✅ | ✅ |
| View Personal Order History | ❌ | ✅ | ✅ | ✅ |
| Public Order Tracking by ID/Phone | ✅ | ✅ | ✅ | ✅ |
| Access Admin Dashboard | ❌ | ❌ | ✅ | ✅ |
| View Products, Stock & Categories | ❌ | ❌ | ✅ | ✅ |
| Create / Edit Products & Variants | ❌ | ❌ | ✅ | ✅ |
| Adjust Stock Quantities | ❌ | ❌ | ✅ | ✅ |
| View Orders & Update Statuses | ❌ | ❌ | ✅ | ✅ |
| Assign Courier Tracking Numbers | ❌ | ❌ | ✅ | ✅ |
| Create & Edit Coupons | ❌ | ❌ | ❌ | ✅ |
| Modify Shipping Zones & Rates | ❌ | ❌ | ❌ | ✅ |
| Manage Admin/Staff Accounts | ❌ | ❌ | ❌ | ✅ |
| View Financial Reports & Audit Logs | ❌ | ❌ | ❌ | ✅ |

---

## 5. Scope Boundaries: MVP vs. Future Enhancements

### 5.1 In-Scope (Phase 1 — MVP)
1. Monorepo architecture with Next.js App Router (Storefront & Admin) and Express.js REST API.
2. PostgreSQL database with Prisma ORM schema migrations.
3. Complete dark luxury design system implementation with Tailwind CSS.
4. Men's and Women's catalog with categories, subcategories, and curated collections.
5. Product detail pages with multi-image gallery, size/color variant matrix, and stock status.
6. Persistent cart drawer and full cart page.
7. Pakistani Cash on Delivery checkout with city/province zone-based shipping rules.
8. Customer authentication, address book, and order history.
9. Public order tracking page.
10. Full administrative portal: Catalog management, variant SKU inventory management, order status lifecycle processing, customer directory, coupon manager, and audit logs.
11. Manual courier assignment (courier name + tracking number recorded on order).

### 5.2 Out-of-Scope (Future Enhancements — Phase 2+)
1. Digital online payment gateways (Credit/Debit Card via PayFast, JazzCash, EasyPaisa, or Stripe PK).
2. Live automated courier booking APIs (automated TCS, Trax, or Leopards API webhooks and auto-generated booking slips).
3. Automated SMS notification gateways for OTP verification or shipment dispatch updates.
4. Multi-currency and international shipping conversions.
5. Customer loyalty points and referral rewards programs.
6. Live customer chat widgets and automated chatbots.

---

## 6. Assumptions, Exclusions & Acceptance Criteria

### 6.1 Assumptions
- All monetary values are processed and displayed in Pakistani Rupees (PKR).
- Initial order verification will occur via operational store processes (e.g., manual phone confirmation or WhatsApp follow-up by store staff before setting status to `CONFIRMED`).
- Courier consignment numbers will be generated via the merchant's existing courier portal and manually pasted into the order record in the admin panel.
- Product images will be hosted locally in development and transitioned to an S3-compatible cloud storage provider in production.

### 6.2 Exclusions
- No payment gateway API keys or merchant account integration required for MVP.
- No direct ERP or external warehouse management system (WMS) integration.

### 6.3 Acceptance Criteria
1. A customer can seamlessly browse products on mobile or desktop, select a color and size, add to cart, and complete a COD order with a valid Pakistani address and phone number.
2. Orders generate a unique order identifier, automatically decrement inventory for the selected variant SKUs, and prevent purchases when stock is 0.
3. The backend independently calculates all prices, discounts, and shipping charges, completely rejecting any client-supplied totals.
4. Store administrators can log into the protected admin panel, view incoming orders, update statuses across the lifecycle, assign tracking numbers, and manage catalog items and stock levels.
5. All UI surfaces adhere strictly to the defined NOIR & GOLD dark luxury aesthetic, maintaining high visual fidelity, responsive fluidity, and accessibility standards.
