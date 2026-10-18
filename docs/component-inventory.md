# Frontend Component Inventory & Architecture

**Project:** NOIR & GOLD — Luxury Apparel E-Commerce Store  
**Document Version:** 1.0.0  
**Status:** Approved Component Inventory  
**Date:** October 2026  

---

## 1. Overview & Architectural Principles

This document catalogues all reusable components comprising the NOIR & GOLD web application. Components are structured around the following design and architectural rules:
1. **Server vs. Client Isolation:** Server Components pre-render data and metadata by default; Client Components (`"use client"`) are restricted strictly to interactive boundaries (cart toggles, modals, variant selectors, and forms).
2. **Prop Integrity:** Components accept strictly typed TypeScript props matching backend schema and DTO contracts.
3. **No Direct Style Hardcoding:** Styling relies entirely on the design tokens configured in `design-system.md` and `visual-design-specification.md`.
4. **Accessibility First:** Reusable primitives provide full keyboard navigation, ARIA semantics, and explicit focus states.

---

## 2. Global Layout Components

### 2.1 `StorefrontLayout`
- **File Location:** `src/app/(storefront)/layout.tsx`
- **Responsibility:** Master frame for public storefront routes; mounts AnnouncementBar, Header, Footer, and global slide-over drawers (Cart, Mobile Nav, Search).
- **Important Props / Data:** `{ children: React.ReactNode }`
- **Interaction Behavior:** Persists across storefront page navigations with zero layout thrashing; maintains persistent global cart drawer context.
- **Scope:** Storefront Pages.

### 2.2 `AccountLayout`
- **File Location:** `src/app/(account)/layout.tsx`
- **Responsibility:** Multi-column frame for customer account pages, binding `AccountSidebar` alongside child views.
- **Important Props / Data:** `{ children: React.ReactNode }`
- **Interaction Behavior:** Responsive stack on mobile; sticky navigation column on desktop.
- **Scope:** Authenticated Customer Portal.

### 2.3 `AdminLayout`
- **File Location:** `src/app/(admin)/admin/layout.tsx`
- **Responsibility:** Administrative workspace frame housing `AdminSidebar`, `AdminHeader`, and main content viewport.
- **Important Props / Data:** `{ children: React.ReactNode }`
- **Interaction Behavior:** Handles collapsed/expanded sidebar toggle states; enforces staff authentication guards.
- **Scope:** Protected Admin Portal.

### 2.4 `Container`
- **File Location:** `src/components/ui/Container.tsx`
- **Responsibility:** Constrains max content width according to responsive breakpoint rules (`max-w-7xl` or `1440px`) with standardized horizontal gutters (16px mobile, 48px desktop).
- **Important Props / Data:** `{ children: React.ReactNode; className?: string; size?: 'sm' | 'md' | 'lg' | 'full' }`
- **Interaction Behavior:** Static layout wrapper.
- **Scope:** Shared Universally.

### 2.5 `AnnouncementBar`
- **File Location:** `src/components/storefront/AnnouncementBar.tsx`
- **Responsibility:** Renders top promo message (free delivery threshold > PKR 7,500 across Pakistan and WhatsApp helpline link).
- **Important Props / Data:** `{ message: string; secondaryLink?: { label: string; href: string } }`
- **Interaction Behavior:** Sticky at very top of screen; smooth height transition.
- **Scope:** Storefront Pages.

### 2.6 `StorefrontFooter`
- **File Location:** `src/components/storefront/Footer.tsx`
- **Responsibility:** 4-column luxury footer displaying brand manifesto, category links, customer care policies, contact info, and COD payment disclaimer.
- **Important Props / Data:** Static navigation definitions and newsletter submission handler.
- **Interaction Behavior:** Includes active email newsletter input with loading and success feedback.
- **Scope:** Storefront Pages.

---

## 3. Navigation Components

