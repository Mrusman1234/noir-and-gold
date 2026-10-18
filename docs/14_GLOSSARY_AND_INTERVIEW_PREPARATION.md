# Document 14: Technical Glossary & Senior Interview Guide

## 1. Technical Glossary (50+ Core Terms)

1. **App Router:** Next.js 16 file-system-based routing architecture utilizing React Server Components and nested layouts.
2. **Atomic Transaction:** A database execution unit (`$transaction`) where all operations succeed together or roll back entirely, preventing partial updates.
3. **BOLA (Broken Object Level Authorization):** Vulnerability where users access other users' data via direct IDs. Prevented via cryptographic HMAC tokens.
4. **CORS:** Cross-Origin Resource Sharing header mechanism dictating whether browser origins can access backend resources.
5. **CSRF:** Cross-Site Request Forgery attack mitigated in NOIR & GOLD using `Sec-Fetch-Site` inspection and Origin header validation.
6. **CUID:** Collision-resistant Unique Identifiers used for table primary keys.
7. **Database Isolation:** Decoupling test executions using dynamic temp databases (`mkdtempSync`) to prevent mutating live seed data.
8. **Defense-in-Depth:** Layered security architecture ensuring that the failure of any single defense layer does not compromise the system.
9. **Discriminated Union:** TypeScript type composed of several variants sharing a common literal property (e.g., `status: "PENDING" | "PAID"`).
10. **Dual Rate Limiter:** Throttling mechanism inspecting both client IP and customer phone number to defeat bot swarms.
11. **Eager Loading:** Loading related entities in a single database round-trip using Prisma's `include` statement to eliminate N+1 queries.
12. **ESLint 9 Flat Config:** The updated configuration architecture for ESLint enforcing hook purity and static analysis rules.
13. **Fail-Closed:** Security design principle where a missing credential or unexpected failure denies access by default rather than granting it.
14. **Foreign Key (FK):** Column referencing the primary key of another table, maintaining referential integrity.
15. **HMAC-SHA256:** Hash-based Message Authentication Code verifying data integrity and authenticity using a shared cryptographic secret.
16. **Hydration:** React process where browser JavaScript attaches event listeners to pre-rendered HTML received from the server.
17. **Idempotency:** Property where performing an operation multiple times produces the exact same result as performing it once (e.g., retrying a payment attempt).
18. **Immutable Audit Log:** Write-only ledger table (`SecurityAuditLog`) that stores past operational events without edit or delete capabilities.
19. **Inventory Reservation:** Time-bounded hold on physical stock created during customer checkout to prevent overselling.
20. **JWT (JSON Web Token):** Compact URL-safe token representing signed claims between parties.
21. **Lazy Loading:** Deferring the loading of non-critical code or image assets until they are needed in the viewport.
22. **MIME Sniffing:** Verifying the actual byte headers of an uploaded file rather than relying on its file extension.
23. **Monorepo:** Software development strategy where multiple related projects (frontend, backend, shared configs) live in a single Git repository.
24. **Morgan:** Express HTTP request logging middleware used for request tracing and performance debugging.
25. **Multipart Form-Data:** HTTP payload format used for transmitting binary files and form fields simultaneously.
26. **Node Native Test Runner:** Built-in `node:test` execution engine eliminating third-party testing dependencies.
27. **Optimistic Locking:** Concurrency control method verifying that a record has not changed before applying updates (e.g., `WHERE stock >= requestedQty`).
28. **Optimistic UI:** Updating the client interface before the server response returns to deliver an instantaneous user experience.
29. **Parameterized Query:** Database technique separating SQL code from user-supplied data, neutralizing SQL injection vulnerabilities.
30. **Prisma Schema:** Declarative modeling file defining models, relations, indexes, and generator configurations.
31. **Prisma Studio:** Web-based GUI for visually exploring and mutating relational data.
32. **RBAC:** Role-Based Access Control restricting system features based on assigned roles (`ADMIN` vs `STAFF`).
33. **React Server Components (RSC):** React components executing strictly on the server that emit zero JavaScript to the browser client bundle.
34. **Replay Attack:** Attack where a valid signed network transmission is recorded and maliciously repeated. Throttled via 300-second timestamp windows.
35. **RFC-4180:** Common format standard for Comma-Separated Values (CSV) files including quotation escaping rules.
36. **SameSite Cookie:** Security attribute preventing the browser from sending cookies along with cross-site requests.
37. **SecurityAuditLog:** Database table recording high-impact administrative actions (price modifications, refunds, logins).
38. **Server-Side Rendering (SSR):** Generating full HTML pages on the server for each request before transmitting them to the client.
39. **Single Source of Truth:** Designing data structures so that every piece of business data is mastered in exactly one location.
40. **Soft Delete:** Retaining database records while setting a timestamp flag (`deletedAt = now()`) to preserve historical relations.
41. **State Machine:** Mathematical model representing a system with distinct states and allowable transitions (e.g., order statuses).
42. **Streaming Response:** Transmitting HTTP response bytes progressively (via `ReadableStream`) to prevent memory spikes during large CSV downloads.
43. **Tailwind CSS v4:** Modern utility-first CSS framework with native Turbopack compilation and CSS custom properties.
44. **Timing-Safe Equal:** Cryptographic comparison comparing two buffers in constant time to prevent timing side-channel attacks.
45. **Token Bucket:** Algorithm used for rate limiting traffic burstiness.
46. **Turbopack:** High-performance Rust-based bundler powering Next.js development and compilation.
47. **TypeScript Generic:** Reusable type template enabling strong typing across diverse data structures (e.g., `ApiResponse<T>`).
48. **`useCallback`:** React hook that memoizes a function definition across re-renders to maintain referential equality.
49. **`useEffect` Purity:** React 19 guideline forbidding synchronous `setState` calls directly within effect bodies.
50. **Variant Matrix:** Two-dimensional grid representing garment SKUs across sizes (XS-XL) and colorways.
51. **Zero-Configuration Fallback:** Architectural design allowing features (e.g., image storage) to default to local disk when cloud credentials are omitted.

