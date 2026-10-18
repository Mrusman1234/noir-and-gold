# NOIR & GOLD | Haute Couture E-Commerce Platform

> An haute couture digital atelier and luxury e-commerce platform designed for artisanal Pakistani garments, bespoke silhouettes, and premium fabrics. Built with Next.js 16 App Router, Express, Prisma ORM, and Tailwind CSS v4.

---

## 1. Overview & Architectural Stack

NOIR & GOLD combines editorial aesthetics (deep obsidian `#0D0D0D`, champagne gold `#C9A84C`, warm parchment `#F9F6F0`) with enterprise-grade full-stack architecture:

- **Frontend & Serverless APIs:** Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript, and Prisma ORM client.
- **Dedicated Backend Service:** Express 4 REST API, Prisma ORM, CORS, and Morgan logging.
- **Data Persistence:** Relational database schema with 14 synchronized models, atomic transactions, inventory reservations, and audit logs via Prisma ORM (SQLite for zero-dependency local development, PostgreSQL ready for production).
- **Payment & Order Workflows:** Cash on Delivery (COD), Pakistani electronic gateways (JazzCash, EasyPaisa, Direct Bank Transfer), HMAC-SHA256 webhook verification, cumulative capacity-checked refunds, and RFC-4180 streaming financial CSV exports.
- **Production Infrastructure:** Multi-stage Docker containerization and Fly.io deployment architecture with optional AWS S3 / Cloudflare R2 object storage.

---

## 2. Key Features

### Storefront Experience
- **Editorial Garment Catalog:** Filterable categories, responsive product grids, dynamic galleries, and color/size variant pickers.
- **Shopping Bag & Cart:** Reactive state management with local persistence, threshold-based delivery calculation, and inventory availability indicators.
- **Multi-Zone Shipping:** Dynamic shipping rate calculation across regional zones (Sindh, Punjab, Islamabad/KPK/Balochistan) and free shipping thresholds.
- **Order Tracking:** Secure guest order tracking protected by cryptographic HMAC tokens (`/orders/[id]`).

### Order & Inventory State Machines
- **Concurrency & Stock Safety:** Atomic inventory reservations and optimistic locking prevent overselling during high-demand drops.
- **Payment Lifecycle:** Comprehensive attempt tracking, idempotent gateway retries, terminal failure handling, and replay attack prevention (300-second timestamp window).
- **Refund Ledger:** Atomic capacity checks preventing refund amounts from exceeding captured totals.

### Admin Command Center
- **Role-Based Access Control:** Cookie-based sessions with `ADMIN` and `STAFF` privilege tiers, origin verification, and brute-force throttling.
- **Garment & Variant Management:** Product CRUD with soft-delete archiving, dynamic SKU generation, and color hex mapping.
- **Asset Pipeline:** Drag-and-drop multipart image uploader with local disk fallback and cloud object storage abstraction (AWS S3 / Cloudflare R2).
- **Financial Audit & CSV Export:** Real-time revenue analytics, order status progression, and streaming RFC-4180 CSV exports.

---

## 3. Repository Structure

```text
cloths-store/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # 14 Prisma models (Category, Product, Variant, Order, etc.)
│   │   └── seed.ts             # Atelier demo catalog & sample variants
│   ├── src/
│   │   ├── config/             # Database connection setup
│   │   ├── controllers/        # Category and Product controllers
│   │   ├── routes/             # REST API routing
│   │   └── app.ts              # Express application bootstrap
│   ├── .env.example            # Backend environment template
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/                # Next.js 16 App Router (Storefront + Admin portal + API routes)
│   │   ├── components/         # Modular UI components (Storefront, Admin, Cart, Checkout)
│   │   ├── context/            # Global Cart state context
│   │   ├── lib/                # Core domain services (Orders, Inventory, Auth, Payments, S3)
│   │   └── types/              # Domain TypeScript types
│   ├── tests/                  # 20 test suites covering auth, state machines, RBAC, e2e
│   ├── public/                 # Static assets, campaign imagery, product photography
│   ├── .env.example            # Frontend environment template
│   ├── package.json
│   └── tsconfig.json
├── docs/                       # 14 comprehensive technical guides & architecture specifications
├── deploy/                     # Docker entrypoints & Fly.io configuration
├── scripts/                    # PDF documentation generator & test scripts
├── Dockerfile                  # Multi-stage production container build
├── fly.toml                    # Fly.io cloud deployment descriptor
├── package.json                # Monorepo workspaces manifest
└── README.md                   # Project documentation
```

