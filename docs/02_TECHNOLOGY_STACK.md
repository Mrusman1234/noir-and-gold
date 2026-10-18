# Document 2: Technology Stack & Tooling Guide

## 1. Complete Technology Inventory

The NOIR & GOLD repository employs an enterprise TypeScript stack engineered for type safety, sub-second latency, and resilience. Below is the audited inventory of every core dependency, framework, and tool:

| Package / Tool | Version | Architecture Role | Problem Solved |
| :--- | :--- | :--- | :--- |
| **Next.js** | `16.4.0` | Frontend Framework & SSR | App Router file-based routing, Server Components, streaming SSR, API routes |
| **React** | `19.3.0` | UI Component Engine | Declarative component hierarchy, modern hooks, fine-grained DOM reconciliation |
| **React DOM** | `19.3.0` | Browser DOM Renderer | Client rendering, hydration, and event handling |
| **TypeScript** | `^5.6.3` / `^5` | Programming Language | Compile-time static analysis, structural typing, strict null safety |
| **Prisma ORM** | `^5.22.0` | Database ORM & Migrations | Type-safe query generation, SQLite synchronization, relational modeling |
| **SQLite** | `3.x` | Relational Storage Engine | Zero-configuration, file-based relational database ideal for development |
| **Tailwind CSS** | `^4.0.0` | Styling & Design System | Utility-first CSS, high-performance Turbopack build engine, design tokens |
| **Express** | `^4.21.2` | Backend REST Microservice | High-performance routing, microservice endpoints, external service proxy |
| **Morgan** | `^1.12.1` | HTTP Request Logger | Express access logging, timing metrics, and development debugging |
| **CORS** | `^2.8.5` | Cross-Origin Middleware | Cross-origin resource sharing policy between frontend and backend |
| **AWS SDK S3** | `^3.1152.0`| Cloud Object Storage | Multipart S3/Cloudflare R2 image asset uploading |
| **clsx & tailwind-merge**| `^2.1.1` & `^3.7.0` | Class Name Composition | Conditional styling without CSS class collision |
| **tsx** | `^4.19.2` | TypeScript Execution Engine | Zero-compilation TypeScript execution for tests, seeding, and server watch |
| **ESLint** | `^9.0.0` | Static Code Analysis | Linting, React 19 hook safety checks, dead code identification |
| **PDFKit** | `^0.15.0` | PDF Compilation Engine | Programmatic document synthesis, vector typography, and report generation |

---

## 2. Why Each Technology Was Chosen & Alternative Comparisons

### 2.1 Next.js 16 (App Router) vs. Traditional SPA (Vite / CRA)
- **Why Chosen:** Luxury e-commerce demands instant First Contentful Paint (FCP) and optimal SEO for garment discovery. Next.js 16 App Router renders initial markup on the server, avoiding blank screen flashes while streaming hydrated components to the browser.
- **Alternatives Considered:** Vite + React SPA. Rejected because single-page applications defer all rendering to client JavaScript, degrading SEO for search crawlers and increasing initial bundle load times on mobile devices.

### 2.2 React 19 vs. React 18
- **Why Chosen:** React 19 introduces modernized hook validation, optimized server actions, enhanced asset preloading, and cleaner hydration diagnostics.
- **Design Impact:** Strict enforcement of lifecycle purity eliminates race conditions during asynchronous catalog fetching.

### 2.3 Prisma ORM vs. Raw SQL / TypeORM
- **Why Chosen:** Prisma auto-generates TypeScript types directly from the schema file (`schema.prisma`). Any change in the data model (such as adding `deletedAt` soft deletes) immediately propagates type definitions across the entire codebase.
- **Alternatives Considered:** TypeORM / Knex. Rejected due to manual type synchronization, verbose migration syntax, and lack of compile-time relation verification.

### 2.4 Tailwind CSS v4 vs. CSS Modules / Styled Components
- **Why Chosen:** Tailwind CSS v4 integrates natively with Turbopack, providing near-instant hot-module replacement and stripping unused classes to produce production stylesheets smaller than 25 KB.
- **Alternatives Considered:** Styled Components. Rejected because CSS-in-JS incurs runtime JavaScript evaluation overhead that hampers client performance.

---

## 3. Concrete Code Implementations in NOIR & GOLD

### 3.1 Type-Safe Prisma Queries with Soft-Delete Filtering
```typescript
// frontend/src/lib/catalog-service.ts
import { prisma } from "@/lib/prisma";

export async function getActiveGarments(categorySlug?: string) {
  return await prisma.product.findMany({
    where: {
      deletedAt: null, // Standardized soft-delete filter
      isSoldOut: false,
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    },
    include: {
      variants: {
        where: { isActive: true },
        select: { id: true, size: true, colorName: true, stock: true, sku: true, pricePkr: true },
      },
      images: {
        orderBy: { displayOrder: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
```

### 3.2 Dynamic Class Name Composition with `clsx` & `twMerge`
```typescript
// frontend/src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// Example usage in an atelier component:
// <button className={cn("px-4 py-2 rounded-full", isSelected ? "bg-[#C9A84C] text-black" : "bg-neutral-900 text-white")} />
```

### 3.3 Express REST Controller with Dependency Decoupling
```typescript
// backend/src/controllers/product.controller.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      include: { variants: true, images: true, category: true },
    });
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch products" });
  }
};
```

---

## 4. Configuration Guide & Diagnostics

### 4.1 TypeScript Configuration (`tsconfig.json`)
The monorepo enforces strict type safety:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 4.2 Next.js Configuration (`next.config.ts`)
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
  // Ensure Node native modules and Prisma clients bundle seamlessly
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
```

### 4.3 Tailwind CSS v4 Engine Configuration
Tailwind v4 utilizes the new `@import "tailwindcss";` directive directly within `frontend/src/app/globals.css`. Design tokens for the luxury atelier are declared as native CSS custom properties:
```css
@import "tailwindcss";

@layer base {
  :root {
    --color-noir: #0D0D0D;
    --color-gold: #C9A84C;
    --color-parchment: #F9F6F0;
    --color-charcoal: #1F2022;
    --color-muted: #8E8D8A;
  }
}
```

### 4.4 ESLint 9 Flat Configuration (`eslint.config.mjs`)
Configured to extend Next.js core web vitals and React 19 hook guidelines:
- Enforces strict purity inside React `useEffect` hooks.
- Flags unused imports, variables, and untyped `any` castings.
- Guarantees zero lint errors during continuous integration builds.