---

## 2. 25 Full-Stack Technical Interview Questions & Answers

### 1. How does NOIR & GOLD prevent inventory overselling during high-concurrency drop events?
**Answer:** The platform implements atomic database decrements combined with optimistic locking:
`UPDATE ProductVariant SET stock = stock - :qty WHERE id = :id AND stock >= :qty`.
If another concurrent transaction has already purchased the remaining stock, the condition fails, zero rows are affected, and the application throws `INSUFFICIENT_STOCK`. Additionally, an `InventoryReservation` row with a 15-minute expiration window holds the stock during checkout.

### 2. Why was SQLite selected for this project, and how would you transition to PostgreSQL in production?
**Answer:** SQLite requires zero configuration, stores data in a single file (`dev.db`), and delivers microsecond in-process reads, making it ideal for prototyping, testing, and single-instance deployments. To transition to PostgreSQL, we update the `datasource db` provider in `backend/prisma/schema.prisma` from `sqlite` to `postgresql`, generate a migration with `prisma migrate dev`, and configure a managed connection pool (e.g., PgBouncer) in production.

### 3. What is the difference between React Server Components (RSC) and Client Components in Next.js 16?
**Answer:** Server Components run exclusively on the server at request time, have direct access to backend resources (databases, file systems), and send pure HTML to the client with zero JavaScript footprint. Client Components (declared with `"use client"`) are bundled and hydrated in the browser, enabling React hooks (`useState`, `useEffect`), event listeners, and interactive UI logic.

### 4. Explain the soft-delete architecture implemented in this project and why physical deletes are prohibited.
**Answer:** Physical row deletion (`DELETE FROM Product`) breaks relational foreign keys and destroys historical invoices and receipts. We add a nullable `deletedAt DateTime?` column with an index `@@index([deletedAt])`. Active queries filter for `where: { deletedAt: null }`. Archiving a garment sets `deletedAt = new Date()`, which removes it from the catalog while preserving historical order records.

