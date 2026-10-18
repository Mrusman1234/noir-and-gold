# Document 13: Full-Stack Engineer Learning Roadmap

## 1. Pedagogical Overview & Curriculum Objectives

This 12-stage curriculum is tailored for developers seeking to master modern full-stack web engineering by exploring the NOIR & GOLD codebase. Each stage provides:
- **Core Concepts:** Foundational principles to understand.
- **Codebase References:** Exact files to inspect and study.
- **Hands-On Exercises:** Concrete tasks to build practical mastery.

---

## 2. The 12-Stage Mastery Path

### Stage 1: Modern JavaScript & TypeScript Fundamentals
- **Core Concepts:** Discriminated unions, generics, structural typing, Promises, `async`/`await`, closures, and immutability.
- **Where to Study in Code:**
  - `frontend/src/types/index.ts`: Inspect discriminated unions for order and payment statuses.
  - `frontend/src/lib/utils.ts`: Study formatting helpers, error extraction, and HMAC generators.
- **Practice Exercise:** Write a generic TypeScript pagination wrapper interface `PaginatedResponse<T>` and implement a helper function to paginate an arbitrary array of objects.

### Stage 2: React 19 Fundamentals & Modern Hooks
- **Core Concepts:** Component composition, pure rendering, `useState`, `useCallback`, `useRef`, cancellation patterns in `useEffect`, and React 19's `react-hooks/set-state-in-effect` prevention.
- **Where to Study in Code:**
  - `frontend/src/components/admin/ProductsManagerView.tsx`: Inspect how `showFeedback` and the async data loader prevent race conditions and unnecessary re-renders.
- **Practice Exercise:** Build a debounce hook `useDebounce<T>(value: T, delayMs: number)` and integrate it into a live search input field.

### Stage 3: Next.js 16 App Router & Server Components
- **Core Concepts:** File-based routing, nested layouts, Server vs. Client component boundaries, route handlers (`route.ts`), and streaming SSR.
- **Where to Study in Code:**
  - `frontend/src/app/layout.tsx`: Root layout and server-side metadata.
  - `frontend/src/app/api/v1/orders/route.ts`: Handling POST requests in App Router.
- **Practice Exercise:** Create a new page route `/lookbook` featuring server-rendered high-fashion photography cards.

### Stage 4: Relational Database Modeling & Prisma ORM
- **Core Concepts:** Relational ER diagrams, foreign key constraints, one-to-many and many-to-many relationships, soft-delete indexes, and atomic `$transaction` queries.
- **Where to Study in Code:**
  - `backend/prisma/schema.prisma`: Analyze all 14 models and indexes.
  - `frontend/src/lib/order-service.ts`: Study multi-model transactional checkouts.
- **Practice Exercise:** Add a `CustomerReview` model to `schema.prisma` with ratings (1-5) and link it to `Product`. Push to SQLite using `npm run backend:db:push`.

### Stage 5: Backend REST Engineering with Express
- **Core Concepts:** Express routing, middleware pipelines (CORS, Morgan, JSON parsing), controller architecture, and clean error forwarding.
- **Where to Study in Code:**
  - `backend/src/app.ts`: Global middleware setup.
  - `backend/src/controllers/product.controller.ts`: Request parsing and query filtering.
- **Practice Exercise:** Add a new Express endpoint `GET /api/products/featured` returning the top 3 garments ordered by creation date.

### Stage 6: Authentication, Sessions & RBAC
- **Core Concepts:** HTTP-only cookies, SameSite policies, HMAC session signing, role-based authorization guards (`ADMIN` vs `STAFF`).
- **Where to Study in Code:**
  - `frontend/src/lib/admin-auth-guard.ts`: Header extraction, cookie decryption, role validation.
- **Practice Exercise:** Implement a middleware check ensuring that only users with `role === "SUPER_ADMIN"` can trigger catastrophic data resets.

### Stage 7: E-Commerce State Machines & Idempotency
- **Core Concepts:** Order lifecycle state transitions, payment capture states, idempotent attempt keys, and capacity-bounded refunds.
- **Where to Study in Code:**
  - `frontend/src/lib/payment-attempt-service.ts`: Idempotent state machine transitions.
  - `frontend/src/lib/refund-ledger-service.ts`: Cumulative refund capacity tracking.
- **Practice Exercise:** Write a unit test simulating two concurrent refund requests of PKR 50,000 against an order with an PKR 80,000 balance to verify that one fails gracefully.

### Stage 8: Application Security & Hardening
- **Core Concepts:** OWASP Top 10 defenses, SQL injection prevention via ORMs, XSS mitigation, CSRF origin verification, and dual-layer rate limiting.
- **Where to Study in Code:**
  - `frontend/src/app/api/v1/payments/webhook/route.ts`: HMAC signature verification and timestamp freshness.
  - `frontend/tests/security-audit.test.ts`: Automated security test cases.
- **Practice Exercise:** Build an IP rate-limiting utility that throttles requests after 3 failed login attempts within 5 minutes.

### Stage 9: Automated Testing & Test Database Isolation
- **Core Concepts:** Native Node test runner (`node:test`), assertions (`assert/strict`), ephemeral database cloning with `mkdtempSync`.
- **Where to Study in Code:**
  - `frontend/tests/order-service.test.ts`: Setup, test isolation, and assertion patterns.
  - `frontend/tests/e2e-all-phases.test.ts`: Master end-to-end integration tests.
- **Practice Exercise:** Write an automated test asserting that attempting to create a product variant with a negative stock count (`-5`) throws a validation error.

### Stage 10: Performance Optimization & Data Pipelines
- **Core Concepts:** Database index optimization, RFC-4180 streaming CSV generation, lazy loading, and image dimension optimization.
- **Where to Study in Code:**
  - `frontend/src/app/api/v1/admin/orders/export/route.ts`: Streaming CSV generation without memory spikes.
- **Practice Exercise:** Benchmark the CSV export route using `curl` with 1,000 mock orders to measure memory stability.

### Stage 11: Cloud Storage & Multipart File Pipelines
- **Core Concepts:** HTML5 FormData, multipart HTTP decoding, file size validation, MIME sniffing, and cloud storage adapters (S3 / R2).
- **Where to Study in Code:**
  - `frontend/src/lib/storage-service.ts`: Local disk vs. AWS S3 abstraction.
  - `frontend/src/components/admin/ImageUploader.tsx`: Drag-and-drop client interface.
- **Practice Exercise:** Modify `ImageUploader` to support multi-file selection and display upload progress percentages.

### Stage 12: DevOps, Docker & Architecture Design
- **Core Concepts:** Monorepo coordination, multi-stage Docker builds, non-root container security, environment secret injection, and SQLite backup workflows.
- **Where to Study in Code:**
  - `Dockerfile` & `fly.toml`: Container specifications and volume mounts.
- **Practice Exercise:** Build and run the production Docker container locally and access the storefront at `http://localhost:3000`.