### 3.1 `StorefrontHeader`
- **File Location:** `src/components/storefront/Header.tsx`
- **Responsibility:** Pinned luxury header containing mobile hamburger toggle, centered NOIR & GOLD logo, navigation links, and utility icons.
- **Important Props / Data:** `{ cartItemCount: number; wishlistItemCount: number; isAuthenticated: boolean }`
- **Interaction Behavior:** Listens to window scroll; applies `backdrop-blur-md` and dark opacity when scrolled > 20px; triggers CartDrawer and SearchModal.
- **Scope:** Storefront Pages.

### 3.2 `DesktopNavMenu`
- **File Location:** `src/components/storefront/DesktopNavMenu.tsx`
- **Responsibility:** Horizontal navigation links (Women, Men, Collections) with interactive hover dropdown reveals.
- **Important Props / Data:** `{ categories: CategoryTreeItem[] }`
- **Interaction Behavior:** Hovering a category triggers an animated dropdown showing subcategories and editorial collection teasers.
- **Scope:** Storefront Pages (Desktop >= 1024px).

### 3.3 `MobileNavDrawer`
- **File Location:** `src/components/storefront/MobileNavDrawer.tsx`
- **Responsibility:** Left slide-in navigation drawer for mobile screens.
- **Important Props / Data:** `{ isOpen: boolean; onClose: () => void; categories: CategoryTreeItem[] }`
- **Interaction Behavior:** Smooth slide transition from left; accordion accordions for subcategories; locks body scroll when open.
- **Scope:** Storefront Pages (Mobile < 1024px).

### 3.4 `SearchModal`
- **File Location:** `src/components/storefront/SearchModal.tsx`
- **Responsibility:** Overlay modal providing real-time debounced product and category search.
- **Important Props / Data:** `{ isOpen: boolean; onClose: () => void }`
- **Interaction Behavior:** Auto-focuses input upon opening; debounces queries by 300ms; displays live product cards with prices in PKR; handles `Escape` key close.
- **Scope:** Shared Across Storefront.

### 3.5 `Breadcrumbs`
- **File Location:** `src/components/ui/Breadcrumbs.tsx`
- **Responsibility:** Navigational breadcrumb trail (e.g., `Home / Women / Pret / Midnight Velvet`).
- **Important Props / Data:** `{ items: Array<{ label: string; href?: string }> }`
- **Interaction Behavior:** Semantic HTML with schema.org `BreadcrumbList` JSON-LD output.
- **Scope:** Storefront & Admin Pages.

### 3.6 `AdminSidebar`
- **File Location:** `src/components/admin/AdminSidebar.tsx`
- **Responsibility:** Collapsible left navigation bar for store administrators.
- **Important Props / Data:** `{ isCollapsed: boolean; onToggle: () => void; currentPath: string }`
- **Interaction Behavior:** Highlights active route; collapses to icon-only rail on toggle.
- **Scope:** Admin Portal.

### 3.7 `AdminHeader`
- **File Location:** `src/components/admin/AdminHeader.tsx`
- **Responsibility:** Top administrative bar featuring breadcrumbs, live store link, admin user badge, and logout trigger.
- **Important Props / Data:** `{ user: { name: string; role: 'ADMIN' | 'STAFF' } }`
- **Interaction Behavior:** Provides dropdown menu for admin profile and secure logout.
- **Scope:** Admin Portal.

---

## 4. Homepage Components

### 4.1 `HeroBanner`
- **File Location:** `src/components/storefront/HeroBanner.tsx`
- **Responsibility:** Editorial campaign hero with photography, Cormorant Garamond headline, and primary CTAs.
- **Important Props / Data:** `{ campaignTitle: string; subtitle: string; primaryCta: LinkItem; secondaryCta: LinkItem; imageUrl: string }`
- **Interaction Behavior:** High visual impact; CTA clicks smoothly transition to `/shop/women` or `/shop/men`.
- **Scope:** Homepage.

### 4.2 `CollectionShowcase`
- **File Location:** `src/components/storefront/CollectionShowcase.tsx`
- **Responsibility:** Split 2-column editorial cards showcasing major seasonal collections.
- **Important Props / Data:** `{ collections: Array<{ title: string; subtitle: string; slug: string; imageUrl: string }> }`
- **Interaction Behavior:** Hover on desktop triggers slight image zoom (`scale-105`) and gold underline highlight.
- **Scope:** Homepage.