### 5. How are payment webhooks protected against forgery and replay attacks?
**Answer:** Every incoming webhook must supply `x-payment-signature` and `x-payment-timestamp`. The server computes an HMAC-SHA256 hash using the server secret `PAYMENT_WEBHOOK_SECRET` over the raw payload and verifies it using `crypto.timingSafeEqual`. To block replay attacks, the server verifies that the timestamp is within 300 seconds of the server's current time.

### 6. Why did we eliminate the `DEFAULT_WEBHOOK_SECRET` fallback?
**Answer:** Hardcoded fallback secrets in source code allow attackers to forge webhook payloads if environment secrets are not configured. Eliminating the fallback enforces a "fail-closed" security policy: if `PAYMENT_WEBHOOK_SECRET` is unset in production, the server immediately returns HTTP 500 rather than accepting forged signatures.

### 7. How does the admin authentication system enforce Role-Based Access Control (RBAC)?
**Answer:** When an admin logs in, an HMAC-signed session cookie (`admin-token`) is issued encoding their email and role (`ADMIN` or `STAFF`). The `admin-auth-guard.ts` middleware verifies this cookie on every protected request. Privileged operations (modifying prices, issuing refunds, archiving products) require `requireAdminRole()`, rejecting staff with HTTP 403 Forbidden.

### 8. Explain how the capacity ledger prevents refund overpayment.
**Answer:** The refund service performs an aggregate query: $\sum \text{Refunds where status = COMPLETED}$. The maximum refundable capacity is calculated as $\text{Captured Total} - \text{Total Prior Refunds}$. If an admin attempts to refund more than this capacity, the service throws `CAPACITY_EXCEEDED` and aborts the transaction.

### 9. Why does the application use streaming for CSV export rather than generating the file in memory?
**Answer:** Accumulating thousands of order records into an in-memory string can cause memory exhaustion and crash the Node process. The export route (`/api/v1/admin/orders/export`) creates a `ReadableStream` that transforms and pipes database chunks directly to the HTTP client using RFC-4180 escaping, keeping server RAM usage constant regardless of dataset size.

### 10. How are test suites isolated to prevent corrupting the development database?
**Answer:** Tests use `fs.mkdtempSync` to create an ephemeral temporary directory and copy `backend/prisma/dev.db` into it. The `DATABASE_URL` is dynamically pointed to this copy. All writes occur against the isolated clone, keeping development data pristine.

### 11. What is the purpose of `Sec-Fetch-Site` inspection in the CSRF guard?
**Answer:** `Sec-Fetch-Site` is an HTTP request header sent by modern browsers indicating the relationship between the origin making the request and the target origin. If `Sec-Fetch-Site: cross-site`, the request originated from a foreign domain, allowing the server to block Cross-Site Request Forgery (CSRF) attempts immediately.

### 12. How does the image upload pipeline support both local storage and cloud S3?
**Answer:** The storage service (`storage-service.ts`) inspects environment variables. If `AWS_ACCESS_KEY_ID` and `AWS_S3_BUCKET_NAME` are configured, it uses `@aws-sdk/client-s3` to upload directly to S3. If unconfigured, it seamlessly falls back to saving files in `public/uploads/`, providing a zero-configuration developer experience.

### 13. How does React 19 handle lifecycle state updates in `useEffect`?
**Answer:** React 19's ESLint rules strictly flag synchronous state mutations directly inside `useEffect` (`react-hooks/set-state-in-effect`) because they trigger cascading re-renders and race conditions. We resolve this by declaring an asynchronous loader with a cancellation flag (`let ignore = false; return () => { ignore = true; }`) or driving state through event handlers.

