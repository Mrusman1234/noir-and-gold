# Document 4: Frontend Architecture & App Router Deep-Dive

## 1. Next.js 16 App Router Mechanics

The NOIR & GOLD user interface is constructed using the Next.js 16 App Router (`frontend/src/app`), leveraging React 19's Server Components and Client Components to achieve fast initial page loads, optimal SEO indexing, and reactive client-side interactions.

### 1.1 Server Components vs. Client Components
In Next.js App Router, all components inside the `app/` directory are **React Server Components (RSC)** by default unless marked with the `"use client"` directive.

- **Server Components (e.g., `app/layout.tsx`, static page wrappers):**
  - Execute exclusively on the server at request time or build time.
  - Can directly import server-only modules (such as database queries or file system utilities).
  - Ship **zero JavaScript** to the browser bundle, drastically reducing initial payload sizes.
- **Client Components (marked with `"use client"`, e.g., `ProductsManagerView.tsx`, `cart/page.tsx`):**
  - Hydrated in the browser to enable DOM event listeners, state hooks (`useState`, `useReducer`), and lifecycle effects (`useEffect`, `useCallback`).
  - Essential for interactive features: modal dialogs, variant selectors, drag-and-drop file uploaders, and dynamic forms.

```mermaid
flowchart TD
    subgraph Server Boundary
        Layout[app/layout.tsx - Server Component]
        Page[app/page.tsx - Server Component]
    end

    subgraph Hydration Boundary "use client"
        Nav[Navbar.tsx - Client Component]
        Hero[HeroSection.tsx - Client Component]
        Bag[CartDrawer.tsx - Client Component]
    end

    Layout --> Nav
    Layout --> Page
    Page --> Hero
    Nav --> Bag
```

---

## 2. Page Routes & Data Flow Specification

| Route Path | Type | State / Hooks | Data Fetching Strategy | Rendered Output |
| :--- | :--- | :--- | :--- | :--- |
| `/` | Server / Client | Hero animation, featured carousel | Server-side catalog prefetch | Atelier landing page, curated drops, brand narrative |
| `/collection` | Client | Category filters, sort order, search | Client fetch `/api/v1/products` | Responsive multi-column grid of luxury silhouettes |
| `/product/[slug]` | Client | Active variant, color hex, quantity | Dynamic slug lookup via API | Multi-angle image gallery, size picker, add-to-bag |
| `/cart` | Client | Items, subtotals, quantity | LocalStorage reactive sync | Itemized bag summary, delivery threshold bar |
| `/checkout` | Client | Shipping address, zone, payment | Zone calculation API | Multi-step checkout form, COD / gateway selector |
| `/orders/[id]` | Client | Order status, delivery tracking | HMAC-authenticated fetch | Customer order status timeline and courier details |
| `/admin` | Client | Tabs (Products, Orders, Upload) | Authenticated session API | Administrative operations dashboard |

---

## 3. Component Hierarchy & Organization

The UI is structured into modular component libraries within `frontend/src/components`:

```text
src/components/
├── admin/                     # Restricted Administrative Components
│   ├── AdminLayout.tsx        # Navigation header, tab switcher, staff sign-out
│   ├── ProductsManagerView.tsx# Garment CRUD, soft-delete archive, feedback toasts
│   ├── OrdersManagerView.tsx  # Order filtering drawer, courier dispatch, refund modal
│   ├── VariantMatrixBuilder.tsx# Dynamic SKU generator, stock allocation, color picker
│   └── ImageUploader.tsx      # Drag-and-drop multipart upload zone with preview
├── cart/                      # Shopping Bag Components
│   ├── CartDrawer.tsx         # Slide-over bag panel accessible from navbar
│   └── CartItemRow.tsx        # Individual garment row with quantity counter
├── checkout/                  # Order Finalization Components
│   ├── ShippingZoneSelector.tsx# Dynamic delivery calculation by province
│   └── PaymentMethodRadio.tsx # Selection cards for COD, JazzCash, EasyPaisa
├── common/                    # Generic Atoms & Molecules
│   ├── Modal.tsx              # Accessible dialog backdrop with keyboard escape
│   ├── Badge.tsx              # Status pill (ACTIVE, SOLD OUT, PENDING, SHIPPED)
│   └── Spinner.tsx            # Animated luxury gold spinner
└── layout/                    # Persistent Shell Components
    ├── Navbar.tsx             # Brand header, navigation links, bag counter
    └── Footer.tsx             # Atelier details, care guides, copyright
```

---

## 4. State Management Patterns

### 4.1 Shopping Bag State (Client-Side Persistence)
The shopping cart state is managed via a lightweight custom reactive hook that synchronizes with browser `localStorage`:
- **State Structure:**
  ```typescript
  interface CartItem {
    productId: string;
    variantId: string;
    title: string;
    slug: string;
    size: string;
    colorName: string;
    pricePkr: number;
    quantity: number;
    imageUrl: string;
    maxStock: number;
  }
  ```
- **Validation Guard:** Prevents the user from incrementing the cart quantity beyond the variant's `maxStock` verified at the time of addition.

### 4.2 Administrative Form & Mutation State
Admin views utilize structured local state with clean feedback mechanisms:
- **Asynchronous Cancellation Pattern (React 19 Safe):**
  ```typescript
  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        const res = await fetch("/api/v1/admin/products");
        const json = await res.json();
        if (!ignore && json.success) {
          setProducts(json.products);
        }
      } catch (err) {
        if (!ignore) showFeedback("error", "Failed to retrieve catalog");
      }
    }
    void loadData();
    return () => { ignore = true; };
  }, [showFeedback]);
  ```

---

## 5. Styling System: Tailwind CSS v4 & Haute Couture Design Tokens

The styling architecture is anchored on minimal elegance, luxury typography, and high-contrast editorial tones.

### 5.1 Color Palette Tokens
- **Noir (`#0D0D0D`):** Primary background, high-contrast headings, luxury framing.
- **Champagne Gold (`#C9A84C`):** Accent highlights, primary interactive buttons, badges.
- **Soft Parchment (`#F9F6F0`):** Light mode container backgrounds, crisp product cards.
- **Charcoal Slate (`#1F2022`):** Secondary buttons, card borders, subtle dividers.
- **Muted Silver (`#8E8D8A`):** Metadata, SKU codes, secondary captions.

### 5.2 Typography System
- **Serif Display:** `Cinzel` / `Playfair Display` for garment names, editorial quotes, and section titles.
- **Sans-Serif Body:** `Inter` / `Montserrat` for crisp pricing, specifications, and form fields.

---

## 6. Frontend Performance & Asset Optimization

1. **Next.js `<Image />` Component:**
   - Automatically converts source JPEGs into modern WebP/AVIF formats based on client browser support.
   - Enforces responsive `sizes` attributes to prevent layout shift (CLS = 0).
   - Implements blurred low-quality placeholders (LQIP) while high-resolution photography loads.
2. **Code Splitting & Dynamic Imports:**
   - Heavy administrative views (`VariantMatrixBuilder`, `OrdersManagerView`) are lazy-loaded when the administrator accesses their respective tabs, keeping the customer bundle light.
3. **Optimistic UI Updates:**
   - When administrators archive or restore garments, UI state updates optimistically before server round-trips complete, delivering instant responsiveness.
