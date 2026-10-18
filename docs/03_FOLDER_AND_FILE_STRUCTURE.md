# Document 3: Repository Architecture & File Map

## 1. Monorepo Structural Philosophy

NOIR & GOLD is organized as an npm workspace monorepo. This architectural approach delivers three critical engineering benefits:
1. **Shared Domain Schemas:** The database definitions (`backend/prisma/schema.prisma`) and SQLite database file (`backend/prisma/dev.db`) serve as the single source of truth for both the Next.js presentation layer and the Express microservice.
2. **Unified Testing Pipeline:** Automated tests can exercise full customer-to-admin workflows across all layers from a single test runner.
3. **Operational Independence:** The frontend and backend can be built, containerized, and deployed independently or operated concurrently during local development.

---

## 2. Complete Annotated Repository Tree

```text
cloths store/
├── package.json                         # Monorepo root workspace config & scripts
├── package-lock.json                    # Lockfile for root and workspace packages
├── tsconfig.json                        # Monorepo base TypeScript settings
│
├── frontend/                            # Next.js 16 Web Application & Edge APIs
│   ├── package.json                     # Frontend dependencies (React 19, Next 16, Prisma)
│   ├── tsconfig.json                    # Frontend strict TypeScript configuration
│   ├── next.config.ts                   # Next.js runtime configuration
│   ├── eslint.config.mjs                # ESLint 9 configuration with React 19 rules
│   │
│   ├── public/                          # Static public web assets
│   │   ├── images/products/             # High-resolution catalog photography
│   │   └── uploads/                     # Administrative local multipart uploads
│   │
│   ├── src/                             # Source code root
│   │   ├── app/                         # Next.js App Router (pages and route handlers)
│   │   │   ├── layout.tsx               # Root atelier layout (Navbar, Footer, Providers)
│   │   │   ├── page.tsx                 # Atelier landing page (Hero, Editorial, Drops)
│   │   │   ├── globals.css              # Global styles, Tailwind v4 imports, theme variables
│   │   │   │
│   │   │   ├── collection/              # Catalog discovery page
│   │   │   │   └── page.tsx             # Filterable product grid with category selectors
│   │   │   ├── product/[slug]/          # Product detail page
│   │   │   │   └── page.tsx             # Interactive gallery, variant matrix, add-to-bag
│   │   │   ├── cart/                    # Shopping bag view
│   │   │   │   └── page.tsx             # Bag breakdown, subtotal, quantity adjustments
│   │   │   ├── checkout/                # Multi-step checkout view
│   │   │   │   └── page.tsx             # Shipping form, zone charges, payment selection
│   │   │   ├── orders/[id]/             # Customer order tracking page
│   │   │   │   └── page.tsx             # HMAC-protected guest tracking & courier details
│   │   │   ├── admin/                   # Administrative command center
│   │   │   │   └── page.tsx             # Admin dashboard (Products, Orders, Ledger, Exports)
│   │   │   │
│   │   │   └── api/v1/                  # Next.js REST and Webhook Route Handlers
│   │   │       ├── admin/
│   │   │       │   ├── auth/            # Administrative authentication (login, logout, session)
│   │   │       │   ├── products/        # Product CRUD, variant updates, soft-delete archive
│   │   │       │   ├── orders/          # Order listing, status transitions, courier dispatch
│   │   │       │   │   ├── export/      # RFC-4180 streaming CSV export route
│   │   │       │   │   └── [id]/refund/ # Capacity-checked refund processing route
│   │   │       │   └── upload/          # Multipart image upload handler (local & S3)
│   │   │       ├── orders/              # Customer checkout order placement & lookup
│   │   │       └── payments/
│   │   │           └── webhook/         # Secure HMAC-SHA256 payment gateway webhook
│   │   │
│   │   ├── components/                  # Reusable UI component libraries
│   │   │   ├── admin/                   # Administrative dashboard views
│   │   │   │   ├── AdminLayout.tsx      # Admin header, sidebar navigation, tab switcher
│   │   │   │   ├── ProductsManagerView.tsx # Garment catalog CRUD and live variant manager
│   │   │   │   ├── OrdersManagerView.tsx   # Order status triage, filter drawer, refund UI
│   │   │   │   ├── VariantMatrixBuilder.tsx# Dynamic SKU, color, size, and stock grid
│   │   │   │   └── ImageUploader.tsx    # Drag-and-drop multipart upload component
│   │   │   ├── cart/                    # Cart drawer, bag items, quantity counters
│   │   │   ├── checkout/                # Address forms, payment radios, order review
│   │   │   ├── common/                  # Modals, badges, buttons, loading spinners
│   │   │   ├── layout/                  # Navigation bar, mobile drawer, atelier footer
│   │   │   └── product/                 # Garment card, gallery zoom, variant selectors
│   │   │
│   │   ├── lib/                         # Core business logic services & utilities
│   │   │   ├── prisma.ts                # Singleton Prisma client instance
│   │   │   ├── admin-auth-guard.ts      # RBAC middleware, CSRF checks, session verifier
│   │   │   ├── order-service.ts         # Customer order creation, inventory decrements
│   │   │   ├── catalog-service.ts       # Garment fetching, soft-delete filters, updates
│   │   │   ├── storage-service.ts       # Unified local and AWS S3 storage adapter
│   │   │   ├── refund-ledger-service.ts # Atomic refund calculations and event ledger
│   │   │   ├── payment-attempt-service.ts # Gateway attempt state machine and verification
│   │   │   ├── inventory-reservation-service.ts # State-machine-based inventory holds
│   │   │   ├── security-audit-service.ts # Standardized security and administrative audit logs
│   │   │   └── utils.ts                 # Currency formatters (PKR), clsx helpers, token hashing
│   │   │
│   │   └── types/                       # Shared TypeScript domain interfaces
│   │       └── index.ts                 # Enums, DTOs, API contracts, session structures
│   │
│   └── tests/                           # Native Node.js automated test suites
│       ├── order-service.test.ts        # Order creation, rollback, and concurrency tests
│       ├── payment-attempt.test.ts      # Payment attempt lifecycle and retry tests
│       ├── refund-ledger.test.ts        # Refund capacity and audit ledger tests
│       ├── inventory-reservation.test.ts# Reservation holding, expiration, and release tests
│       ├── security-audit.test.ts       # Rate limiting, CSRF, and injection safety tests
│       ├── admin-orders-export.test.ts  # CSV streaming and filter parameter tests
│       ├── admin-upload.test.ts         # Multipart validation and storage adapter tests
│       └── e2e-all-phases.test.ts       # Master end-to-end integration test suite
│
├── backend/                             # Express REST Microservice & Database Core
│   ├── package.json                     # Express, Prisma, TypeScript dependencies
│   ├── tsconfig.json                    # Backend TypeScript configuration
│   ├── src/
│   │   ├── app.ts                       # Express application entry, CORS, and routes
│   │   ├── controllers/
│   │   │   ├── product.controller.ts    # REST endpoints for garment querying
│   │   │   └── category.controller.ts   # REST endpoints for category collections
│   │   └── routes/
│   │       ├── product.routes.ts        # Route mappings for `/api/products`
│   │       └── category.routes.ts       # Route mappings for `/api/categories`
│   └── prisma/
│       ├── schema.prisma                # Relational schema definition (14 tables)
│       ├── dev.db                       # Active SQLite database file
│       └── seed.ts                      # Database seeding script (artisanal garments & zones)
│
├── docs/                                # Technical documentation modules (Docs 1 - 14)
└── scripts/                             # Build, migration, and PDF compilation scripts
```