---

## 4. Getting Started

### Prerequisites
- **Node.js:** v20.x or higher
- **npm:** v10.x or higher

### Installation
Clone the repository and install dependencies at the monorepo root:

```bash
git clone https://github.com/Mrusman1234/noir-and-gold.git
cd noir-and-gold
npm install
```

---

## 5. Environment Configuration

### Backend (`backend/.env`)
Copy `backend/.env.example` to `backend/.env`:

```bash
cp backend/.env.example backend/.env
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Express server port | `5000` |
| `NODE_ENV` | Environment mode (`development` / `production`) | `development` |
| `DATABASE_URL` | SQLite or PostgreSQL connection string | `file:./dev.db` |
| `CORS_ORIGIN` | Allowed client origin | `http://localhost:3000` |

### Frontend (`frontend/.env.local`)
Copy `frontend/.env.example` to `frontend/.env.local`:

```bash
cp frontend/.env.example frontend/.env.local
```

| Variable | Description | Example / Standard |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Express API base URL | `http://localhost:5000` |
| `DATABASE_URL` | Prisma SQLite file connection | `file:C:/path/to/backend/prisma/dev.db` |
| `ORDER_VERIFICATION_SECRET` | 32-byte hex HMAC secret for guest tokens | Generate via `openssl rand -hex 32` |
| `ADMIN_EMAIL` | Admin portal login email | `admin@noirandgold.com` |
| `ADMIN_PASSWORD` | Admin portal login password | Secure password |
| `ADMIN_NAME` | Admin display name | `Atelier Admin` |
| `PAYMENT_WEBHOOK_SECRET` | 32-byte HMAC secret for payment webhooks | Optional in development (defaults to test key) |
| `AWS_ACCESS_KEY_ID` | Optional AWS S3 key for uploads | Cloud storage configuration |
| `AWS_SECRET_ACCESS_KEY` | Optional AWS S3 secret | Cloud storage configuration |
| `AWS_REGION` | S3 region | `us-east-1` |
| `AWS_S3_BUCKET_NAME` | S3 bucket name | `noir-and-gold-assets` |

---

## 6. Database Setup & Seeding

Synchronize the Prisma schema and seed initial catalog data:

```bash
# Push schema to SQLite database
npm run backend:db:push

# Seed categories, luxury garments, and inventory variants
npm run backend:db:seed
```

---

## 7. Development Commands

Run frontend and backend services concurrently or independently:

| Command | Description |
| :--- | :--- |
| `npm run frontend:dev` | Start Next.js development server at `http://localhost:3000` |
| `npm run backend:dev` | Start Express REST API with `tsx watch` at `http://localhost:5000` |
| `npm run frontend:build` | Build production Next.js application |
| `npm run backend:build` | Compile backend TypeScript with `tsc` |
| `npm run frontend:typecheck` | Run frontend TypeScript typechecker (`tsc --noEmit`) |
| `npm run frontend:lint` | Run ESLint across frontend codebase |
| `npm test` | Run complete unit and integration test suite (122 tests) |

---

## 8. Verification & Quality Assurance

The repository includes a comprehensive automated test suite in `frontend/tests/`:

- **Order State Machine:** Idempotent creations, rollback on failure, tokenized HMAC verification, free delivery threshold tests.
- **Inventory Holds:** Optimistic locking, concurrency limits, single restock guarantee on cancellation.
- **Payment Attempts & Webhooks:** HMAC-SHA256 signature enforcement, timestamp freshness, double-spend prevention.
- **Refund Ledger:** Cumulative capacity verification and audit trail validation.
- **Admin Security:** CSRF Origin checks, MFA TOTP validation, IP/Email brute-force throttling, and session cookies.

Run the test suite:
```bash
npm test
```

---

## 9. License

Private & Proprietary — All rights reserved.
