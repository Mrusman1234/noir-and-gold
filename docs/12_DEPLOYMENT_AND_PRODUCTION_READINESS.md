# Document 12: Production Deployment & Operations Guide

## 1. Production Architecture Options

Deploying NOIR & GOLD into production requires evaluating stateful persistence (database and media uploads) against stateless application logic.

```mermaid
flowchart TD
    DNS[Cloudflare DNS & Edge SSL] --> LB[Load Balancer / Ingress]
    LB --> NextJS[Next.js 16 Web Tier Container]
    LB --> ExpressAPI[Express 4 Catalog API Container]
    NextJS --> ManagedDB[(Managed PostgreSQL Database)]
    ExpressAPI --> ManagedDB
    NextJS --> CloudStorage[(AWS S3 / Cloudflare R2 Bucket)]
```

### Option A: Fly.io Containerized Deployment (Recommended)
- **Why Fly.io:** Supports persistent volume mounting (`/data`), allowing a single low-cost virtual machine to run SQLite with automated snapshots while colocating the Next.js and Express servers.
- **Reference:** See `docs/deployment-fly.md`.

### Option B: Vercel (Frontend) + Railway (Backend & Database)
- **Frontend:** Vercel natively hosts Next.js 16 with edge caching and automatic CI/CD git pushes.
- **Backend & Database:** Deploy Express and a managed PostgreSQL database on Railway or Supabase.

---

## 2. Multi-Stage Dockerfile Analysis

To achieve minimal container footprint (< 150 MB) and optimal security, employ a multi-stage Docker build:

```dockerfile
# Stage 1: Dependency Installation
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/
RUN npm ci

# Stage 2: Source Compilation
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN npm run backend:build
RUN npm run frontend:build

# Stage 3: Minimal Production Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Run as non-root user for security hardening
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/.next/static ./frontend/.next/static
COPY --from=builder /app/frontend/public ./frontend/public
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## 3. Database Migration Strategy: SQLite to PostgreSQL

While SQLite is lightweight and zero-maintenance for local development and initial low-traffic drops, production scale requires **PostgreSQL** to handle multi-threaded write concurrency and connection pooling.

### Steps to Migrate:
1. **Update `backend/prisma/schema.prisma`:**
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. **Execute Prisma Migration:**
   ```bash
   npx prisma migrate dev --name init_postgresql
   ```
3. **Data Transfer:** Export existing records via `sqlite3 dev.db .dump` or utilize a Node migration script reading from SQLite and writing via Prisma to PostgreSQL.

---

## 4. Cloud Object Storage Migration (AWS S3 / Cloudflare R2)

In production, ephemeral containers destroy local disk uploads (`/public/uploads`) whenever a container restarts or scales horizontally.

### Activating Cloud Storage:
Supply AWS S3 or Cloudflare R2 credentials in the production environment variables:
```env
AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
AWS_REGION="us-east-1"
AWS_S3_BUCKET_NAME="noir-and-gold-atelier-assets"
```
`frontend/src/lib/storage-service.ts` automatically detects these keys:
- Routes all multipart image uploads directly to S3 via `@aws-sdk/client-s3`.
- Returns immutable cloud CDN URLs (`https://assets.noirandgold.com/...`).

---

## 5. Production Secrets & Environment Variables

| Variable Name | Environment | Description & Required Security Standard |
| :--- | :--- | :--- |
| `DATABASE_URL` | Production | Postgres connection URI with SSL mode enabled (`sslmode=require`) |
| `ADMIN_SESSION_SECRET` | Production | 64-character high-entropy cryptographic passphrase |
| `PAYMENT_WEBHOOK_SECRET` | Production | Webhook secret issued by payment processor |
| `NODE_ENV` | Production | Set strictly to `production` (enables fail-closed guards) |
| `PORT` | Production | Bound to internal container port (e.g., 3000 or 8080) |

---

## 6. Backup & Disaster Recovery Strategy

If operating SQLite in a single-instance container:
1. **Hourly WAL Snapshots:** Execute `sqlite3 dev.db ".backup '/backups/backup-$(date +%s).db'"` via a background cron process.
2. **Offsite S3 Replication:** Pipe SQLite backup snapshots immediately to an encrypted offsite cloud storage bucket.
3. **Recovery RTO/RPO:**
   - **Recovery Point Objective (RPO):** Maximum 1 hour of transaction logs.
   - **Recovery Time Objective (RTO):** Under 5 minutes to spin up a replacement container and mount the latest snapshot.
