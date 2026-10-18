# Baseline Technical Audit & Discovery Report — NOIR & GOLD
**Document Version:** 1.0.0  
**Audit Date:** October 18, 2026  
**Auditor:** Senior Full-Stack Software Engineer & Lead Security Auditor  
**Repository Working Directory:** `c:\Users\premier\Desktop\cloths store`  

---

## 1. Executive Summary

This baseline audit evaluates the complete **NOIR & GOLD** Pakistani luxury apparel e-commerce platform. The project is structured as an npm workspaces monorepo containing a full-stack Next.js 16 (App Router) storefront and admin portal in `frontend/`, a standalone Express REST API in `backend/`, and an SQLite database managed via Prisma ORM 5.22.0.

### Overall Completion Assessment (Engineering Estimate):
- **Storefront & Catalog:** 98% (Fully persistent SQLite catalog, responsive UI, search, filtering, sorting).
- **Cart & Checkout:** 95% (Persisted local cart, Pakistani address validation, domestic payment methods, authoritative server pricing).
- **Order Lifecycle & Inventory:** 95% (Atomic concurrency protection, reservation states, cancellation stock restoration).
- **Admin Capabilities:** 94% (Full CRUD, dynamic variant matrix, image upload pipeline, CSV export, refund ledger, TOTP MFA).
- **Backend Express API:** 85% (Products, categories, and health routes operational; missing soft-delete filtering in product and category controllers).
- **External Notifications (Email/SMS):** 20% (Customer contacts captured and audited; outbound SMTP/SMS gateway not yet integrated).

---

## 2. Workspace & Environment Inventory

### 2.1 Workspace Hierarchy
```
cloths store/
├── package.json               # Root monorepo workspace manifest ("frontend", "backend")
├── package-lock.json          # Root lockfile (npm v10+)
├── .gitignore                 # Root Git ignore rules
├── Dockerfile                 # Standalone production container definition
├── fly.toml                   # Fly.io deployment orchestration
├── backend/                   # Express.js REST API service
│   ├── package.json           # Backend dependencies (Express 4.21, Prisma 5.22, Morgan, CORS)
│   ├── tsconfig.json          # NodeNext / ES2022 TypeScript configuration
│   ├── .env                   # PORT=5000, DATABASE_URL="file:./dev.db", CORS_ORIGIN
│   ├── prisma/
│   │   ├── schema.prisma      # 14 relational tables with SQLite provider
│   │   ├── dev.db             # Physical SQLite database (11 products, 8 categories, 3 shipping zones)
│   │   └── seed.ts            # Atelier catalog and logistics seeder
│   └── src/
│       ├── app.ts             # Express entry point, security headers, route mounting
│       ├── config/db.ts       # Shared PrismaClient instance
│       ├── controllers/       # product.controller.ts, category.controller.ts
│       └── routes/            # health.routes.ts, product.routes.ts, category.routes.ts
├── frontend/                  # Next.js 16 App Router full-stack web application
│   ├── package.json           # Next.js 16.4.0, React 19.3.0, Tailwind CSS v4, AWS SDK S3
│   ├── next.config.ts         # Partial prerendering, cache components, security headers
│   ├── tsconfig.json          # Bundler module resolution, path aliases (@/* -> src/*)
│   ├── eslint.config.mjs      # ESLint flat config with Next.js core web vitals and typescript
│   ├── .env.local             # DATABASE_URL, ADMIN credentials, ORDER_VERIFICATION_SECRET
│   ├── src/
│   │   ├── app/               # 64 App Router routes (Storefront pages + API routes)
│   │   ├── components/        # Admin, Cart, Checkout, Products, Layout, UI
│   │   ├── context/           # CartContext.tsx (Local storage persistence)
│   │   ├── lib/               # 25 domain services, audit loggers, rate limiters, storage adapters
│   │   └── types/             # Centralized TypeScript definitions
│   └── tests/                 # 20 integration test files (122 passing automated tests)
└── docs/                      # Technical specifications, wireframes, and architectural decisions
```

### 2.2 Verified Dependency Versions
| Technology | Declared Version | Actual Runtime / Lockfile Version | Verified Status |
| :--- | :--- | :--- | :---: |
| **Node.js** | `>=20.0.0` | `v24.21.0` (Active OS runtime) | **Active** |
| **Next.js** | `16.4.0` | `16.4.0` (App Router + Turbopack) | **Active** |
| **React / React DOM** | `19.3.0` | `19.3.0` | **Active** |
| **Express** | `^4.21.2` | `4.21.2` | **Active** |
| **Prisma ORM** | `^5.22.0` | `5.22.0` | **Active** |
| **SQLite** | Engine 3.x | Embedded via Prisma Client Engine | **Active** |
| **Tailwind CSS** | `^4.0.0` | `@tailwindcss/turbopack` 4.x | **Active** |
| **TypeScript** | `^5.0.0` | `5.6.3` (Monorepo root & workspaces) | **Active** |
| **AWS S3 SDK** | `^3.1152.0` | `3.1152.0` (Optional cloud upload adapter) | **Active** |

---

## 3. Implementation Status Across 14 Functional Domains