### 4.3 `FeaturedCarousel`
- **File Location:** `src/components/storefront/FeaturedCarousel.tsx`
- **Responsibility:** Horizontal carousel or grid displaying new arrivals or curated products.
- **Important Props / Data:** `{ title: string; products: ProductSummary[] }`
- **Interaction Behavior:** Touch-swipable on mobile; left/right arrow controls on desktop.
- **Scope:** Homepage & Category Pages.

### 4.4 `CraftsmanshipSpotlight`
- **File Location:** `src/components/storefront/CraftsmanshipSpotlight.tsx`
- **Responsibility:** Visual narrative highlighting raw silks, velvets, hand-embroidery, and bespoke atelier quality.
- **Important Props / Data:** `{ heading: string; description: string; detailImageUrl: string }`
- **Interaction Behavior:** Static editorial presentation.
- **Scope:** Homepage & About Page.

### 4.5 `TrustFeaturesBar`
- **File Location:** `src/components/storefront/TrustFeaturesBar.tsx`
- **Responsibility:** 4-point trust banner: Cash on Delivery nationwide, 1-3 day delivery, 7-day exchanges, and WhatsApp concierge.
- **Important Props / Data:** Static feature definitions.
- **Interaction Behavior:** Responsive 4-column desktop, 2-column mobile grid.
- **Scope:** Homepage & Cart/Checkout.

### 4.6 `NewsletterSection`
- **File Location:** `src/components/storefront/NewsletterSection.tsx`
- **Responsibility:** VIP email capture form with privacy assurance and gold CTA.
- **Important Props / Data:** `{ onSubscribe: (email: string) => Promise<boolean> }`
- **Interaction Behavior:** Immediate inline validation and success toast.
- **Scope:** Homepage & Footer.

---

## 5. Product Catalog Components

### 5.1 `ProductCard`
- **File Location:** `src/components/storefront/ProductCard.tsx`
- **Responsibility:** Core catalog card presenting 3:4 portrait image, alternate hover image, title, category, PKR price, sale discount, micro-badge, and wishlist button.
- **Important Props / Data:** `{ product: ProductSummary; onWishlistToggle?: (id: string) => void; isWishlisted?: boolean }`
- **Interaction Behavior:** Hover cross-fades image and displays "Quick Add" size drawer on desktop. Clicking navigates to `/product/[slug]`.
- **Scope:** Shared Across Catalog, Search, and Wishlist.

### 5.2 `ProductGrid`
- **File Location:** `src/components/storefront/ProductGrid.tsx`
- **Responsibility:** Responsive CSS grid rendering ProductCards (1-col/2-col mobile, 3-col tablet, 4-col desktop).
- **Important Props / Data:** `{ products: ProductSummary[]; isLoading?: boolean }`
- **Interaction Behavior:** Renders skeleton cards during loading state.
- **Scope:** Catalog, Collection, and Search Views.

### 5.3 `CatalogFilterSidebar`
- **File Location:** `src/components/storefront/CatalogFilterSidebar.tsx`
- **Responsibility:** Sticky desktop sidebar containing faceted filters (Categories, Sizes, Colors, Price Range, In-Stock toggle).
- **Important Props / Data:** `{ availableFilters: FilterOptions; activeFilters: ActiveFilters; onFilterChange: (filters: ActiveFilters) => void; onReset: () => void }`
- **Interaction Behavior:** Updating a filter pushes new URL search parameters without full page reload.
- **Scope:** Shop & Category Pages (Desktop >= 1024px).

### 5.4 `MobileFilterDrawer`
- **File Location:** `src/components/storefront/MobileFilterDrawer.tsx`
- **Responsibility:** Bottom/side drawer containing faceted filters for mobile screens.
- **Important Props / Data:** `{ isOpen: boolean; onClose: () => void; activeFilters: ActiveFilters; onApply: (filters: ActiveFilters) => void }`
- **Interaction Behavior:** Slides in on trigger; includes sticky bottom action bar with "Apply Filters" button displaying matching product count.
- **Scope:** Shop & Category Pages (Mobile < 1024px).

