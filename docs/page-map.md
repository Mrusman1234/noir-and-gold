# Complete Page Map & Route Architecture

**Project:** NOIR & GOLD — Luxury Apparel E-Commerce Store  
**Document Version:** 1.0.0  
**Status:** Approved for Implementation Planning  
**Date:** October 2026  

---

## 1. Route Hierarchy & Access Control Matrix

The application routes are categorized into three distinct access levels:
- **Public (`PUBLIC`):** Accessible to all visitors without authentication.
- **Customer Authenticated (`CUSTOMER`):** Protected routes requiring an active customer session cookie; redirects to `/login` if unauthenticated.
- **Admin Authenticated (`ADMIN` / `STAFF`):** Protected routes requiring administrative or staff privileges; unauthorized requests are redirected to `/admin/login` with a `403` or `401` status.

| Route Path | App Router File Location | Access Level | Purpose & Core Functionality |
| :--- | :--- | :--- | :--- |
| **Storefront & Public** | | | |
| `/` | `app/(storefront)/page.tsx` | `PUBLIC` | Homepage: Editorial hero banner, featured collections, new arrivals carousel, brand manifesto. |
| `/shop` | `app/(storefront)/shop/page.tsx` | `PUBLIC` | Master Catalog: All active apparel with faceted filters (Category, Size, Color, Price, In-stock) and sorting. |
| `/shop/[category]` | `app/(storefront)/shop/[category]/page.tsx` | `PUBLIC` | Category Landing: Category hero, breadcrumb navigation, and filtered product grid (e.g., `/shop/men`, `/shop/women`). |
| `/shop/[category]/[subcategory]` | `app/(storefront)/shop/[category]/[subcategory]/page.tsx` | `PUBLIC` | Subcategory Grid: Deep-filtered view (e.g., `/shop/women/pret`, `/shop/men/formal-wear`). |
| `/collections/[slug]` | `app/(storefront)/collections/[slug]/page.tsx` | `PUBLIC` | Curated Lookbook / Campaign: Thematic collection view (e.g., `/collections/velvet-nocturne-2026`). |
| `/product/[slug]` | `app/(storefront)/product/[slug]/page.tsx` | `PUBLIC` | Product Detail Page (PDP): Multi-angle high-res gallery, size/color variant matrix, size chart modal, stock badge, Add to Cart. |
| `/cart` | `app/(storefront)/cart/page.tsx` | `PUBLIC` | Full Cart Page: Quantity adjustment, stock validation warnings, coupon code entry, order summary. |
| `/checkout` | `app/(storefront)/checkout/page.tsx` | `PUBLIC` (Guest / Customer) | COD Checkout: Pakistani shipping address entry, delivery zone rate calculation, order review, place order. |
| `/checkout/success/[orderNumber]` | `app/(storefront)/checkout/success/[orderNumber]/page.tsx` | `PUBLIC` | Order Confirmation: Detailed invoice receipt, order reference number, delivery timeline, printable copy. |
| `/track-order` | `app/(storefront)/track-order/page.tsx` | `PUBLIC` | Public Order Lookup: Status check via Order Number (`NG-YYYY-XXXXX`) and Phone Number without login. |
| `/about` | `app/(storefront)/about/page.tsx` | `PUBLIC` | Brand Story: Atelier philosophy, craftsmanship, Pakistani couture heritage. |
| `/contact` | `app/(storefront)/contact/page.tsx` | `PUBLIC` | Customer Care: Contact form, customer service email, operating hours, official WhatsApp link. |
| `/policy/returns-exchanges` | `app/(storefront)/policy/returns-exchanges/page.tsx` | `PUBLIC` | Return & Exchange Policy: Terms, 7-day inspection window, non-returnable items (custom/intimate). |
| `/policy/shipping-delivery` | `app/(storefront)/policy/shipping-delivery/page.tsx` | `PUBLIC` | Shipping Terms: Delivery zones (Karachi, Metros, Nationwide), timelines, COD handling procedures. |
| `/policy/terms` | `app/(storefront)/policy/terms/page.tsx` | `PUBLIC` | Terms of Service: Order acceptance terms, pricing accuracy policy, user obligations. |
| `/policy/privacy` | `app/(storefront)/policy/privacy/page.tsx` | `PUBLIC` | Privacy Policy: Data usage, cookie policies, order retention. |
| **Customer Auth & Portal** | | | |
| `/login` | `app/(auth)/login/page.tsx` | `PUBLIC` (Guest only) | Customer Login: Email & password authentication with redirect return URL support. |
| `/register` | `app/(auth)/register/page.tsx` | `PUBLIC` (Guest only) | Customer Registration: Name, email, Pakistani phone number, password. |
| `/forgot-password` | `app/(auth)/forgot-password/page.tsx` | `PUBLIC` (Guest only) | Password Recovery Request: Email submission for reset link. |
| `/reset-password` | `app/(auth)/reset-password/page.tsx` | `PUBLIC` (Guest only) | Password Reset Completion: Enter new password with verified security token. |
| `/account` | `app/(account)/page.tsx` | `CUSTOMER` | Customer Dashboard: Recent orders snapshot, default address summary, account shortcuts. |
| `/account/orders` | `app/(account)/orders/page.tsx` | `CUSTOMER` | Order History: Chronological list of user orders with status badges and reorder actions. |
| `/account/orders/[id]` | `app/(account)/orders/[id]/page.tsx` | `CUSTOMER` | Order Details: Full order breakdown, shipping address, courier tracking updates. |
| `/account/addresses` | `app/(account)/addresses/page.tsx` | `CUSTOMER` | Address Book: Add, edit, remove, and designate default Pakistani delivery addresses. |
| `/account/profile` | `app/(account)/profile/page.tsx` | `CUSTOMER` | Profile Settings: Update name, phone number, and change password. |
| `/account/wishlist` | `app/(account)/wishlist/page.tsx` | `CUSTOMER` | Saved Items: Grid of wishlisted items with quick "Move to Cart" button. |
| **Admin Operations** | | | |
| `/admin/login` | `app/(admin-auth)/admin/login/page.tsx` | `PUBLIC` (Admin only) | Admin Login: Dedicated credentials gate for store managers and staff. |
| `/admin/dashboard` | `app/(admin)/admin/dashboard/page.tsx` | `STAFF` / `ADMIN` | Overview Dashboard: Total PKR sales, order counts, low-stock warnings, recent activity feed. |
| `/admin/products` | `app/(admin)/admin/products/page.tsx` | `STAFF` / `ADMIN` | Product Catalog Table: Searchable, filterable list of all products with stock status and quick actions. |
| `/admin/products/new` | `app/(admin)/admin/products/new/page.tsx` | `ADMIN` | Product Creator: Title, slug, rich description, categories, image uploader, variant matrix generator. |
| `/admin/products/[id]/edit` | `app/(admin)/admin/products/[id]/edit/page.tsx` | `ADMIN` | Product Editor: Update product details, manage image order, modify variant pricing and attributes. |
| `/admin/categories` | `app/(admin)/admin/categories/page.tsx` | `ADMIN` | Category Management: Manage hierarchy, banners, display orders, and slug definitions. |
| `/admin/inventory` | `app/(admin)/admin/inventory/page.tsx` | `STAFF` / `ADMIN` | Stock Management: Inline stock adjustment, SKU search, threshold warnings, adjustment audit log. |
| `/admin/orders` | `app/(admin)/admin/orders/page.tsx` | `STAFF` / `ADMIN` | Orders Dashboard: Tabbed order pipeline (`Pending`, `Confirmed`, `Processing`, `Shipped`, etc.), multi-filter. |
| `/admin/orders/[id]` | `app/(admin)/admin/orders/[id]/page.tsx` | `STAFF` / `ADMIN` | Order Fulfillment View: Customer information, ordered items, status update selector, courier tracking assigner, packing slip printer. |
| `/admin/customers` | `app/(admin)/admin/customers/page.tsx` | `STAFF` / `ADMIN` | Customer Directory: Searchable list of registered accounts, total orders, lifetime spend. |
| `/admin/coupons` | `app/(admin)/admin/coupons/page.tsx` | `ADMIN` | Coupon Management: Create promo codes, configure percentage/fixed discounts, usage limits, expirations. |
| `/admin/shipping` | `app/(admin)/admin/shipping/page.tsx` | `ADMIN` | Shipping Zones: Configure zone rules (Local Karachi, Major Metros, Nationwide), rates, and free delivery thresholds. |
| `/admin/audit-logs` | `app/(admin)/admin/audit-logs/page.tsx` | `ADMIN` | Administrative Audit Log: Read-only trail of critical actions (stock adjustments, status transitions, price changes). |
| `/admin/settings` | `app/(admin)/admin/settings/page.tsx` | `ADMIN` | Store Settings: Store name, contact email, phone number, currency format settings. |