---

## 3. Deep-Dive: Responsibilities & Separation of Concerns

### 3.1 Frontend App Router (`frontend/src/app`)
- **Primary Mission:** Server-Side Rendered (SSR) storefront and secure administrative interface.
- **Why App Router?** Next.js App Router collocates UI components with their backend route handlers (`route.ts`). For example, administrative product mutations reside directly in `frontend/src/app/api/v1/admin/products/[id]/route.ts`, enabling instant access to cookies, request headers, and server-side validation without cross-server hops.

### 3.2 Service Layer (`frontend/src/lib`)
- **Primary Mission:** Encapsulate pure business logic, database transactions, and security checks away from the HTTP transport layer.
- **Why Decouple Services from Routes?** By placing checkout logic in `order-service.ts` rather than inside the API route handler, the exact same logic can be executed, unit-tested, and stressed by automated test suites (`tests/order-service.test.ts`) without requiring a live HTTP server.

### 3.3 Backend Microservice (`backend/src`)
- **Primary Mission:** Standalone Express REST API operating on port 5000.
- **Role in the Architecture:** Provides a headless REST API for third-party integrations, mobile application consumers, or external microservices that need to query the catalog without loading Next.js page rendering pipelines.

---

## 4. Frontend API Routes vs. Express Backend Comparison

| Architectural Aspect | Frontend Route Handlers (`frontend/src/app/api/...`) | Backend Express API (`backend/src/...`) |
| :--- | :--- | :--- |
| **Port / Base URL** | `http://localhost:3000/api/v1` | `http://localhost:5000/api` |
| **Execution Environment** | Next.js Server Runtime (Node.js) | Standalone Node.js HTTP Server |
| **Primary Consumer** | Next.js Storefront & Admin Dashboard | External clients, headless frontends, mobile apps |
| **Authentication Model** | HTTP-Only Session Cookies (`admin-token`) | API Keys / Bearer Tokens / Open CORS |
| **Specialized Capabilities**| Streaming CSV responses, multipart file handling | High-throughput JSON microservice endpoints |
| **Database Access** | Direct Prisma client (`@/lib/prisma`) | Direct Prisma client (`@prisma/client`) |