### 5.5 `CatalogSortSelector`
- **File Location:** `src/components/storefront/CatalogSortSelector.tsx`
- **Responsibility:** Clean dropdown allowing sorting by: Newest Arrivals, Price: Low to High, Price: High to Low, Best Sellers.
- **Important Props / Data:** `{ activeSort: string; onSortChange: (sort: string) => void }`
- **Interaction Behavior:** Accessible dropdown matching royal aubergine design tokens.
- **Scope:** Catalog Pages.

---

## 6. Product Details (PDP) Components

### 6.1 `ProductGallery`
- **File Location:** `src/components/storefront/ProductGallery.tsx`
- **Responsibility:** High-resolution multi-image presentation; supports main viewport, thumbnail strip, zoom lens, and fullscreen modal.
- **Important Props / Data:** `{ images: ProductImage[]; selectedColor?: string }`
- **Interaction Behavior:** Clicking thumbnail changes active view; desktop hover triggers zoom lens; mobile supports touch swipe.
- **Scope:** Product Detail Page.

### 6.2 `ColorSwatchSelector`
- **File Location:** `src/components/storefront/ColorSwatchSelector.tsx`
- **Responsibility:** Displays circular color swatches with active gold ring indicator and color name label.
- **Important Props / Data:** `{ colors: Array<{ name: string; hex: string }>; selectedColor: string; onSelectColor: (color: string) => void }`
- **Interaction Behavior:** Selecting a swatch updates the gallery image set and filters size stock.
- **Scope:** Product Detail Page & Quick View.

### 6.3 `SizeSelector`
- **File Location:** `src/components/storefront/SizeSelector.tsx`
- **Responsibility:** Renders rectangular size chips (`XS`, `S`, `M`, `L`, `XL`) with real-time stock indicator and out-of-stock lockout.
- **Important Props / Data:** `{ sizes: Array<{ size: string; stock: number }>; selectedSize: string; onSelectSize: (size: string) => void; onOpenSizeGuide: () => void }`
- **Interaction Behavior:** Out-of-stock sizes rendered crossed out and disabled; clicking triggers immediate stock status update.
- **Scope:** Product Detail Page.

### 6.4 `StockStatusBadge`
- **File Location:** `src/components/storefront/StockStatusBadge.tsx`
- **Responsibility:** Visual stock indicator dot and message ("In Stock", "Only 2 items left", "Sold Out").
- **Important Props / Data:** `{ stockQuantity: number }`
- **Interaction Behavior:** Dynamic color shifts: Emerald (`#2ECC71`), Amber (`#F39C12`), or Rose (`#E74C3C`).
- **Scope:** Product Detail Page & Quick View.

### 6.5 `SizeGuideModal`
- **File Location:** `src/components/storefront/SizeGuideModal.tsx`
- **Responsibility:** Interactive modal displaying size charts with Inches / Centimeters measurement toggle.
- **Important Props / Data:** `{ isOpen: boolean; onClose: () => void; category: string }`
- **Interaction Behavior:** Toggle button updates measurement numbers; includes measurement guide graphic.
- **Scope:** Product Detail Page.

### 6.6 `ProductAccordion`
- **File Location:** `src/components/storefront/ProductAccordion.tsx`
- **Responsibility:** Expandable accordion sections for Fabric & Composition, Wash & Care, Shipping & Delivery (COD), and 7-Day Returns.
- **Important Props / Data:** `{ items: Array<{ title: string; content: React.ReactNode }> }`
- **Interaction Behavior:** Smooth animated height expansion; accessible keyboard expand/collapse.
- **Scope:** Product Detail Page.

### 6.7 `MobileStickyBuyBar`
- **File Location:** `src/components/storefront/MobileStickyBuyBar.tsx`
- **Responsibility:** Fixed bottom action bar on mobile when scrolled past primary Add to Cart button.
- **Important Props / Data:** `{ productTitle: string; pricePkr: number; selectedVariantId?: string; onAddToCart: () => void; isOutOfStock: boolean }`
- **Interaction Behavior:** Slides up smoothly using intersection observer on main CTA; full-width touch button.
- **Scope:** Product Detail Page (Mobile < 1024px).

