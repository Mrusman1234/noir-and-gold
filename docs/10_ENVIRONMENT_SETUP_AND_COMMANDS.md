# Document 10: Developer Environment Setup & CLI Reference

## 1. System Prerequisites

Before launching the NOIR & GOLD development environment, ensure your system meets the following specifications:
- **Node.js:** `v20.17.0` or higher (LTS recommended). Check with `node -v`.
- **npm:** `v10.0.0` or higher. Check with `npm -v`.
- **Git:** Installed and available on system PATH.
- **Operating System:** Windows 10/11 (PowerShell), macOS, or Linux.

---

## 2. Step-by-Step Installation & Setup

### Step 1: Clone Repository
```bash
git clone <repository_url>
cd "cloths store"
```

### Step 2: Install Monorepo Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Create `.env` in both `frontend/` and `backend/` directories.

#### `frontend/.env.local`:
```env
# Database Connection (Absolute or Relative SQLite path)
DATABASE_URL="file:../../backend/prisma/dev.db"

# Admin Authentication & Session Passphrase
ADMIN_SESSION_SECRET="noir-gold-super-secure-production-passphrase-2026"

# Payment Webhook Security (HMAC-SHA256)
PAYMENT_WEBHOOK_SECRET="whsec_noir_and_gold_development_secret_key_8899"

# Public API URLs
NEXT_PUBLIC_API_URL="http://localhost:3000/api/v1"
NEXT_PUBLIC_BACKEND_URL="http://localhost:5000/api"

# Optional Cloud Storage (Leave blank for local disk fallback)
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION="auto"
AWS_S3_BUCKET_NAME=""
```

#### `backend/.env`:
```env
PORT=5000
DATABASE_URL="file:./dev.db"
CLIENT_URL="http://localhost:3000"
NODE_ENV="development"
```

### Step 4: Synchronize Database & Seed Catalog
```bash
npm run backend:db:push
npm run backend:db:seed
```

### Step 5: Launch Development Servers
Open two terminal windows:
```bash
# Terminal 1: Backend Express REST API (:5000)
npm run backend:dev

# Terminal 2: Frontend Next.js Atelier (:3000)
npm run frontend:dev
```

---

## 3. Monorepo Script Reference

All scripts can be invoked from the root directory or targeted directly via npm workspaces:

| Script Command | Workspace Target | Action Performed |
| :--- | :--- | :--- |
| `npm run frontend:dev` | `frontend` | Launches Next.js dev server with Turbopack on port 3000 |
| `npm run frontend:build`| `frontend` | Compiles optimized Next.js production build |
| `npm run frontend:lint` | `frontend` | Executes ESLint 9 checks across all pages and components |
| `npm run frontend:typecheck`| `frontend` | Runs `tsc --noEmit` to verify type safety |
| `npm test` | `frontend` | Executes full native test runner across all 122 tests |
| `npm run backend:dev` | `backend` | Runs Express server with `tsx watch` for auto-reloading |
| `npm run backend:build` | `backend` | Compiles Express TypeScript code to `dist/app.js` |
| `npm run backend:start` | `backend` | Runs compiled Express server using standard Node.js |
| `npm run backend:db:push` | `backend` | Pushes Prisma schema modifications directly to SQLite |
| `npm run backend:db:seed` | `backend` | Populates database with artisanal garments and shipping zones |

---

## 4. Database Administration & Inspection

### Visualizing the Database with Prisma Studio
To inspect tables, edit records, or review foreign keys visually:
```bash
cd backend
npx prisma studio
```
Opens an interactive web GUI at `http://localhost:5555`.

### Regenerating Prisma Client Types
Whenever you edit `backend/prisma/schema.prisma`:
```bash
# Push schema changes to disk
npm run backend:db:push

# Regenerate client definitions for frontend
cd frontend
npx prisma generate --schema=../backend/prisma/schema.prisma
```

---

## 5. Troubleshooting & FAQ

### Problem 1: Port Already in Use (`EADDRINUSE: 3000` or `5000`)
- **Cause:** A previous instance of Next.js or Express is still running in the background.
- **Solution (Windows PowerShell):**
  ```powershell
  # Find PID occupying port 3000
  Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess
  # Kill process by PID
  Stop-Process -Id <PID> -Force
  ```

### Problem 2: Prisma Database File Locked (`dev.db-journal`)
- **Cause:** SQLite enters write lock when a test or crashed process held an uncommitted transaction.
- **Solution:** Close open terminals, terminate any zombie Node processes (`Stop-Process -Name node -Force`), and delete temporary `dev.db-journal` files if present.

### Problem 3: PowerShell Script Execution Policy Error
- **Error:** `File ... cannot be loaded because running scripts is disabled on this system.`
- **Solution:** Run PowerShell as Administrator and execute:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```

### Problem 4: Next.js Hydration Warning
- **Cause:** Browser extensions (e.g., password managers, translators) injecting extra HTML tags into the DOM before hydration.
- **Solution:** Ensure `suppressHydrationWarning` is added to `<body>` in `frontend/src/app/layout.tsx`.