---

## 2. Shared Layouts & Navigation Architecture

### 2.1 Storefront Shared Layout (`app/(storefront)/layout.tsx`)
1. **Announcement Bar (Top):**
   - Slim banner: `"Complimentary Delivery on Orders Above PKR 7,500 Across Pakistan"`.
   - Contact shortcut: Customer support WhatsApp hotline.
2. **Main Navigation Header:**
   - Left: Desktop menu links (Women, Men, New In, Collections) with interactive hover reveals. Mobile hamburger toggle button.
   - Center: **NOIR & GOLD** typographic wordmark logo linking to `/`.
   - Right: Search modal trigger, Wishlist icon with badge count, Customer account/login icon, and Cart icon with live quantity counter.
3. **Persistent Footer:**
   - Column 1: Brand manifesto & newsletter subscription input (with gold button).
   - Column 2: Collections & Categories links.
   - Column 3: Customer Care & Policies (Returns & Exchanges, Shipping Information, Track Order, Contact).
   - Column 4: Official contact details (Karachi/Lahore atelier inquiry email, phone, Instagram, Facebook).
   - Bottom Bar: Copyright notice & localized payment notice: `"Cash on Delivery Available Nationwide"`.

### 2.2 Global Slide-Over Drawers (Overlay Components)
- **Slide-Over Cart Drawer (`components/storefront/CartDrawer.tsx`):**
  - Slides in from the right when the user adds an item or clicks the cart icon.
  - Displays line items with image thumbnails, selected size, color, quantity adjusters, subtotal, and free shipping progress meter.
  - Direct checkout CTA: `"Proceed to Checkout (COD)"`.