---

## 7. Cart & Checkout Components

### 7.1 `CartDrawer`
- **File Location:** `src/components/storefront/CartDrawer.tsx`
- **Responsibility:** Slide-over right drawer displaying cart line items, free delivery meter, subtotal, and direct COD checkout CTA.
- **Important Props / Data:** `{ isOpen: boolean; onClose: () => void }` (Accesses `useCart` hook).
- **Interaction Behavior:** Slides in from right; locks body scroll; auto-opens when an item is added to bag.
- **Scope:** Global Storefront.

### 7.2 `CartItemRow`
- **File Location:** `src/components/storefront/CartItemRow.tsx`
- **Responsibility:** Renders a single cart line item with image thumbnail, title, color/size chips, PKR unit price, quantity stepper, and remove action.
- **Important Props / Data:** `{ item: CartLineItem; onUpdateQuantity: (id: string, qty: number) => void; onRemove: (id: string) => void }`
- **Interaction Behavior:** Quantity increment disabled when matching available stock.
- **Scope:** CartDrawer & Cart Page.

### 7.3 `FreeShippingMeter`
- **File Location:** `src/components/storefront/FreeShippingMeter.tsx`
- **Responsibility:** Progress bar showing progress towards the PKR 7,500 free delivery threshold.
- **Important Props / Data:** `{ currentSubtotal: number; thresholdPkr: number }`
- **Interaction Behavior:** Animated fill bar in Sovereign Gold (`#D4AF37`); celebratory message when threshold is met.
- **Scope:** CartDrawer, Cart Page & Checkout.

### 7.4 `PakistaniAddressForm`
- **File Location:** `src/components/storefront/PakistaniAddressForm.tsx`
- **Responsibility:** Form fields capturing Pakistani delivery details: Full Name, Phone (`03XX-XXXXXXX`), Address, Nearest Landmark, City dropdown, Province.
- **Important Props / Data:** `{ initialValues?: AddressDTO; onSubmit: (data: AddressDTO) => void; onCityChange: (city: string) => void }`
- **Interaction Behavior:** Live validation on phone format; city selection automatically updates shipping zone.
- **Scope:** Checkout Page & Customer Addresses.

### 7.5 `ShippingZoneSelector`
- **File Location:** `src/components/storefront/ShippingZoneSelector.tsx`
- **Responsibility:** Displays calculated shipping zone, rate in PKR, and estimated delivery timeframe.
- **Important Props / Data:** `{ zoneName: string; shippingFeePkr: number; estimatedDays: string; isFree: boolean }`
- **Interaction Behavior:** Informational radio/banner displaying zone rate breakdown.
- **Scope:** Checkout Page.

### 7.6 `CouponInput`
- **File Location:** `src/components/storefront/CouponInput.tsx`
- **Responsibility:** Input field to enter promo coupon code with apply button and discount feedback.
- **Important Props / Data:** `{ onApplyCoupon: (code: string) => Promise<boolean>; activeCoupon?: AppliedCoupon; onRemoveCoupon: () => void }`
- **Interaction Behavior:** Loading state during verification; displays green discount badge or inline error.
- **Scope:** CartDrawer & Checkout Page.

### 7.7 `OrderSuccessCard`
- **File Location:** `src/components/storefront/OrderSuccessCard.tsx`
- **Responsibility:** Order confirmation receipt displaying unique Order ID (`NG-YYYY-XXXXX`), invoice details, COD instructions, and print action.
- **Important Props / Data:** `{ order: OrderConfirmationDTO }`
- **Interaction Behavior:** Clean printable layout; WhatsApp support button.
- **Scope:** Order Confirmation Page.

---

## 8. Authentication & Customer Portal Components

### 8.1 `LoginForm` & `RegisterForm`
- **File Locations:** `src/components/auth/LoginForm.tsx`, `src/components/auth/RegisterForm.tsx`
- **Responsibility:** Authentication cards with floating inputs, password visibility toggles, and Zod client validation.
- **Important Props / Data:** `{ onSuccess?: () => void; redirectTo?: string }`
- **Interaction Behavior:** Handles submission, loading spinners, and server-side authentication error feedback.
- **Scope:** Auth Pages.