| # | Domain | Implementation Status | Key Files & Routes | Verification Result |
| :---: | :--- | :---: | :--- | :--- |
| **1** | **Homepage & Navigation** | Complete & Verified | `frontend/src/app/page.tsx`, `Header.tsx`, `Footer.tsx` | All sections, editorial marquees, and category links operational. |
| **2** | **Product Categories & Catalog** | Complete & Verified | `frontend/src/app/shop/page.tsx`, `catalog-service.ts` | 8 categories mapped; persistent SQLite retrieval active. |
| **3** | **Product Detail, Search & Filters** | Complete & Verified | `ProductDetailView.tsx`, `ProductListingView.tsx` | Audience tabs, multi-criteria filtering, price sorting tested. |
| **4** | **Cart & Persistence** | Complete & Verified | `CartContext.tsx`, `CartPageView.tsx` | Local storage sync (`noir_cart_v1`), free shipping meter (10k PKR). |
| **5** | **Checkout & Pakistani Delivery** | Complete & Verified | `CheckoutPageView.tsx`, `CustomerAddressForm.tsx` | 50+ Pakistani cities, 8 provinces/regions, phone regex validation. |
| **6** | **Cash on Delivery (COD)** | Complete & Verified | `order-service.ts`, `CheckoutSummary.tsx` | Atomic stock decrement on confirmation; zero-gateway bypass. |
| **7** | **Order Creation & Lifecycle** | Complete & Verified | `api/v1/orders/route.ts`, `OrderSuccessView.tsx` | Snapshot creation, unique `orderReference`, status tracking. |
| **8** | **Admin Dashboard & RBAC** | Complete & Verified | `admin-auth-guard.ts`, `AdminDashboardView.tsx` | Role separation (`ADMIN` vs `STAFF`), CSRF Origin check, TOTP MFA. |
| **9** | **Product & Inventory Management** | Complete & Verified | `ProductsManagerView.tsx`, `VariantMatrixBuilder.tsx` | Full CRUD, variant builder, soft delete/restore, price audit. |
| **10** | **Authentication & User Accounts** | Partially Implemented | `admin-service.ts`, `AccountOrderLookupView.tsx` | Admin auth complete; customer portal uses tokenized guest lookup. |
| **11** | **Payment Domain & Webhooks** | Complete & Verified | `webhook/route.ts`, `payment-attempt-service.ts` | HMAC-SHA256 signature, anti-replay window (300s), domestic methods. |
| **12** | **Refunds & Stock Restoration** | Complete & Verified | `refund/route.ts`, `admin-order-update-service.ts` | Atomic capacity guard, cancellation inventory restock. |
| **13** | **Email Notifications** | Missing / Placeholder | `order-service.ts` (logs to audit only) | Inbound addresses captured; outbound SMTP/SES not configured. |
| **14** | **Accessibility, SEO & Deployment** | Complete & Verified | `layout.tsx`, `Dockerfile`, `fly.toml` | OpenGraph tags, semantic HTML, container configuration ready. |

---

## 4. Initial Quality Audit & Discovered Issues

### 4.1 TypeScript Compilation
- **Frontend (`tsc --noEmit`):** PASSED (0 errors).
- **Backend (`tsc --noEmit`):** PASSED (0 errors).

### 4.2 Automated Test Suites
- **Executed:** `npx tsx --test frontend/tests/*.test.ts`
- **Result:** **122 / 122 tests passed (100% green)** across all 20 test files.

### 4.3 Static Code Analysis (ESLint)
Running `eslint` across `frontend/src` revealed **11 issues (5 errors, 6 warnings)**:
1. `ProductsManagerView.tsx:88:7` (`react-hooks/immutability`): `showFeedback` is called inside `fetchProducts` before its lexical declaration.
2. `ProductsManagerView.tsx:95:10` (`react-hooks/set-state-in-effect`): Calling `void fetchProducts()` synchronously inside `useEffect` triggers React 19 cascading render warnings.
3. `ProductsManagerView.tsx:96:6` (`react-hooks/exhaustive-deps`): Missing `fetchProducts` dependency in `useEffect`.
4. `webhook/route.ts:376:19` (`@typescript-eslint/no-explicit-any`): Catch block uses untyped `(error: any)`.
5. `admin/products/[id]/route.ts:8:3` (`@typescript-eslint/no-unused-vars`): Unused import `deleteProductAdmin`.
6. `admin/ImageUploader.tsx:3:35` (`@typescript-eslint/no-unused-vars`): Unused import `useCallback`.
7. `admin/OrdersManagerView.tsx:237:9` (`@typescript-eslint/no-unused-vars`): Unused function `updatePaymentStatus`.
8. `tests/admin-orders-export.test.ts:63:25` (`@typescript-eslint/no-explicit-any`): Explicit `any` in test assertion.
9. `tests/admin-upload.test.ts:142:25` (`@typescript-eslint/no-explicit-any`): Explicit `any` in test assertion.
10. `tests/e2e-all-phases.test.ts:19:7 & 20:7` (`@typescript-eslint/no-unused-vars`): Variables `testProductId` and `testVariantId` assigned but not asserted.

### 4.4 Express Backend Architectural Observations
- `backend/src/controllers/product.controller.ts`:
  - `getProducts`: Only checks `{ status: "PUBLISHED" }`; does not verify `deletedAt: null`. If a product is soft-deleted without its status being updated to `ARCHIVED`, it would still be returned.
  - `getProductByIdOrSlug`: Queries `{ OR: [{ id }, { slug: id }] }` without checking `deletedAt: null` or `status: "PUBLISHED"`.
- `backend/src/controllers/category.controller.ts`:
  - `getCategories`: Only checks `{ isActive: true }`; does not check `deletedAt: null`, and `_count.products` counts soft-deleted products.