- **Mobile Menu Drawer (`components/storefront/MobileNavDrawer.tsx`):**
  - Slides in from the left on mobile viewports.
  - Accordion navigation for Men, Women, Collections, and Customer Account links.
- **Search Overlay Modal (`components/storefront/SearchModal.tsx`):**
  - Fullscreen or modal overlay with autofocus input, instantaneous live search results, recent searches, and popular categories.

### 2.3 Customer Portal Layout (`app/(account)/layout.tsx`)
- Two-column layout on desktop; tabbed bar on mobile.
- Left Sidebar Navigation:
  - Account Overview (`/account`)
  - Order History (`/account/orders`)
  - Saved Addresses (`/account/addresses`)
  - Profile & Security (`/account/profile`)
  - Wishlist (`/account/wishlist`)
  - Logout action (clears HttpOnly session cookies via API).
- Right Content Area: Responsive card container rendering the selected sub-page.

### 2.4 Admin Dashboard Layout (`app/(admin)/admin/layout.tsx`)
- **Collapsible Left Sidebar:**
  - Branding header: `"NOIR & GOLD — Portal"`.
  - Section 1: Overview (`Dashboard`).
  - Section 2: Catalog (`Products`, `Categories`, `Inventory`).
  - Section 3: Sales (`Orders`, `Customers`, `Coupons`).
  - Section 4: Configuration (`Shipping Zones`, `Audit Logs`, `Settings`).
- **Top Utility Header:**
  - Breadcrumb trail reflecting current route.
  - Quick action: View Live Store (opens storefront in new tab).
  - Admin user badge displaying role (`ADMIN` or `STAFF`) and Logout button.
- **Main Viewport:** High-contrast, dark-mode administrative workspace with optimized data density.

---

## 3. Desktop vs. Mobile Navigation Behavior

### 3.1 Desktop Navigation (>= 1024px)
- **Header State:** Sticky header with subtle frosted glass background blur (`backdrop-blur-md bg-[#0B0A0F]/85`) that compresses slightly upon scroll.
- **Menu Interaction:** Hovering over top-level items (e.g., "Women") reveals an elegant mega-dropdown detailing subcategories (Pret, Luxury Pret, Formal, Shawls) and a featured editorial campaign card.
- **Cart Interaction:** Clicking the cart icon opens the slide-over cart drawer without navigating away from the customer's current browsing position.
- **Search Interaction:** Clicking the search icon triggers a centered modal with keyboard navigation (`Esc` to close, `ArrowDown` to traverse results).

### 3.2 Mobile Navigation (< 1024px)
- **Header State:** Compact 56px sticky bar featuring the Hamburger Menu icon, centered NOIR & GOLD logo, and right-aligned Search and Cart badges.
- **Menu Interaction:** Tapping the hamburger icon opens a full-height dark drawer from the left. Categories expand via smooth accordion transitions.
- **Product Detail Page (PDP) Sticky Bar:** When scrolling past the main "Add to Cart" button on mobile, a fixed bottom action bar slides up showing the product title, price in PKR, and an instant "Add to Cart" button.
- **Touch Targets:** All clickable interactive elements (icons, size chips, buttons, filters) adhere to a strict minimum hit area of 44x44px.