### 8.2 `AccountSidebar`
- **File Location:** `src/components/account/AccountSidebar.tsx`
- **Responsibility:** Vertical tab menu for customer portal (Overview, Orders, Addresses, Profile, Wishlist, Logout).
- **Important Props / Data:** `{ activeTab: string }`
- **Interaction Behavior:** Highlights active route; triggers API logout on logout click.
- **Scope:** Customer Account Pages.

### 8.3 `OrderHistoryTable`
- **File Location:** `src/components/account/OrderHistoryTable.tsx`
- **Responsibility:** Tabulated chronological list of customer orders with dates, PKR totals, status badges, and view actions.
- **Important Props / Data:** `{ orders: OrderSummaryDTO[] }`
- **Interaction Behavior:** Responsive table transforming to card view on mobile screens.
- **Scope:** Account Orders Page.

### 8.4 `AddressBookCard`
- **File Location:** `src/components/account/AddressBookCard.tsx`
- **Responsibility:** Card displaying a saved Pakistani delivery address with edit, delete, and "Set as Default" actions.
- **Important Props / Data:** `{ address: AddressDTO; onEdit: () => void; onDelete: () => void; onSetDefault: () => void }`
- **Interaction Behavior:** Quick actions for managing multiple delivery destinations.
- **Scope:** Account Addresses Page.

---

## 9. Admin Dashboard Components

### 9.1 `MetricCard`
- **File Location:** `src/components/admin/MetricCard.tsx`
- **Responsibility:** KPI summary card showing metric value (e.g., Gross Sales in PKR), trend indicator, and icon.
- **Important Props / Data:** `{ title: string; value: string; trend?: string; isPositive?: boolean; icon: IconName }`
- **Interaction Behavior:** Clean visual summary.
- **Scope:** Admin Dashboard Overview.

### 9.2 `DataTable`
- **File Location:** `src/components/admin/DataTable.tsx`
- **Responsibility:** Generic dark-mode data table supporting pagination, sorting, search filtering, and row actions.
- **Important Props / Data:** `{ columns: ColumnDef<T>[]; data: T[]; isLoading?: boolean; pagination: PaginationState }`
- **Interaction Behavior:** Accessible row hovers; sortable column headers; responsive scroll.
- **Scope:** Admin Management Pages (Orders, Products, Customers, Inventory).

### 9.3 `OrderStatusBadge` & `OrderStatusSelector`
- **File Locations:** `src/components/admin/OrderStatusBadge.tsx`, `src/components/admin/OrderStatusSelector.tsx`
- **Responsibility:** Displays colored status pills (`PENDING`, `CONFIRMED`, `SHIPPED`, etc.) and provides an interactive dropdown for staff to advance lifecycle states.
- **Important Props / Data:** `{ status: OrderStatus; onStatusChange?: (newStatus: OrderStatus) => Promise<void> }`
- **Interaction Behavior:** Prompt confirmation modal on critical status changes (e.g., `CANCELLED`, `RETURNED`).
- **Scope:** Admin Order Views.

### 9.4 `VariantMatrixEditor`
- **File Location:** `src/components/admin/VariantMatrixEditor.tsx`
- **Responsibility:** Interactive matrix table generating and editing variant SKUs from selected sizes and colors.
- **Important Props / Data:** `{ variants: ProductVariantDTO[]; onChange: (variants: ProductVariantDTO[]) => void }`
- **Interaction Behavior:** Dynamically adds SKU rows when new colors/sizes are added; inline inputs for price, sale price, and stock.
- **Scope:** Admin Product Create/Edit Pages.

### 9.5 `ProductImageUploader`
- **File Location:** `src/components/admin/ProductImageUploader.tsx`
- **Responsibility:** Drag-and-drop multi-image uploader with reordering, primary thumbnail designation, and delete controls.
- **Important Props / Data:** `{ images: Array<{ url: string; isPrimary: boolean }>; onImagesChange: (imgs: any) => void }`
- **Interaction Behavior:** Drag to reorder; image upload progress bar; preview thumbnails.
- **Scope:** Admin Product Create/Edit Pages.