### 14. What is the role of `tokenHash` in the `Order` model?
**Answer:** In guest checkout, customers do not have user accounts or passwords. To allow them to view order tracking (`/orders/[id]?token=...`) without exposing orders to enumeration attacks (BOLA / IDOR), the server issues a cryptographically random HMAC token and stores its SHA-256 hash in `tokenHash`. Requests must present the matching token to view the order.

### 15. Explain how courier dispatching is validated in the order state machine.
**Answer:** Transitioning an order from `PROCESSING` to `SHIPPED` enforces business invariants: the update payload must include both `courierName` (e.g., TCS, Leopards) and `trackingNumber`. If either field is missing, the service rejects the transition, ensuring customers are never given a "Shipped" status without real tracking information.

### 16. How does the dual rate limiter differentiate between malicious bots and legitimate users?
**Answer:** It checks two dimensions independently: the client's IP address (max 10 orders per 15 min) and the customer's phone number (max 5 orders per 15 min). This blocks distributed botnets that rotate IP addresses while using the same phone number, as well as single-source automated scrapers.

### 17. How does the application prevent SQL injection vulnerabilities?
**Answer:** All database access is routed through Prisma ORM. Prisma parses queries into parameterized SQL statements where parameters are passed separately to the database engine rather than concatenated as strings, neutralizing SQL injection vectors.

### 18. Why is the `VariantMatrixBuilder` crucial for luxury couture e-commerce?
**Answer:** Haute couture garments are produced in bespoke combinations of sizes (XS to Custom) and artisanal fabric colorways. The `VariantMatrixBuilder` enables administrators to dynamically generate SKUs, assign individual stock levels, configure price deltas, and preview color swatches within a single unified administrative view.

### 19. What is the significance of the `SecurityAuditLog` table?
**Answer:** High-risk actions—such as administrative logins, price modifications, product archiving, and refund issuance—must have an immutable audit trail. `SecurityAuditLog` records who performed the action, target resources, client IP addresses, timestamps, and JSON snapshots of state changes for auditing and dispute resolution.

### 20. How does the frontend handle responsive image loading and cumulative layout shift (CLS)?
**Answer:** Next.js `<Image />` requires explicit aspect ratios (`width` and `height` or `fill`). It automatically generates responsive `srcset` attributes and serves modern formats (WebP/AVIF). This reserves space in the DOM before image assets finish downloading, maintaining a Cumulative Layout Shift (CLS) of 0.

### 21. How do Express controllers differ from Next.js route handlers?
**Answer:** Express controllers receive `(req: Request, res: Response)` objects and rely on Express middleware (CORS, Morgan, body-parser) for request processing. Next.js App Router route handlers export named HTTP functions (`GET`, `POST`) receiving standard Web API `Request` objects and returning Web API `Response` / `NextResponse` instances.

### 22. What happens to inventory when an order is cancelled?
**Answer:** The order cancellation service executes an atomic transaction that: (1) transitions `orderStatus` to `CANCELLED`, (2) restores the exact quantities of each item back to their respective `ProductVariant.stock`, (3) marks associated `InventoryReservation` rows as released, and (4) logs the event in `InventoryAuditLog`.

### 23. What are the benefits of using an npm workspace monorepo?
**Answer:** Monorepos enable sharing schemas and database models across frontend and backend packages without duplicating code or publishing private npm packages. They allow running synchronized test suites across all layers and keeping configuration files unified.

### 24. How does the application ensure timing-attack resistance during HMAC verification?
**Answer:** Comparing string hashes using standard equality (`hashA === hashB`) returns false as soon as the first non-matching byte is found, leaking timing information to attackers. We use `crypto.timingSafeEqual()`, which compares buffers in constant time regardless of where mismatches occur.

### 25. How is the Next.js production build optimized?
**Answer:** Next.js analyzes the component tree during `next build`, performs tree-shaking to eliminate unused code, generates static HTML for static pages, compiles CSS with Tailwind v4, and generates optimized server-side bundles with `serverExternalPackages` configured to prevent duplicating heavy native modules.