### 9.6 `StockAdjustModal`
- **File Location:** `src/components/admin/StockAdjustModal.tsx`
- **Responsibility:** Modal dialog allowing staff to increment/decrement inventory for a specific SKU with a required audit reason note.
- **Important Props / Data:** `{ variant: VariantSummary; isOpen: boolean; onClose: () => void; onSave: (change: number, reason: string) => Promise<void> }`
- **Interaction Behavior:** Form validation requiring non-empty audit reason.
- **Scope:** Admin Inventory Page.

### 9.7 `PrintablePackingSlip`
- **File Location:** `src/components/admin/PrintablePackingSlip.tsx`
- **Responsibility:** Standardized printable packing slip and invoice formatted for A4 and thermal printers.
- **Important Props / Data:** `{ order: OrderDetailDTO }`
- **Interaction Behavior:** Strips dark background styles during `@media print` to ensure crisp black-and-white paper printing.
- **Scope:** Admin Order Detail View.

---

## 10. Forms, Feedback & Shared UI Primitives

### 10.1 `Button`
- **File Location:** `src/components/ui/Button.tsx`
- **Responsibility:** Standard button primitive with variants: `primary` (Solid Sovereign Gold), `secondary` (Antique Gold Outline), `ghost`, `destructive`.
- **Important Props / Data:** `{ variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'; size?: 'sm' | 'md' | 'lg'; isLoading?: boolean; disabled?: boolean }`
- **Interaction Behavior:** Touch-friendly padding, hover glows on primary, active click scaling, disabled opacity.
- **Scope:** Universal Primitive.

### 10.2 `TextInput`
- **File Location:** `src/components/ui/TextInput.tsx`
- **Responsibility:** Accessible text input field with label, error text, helper text, and gold focus ring.
- **Important Props / Data:** `{ label: string; error?: string; helperText?: string; prefixIcon?: IconName; ...inputProps }`
- **Interaction Behavior:** Focus shifts border from `#362F4A` to `#D4AF37`; error highlights red `#E74C3C`.
- **Scope:** Universal Primitive.

### 10.3 `SelectDropdown`
- **File Location:** `src/components/ui/SelectDropdown.tsx`
- **Responsibility:** Accessible select box styled in dark luxury tokens.
- **Important Props / Data:** `{ label: string; options: Array<{ label: string; value: string }>; value: string; onChange: (val: string) => void }`
- **Interaction Behavior:** Opens royal aubergine menu with keyboard navigation.
- **Scope:** Universal Primitive.

### 10.4 `QuantitySelector`
- **File Location:** `src/components/ui/QuantitySelector.tsx`
- **Responsibility:** Compact stepper control (`[-]` `value` `[+]`) with minimum (1) and maximum (available stock) limits.
- **Important Props / Data:** `{ value: number; max: number; onChange: (val: number) => void }`
- **Interaction Behavior:** Increment button disables when `value === max`.
- **Scope:** PDP & Cart Drawer.

### 10.5 `SkeletonLoader`
- **File Location:** `src/components/ui/SkeletonLoader.tsx`
- **Responsibility:** Shimmer placeholder component for images, text lines, cards, and tables.
- **Important Props / Data:** `{ variant: 'card' | 'text' | 'image' | 'table-row'; className?: string }`
- **Interaction Behavior:** Continuous subtle gradient pulse (`bg-gradient-to-r from-noir-900 to-noir-800`).
- **Scope:** Universal Primitive.

### 10.6 `ToastNotification`
- **File Location:** `src/components/ui/ToastNotification.tsx`
- **Responsibility:** Global notification toast for success, warning, error, and cart confirmation.
- **Important Props / Data:** `{ id: string; type: 'success' | 'warning' | 'error' | 'info'; message: string; duration?: number }`
- **Interaction Behavior:** Slides in from top-right; auto-dismisses after duration.
- **Scope:** Universal Primitive.
