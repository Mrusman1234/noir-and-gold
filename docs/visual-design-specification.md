# Visual Design & Interaction Specification

**Project:** NOIR & GOLD — Luxury Apparel E-Commerce Store  
**Target Market:** Pakistan  
**Document Version:** 1.0.0  
**Status:** Approved Visual Specification  
**Date:** October 2026  

---

## 1. Brand Personality & Visual Direction

### 1.1 Brand Identity & Creative North Star
NOIR & GOLD represents bespoke haute couture, opulent prêt-à-porter, and contemporary luxury tailoring. The visual tone is mysterious, dignified, architectural, and cinematic. The digital storefront evokes the hushed, private salon atmosphere of high-fashion flagship boutiques in Karachi, Lahore, and Paris.

```
       [ NOIR & GOLD VISUAL PILLARS ]
+---------------------+---------------------+---------------------+
|   MYSTERIOUS DEPTH  |   RESTRAINED GOLD   | EDITORIAL ELEVATION |
| Deep obsidian,      | Warm champagne and  | Regal serif titles, |
| velvet purple tones | antique gold used   | expansive spacing,  |
| create theatrical   | strictly for focal  | 3:4 portrait ratios |
| contrast for cloth. | accents and CTAs.   | with true textures. |
+---------------------+---------------------+---------------------+
```

### 1.2 Design Philosophy: Dark Luxury with Pakistani Context
- **Atmospheric Darkness:** Surfaces are not harsh flat `#000000` blacks; they are layered tones of obsidian (`#0B0A0F`), deep velvet purple (`#14111B`), and royal aubergine (`#1C1826`). This provides organic depth that makes silk sheens, velvet textures, and gold threadwork (Zari/Dabka) stand out.
- **Restrained Gold Application:** Gold is treated as a precious metal. It is never used as large background fills. It is applied exclusively to primary call-to-action buttons, delicate hairline borders, selected active swatches, and micro-badges.
- **Trust & Commercial Clarity for Pakistan:** Luxury online shopping in Pakistan faces high buyer hesitation. The visual system elevates trust through:
  - Transparent pricing in Pakistani Rupees (e.g., `PKR 18,500`) with no hidden checkout surcharges.
  - Prominent Cash on Delivery (COD) clarity with delivery zone timelines.
  - Authentic, unmanipulated garment photography that reproduces true fabric drape, weave, and color.
  - Dedicated customer care pathways (official WhatsApp concierge, phone hotline, and atelier locations).

---

## 2. Foundations: Color, Typography, Sizing & Surfaces

### 2.1 The Official Color System (Exact HEX Tokens)

All interface elements derive strictly from the tokens established in `design-system.md`:

```
SURFACE TOKENS:
  Obsidian Base:     #0B0A0F  [■] Deepest canvas background
  Deep Velvet:       #14111B  [■] Primary cards, sticky headers, table rows
  Royal Aubergine:   #1C1826  [■] Secondary containers, input boxes, dropdowns
  Midnight Slate:    #262134  [■] Hover states, active list selections
  Structural Border: #362F4A  [■] Hairline dividers (opacity 40%-60%)

GOLD ACCENT TOKENS:
  Sovereign Gold:    #D4AF37  [■] Primary CTAs, active focus rings, badges
  Champagne Gold:    #E6CA65  [■] High-contrast text accent, icon highlights
  Antique Pale Gold: #AA8B2F  [■] Hairline borders on secondary buttons
  Muted Bronze Gold: #6E5A23  [■] Inactive/disabled gold borders & indicators

NEUTRAL & TEXT TOKENS:
  Pearl White:       #F9F9FA  [■] Primary headings, high-emphasis text
  Soft Platinum:     #D6D4DC  [■] Body copy, input values, product details
  Muted Lavender:    #948F9F  [■] Captions, secondary labels, placeholders

STATUS TOKENS:
  Success (Emerald): #2ECC71  [■] In Stock, order confirmed, valid coupon
  Warning (Amber):   #F39C12  [■] Low stock (< 3 left), pending review
  Error (Rose):      #E74C3C  [■] Out of stock, field error, cancelled
```

### 2.2 Typography System

```
DISPLAY & HEADINGS: Cormorant Garamond / Playfair Display (Serif)
  Display 1 (Hero):        56px / 38px mobile | Line Height: 1.10 | Weight: 700 | Tracking: -0.02em
  Display 2 (Campaign):    44px / 32px mobile | Line Height: 1.15 | Weight: 600 | Tracking: -0.01em
  Heading 1 (Page):        36px / 28px mobile | Line Height: 1.20 | Weight: 600 | Tracking: normal
  Heading 2 (Section):     28px / 22px mobile | Line Height: 1.25 | Weight: 500 | Tracking: normal
  Heading 3 (Card):        20px / 18px mobile | Line Height: 1.30 | Weight: 500 | Tracking: normal

BODY, UI & NUMERICS: Plus Jakarta Sans / Inter (Clean Sans)
  Body Large (Lead):       18px / 16px mobile | Line Height: 1.60 | Weight: 400 | Tracking: normal
  Body Regular (Copy):     15px / 14px mobile | Line Height: 1.50 | Weight: 400 | Tracking: normal
  Body Small (Details):    13px / 12px mobile | Line Height: 1.45 | Weight: 400 | Tracking: +0.01em
  Overline / Micro-label:  11px / 10px mobile | Line Height: 1.30 | Weight: 600 | Tracking: +0.12em (UPPER)
  Price Figures (PKR):     18px / 16px mobile | Line Height: 1.20 | Weight: 600 | Tabular Figures
```

### 2.3 Spacing, Borders, Radii & Depth Rules
- **Spacing Grid (8pt Standard):**
  - `2xs: 4px`, `xs: 8px`, `sm: 12px`, `md: 16px`, `lg: 24px`, `xl: 32px`, `2xl: 48px`, `3xl: 64px`, `4xl: 96px`.
- **Architectural Radii:**
  - `rounded-none (0px)`: Universal standard for product cards, editorial imagery, hero banners, and primary CTA buttons.
  - `rounded-sm (2px)`: Form fields, text inputs, table wrappers, and quantity controls.
  - `rounded (4px)`: Micro-badges, notification toasts, and dropdown containers.
- **Hairline Borders:**
  - `1px solid rgba(54, 47, 74, 0.40)`: Standard structural divider.
  - `1px solid rgba(212, 175, 55, 0.45)`: Accent cards, hover frames, and secondary buttons.
  - `1.5px solid #D4AF37`: Active variant chip or focused form input.
- **Shadows & Lighting:**
  - Base Card: `0 4px 20px -2px rgba(0, 0, 0, 0.70)`.
  - Drawers & Modals: `0 20px 50px -4px rgba(0, 0, 0, 0.95)`.
  - Gold Accent Glow: `0 0 20px rgba(212, 175, 55, 0.18)` applied strictly on primary button hover.

---

## 3. Responsive Breakpoints & Device Rules

```
+--------------------------------------------------------------------------+
| BREAKPOINTS & DEVICE ADAPTATIONS                                         |
+-------------------+----------------+---------------+---------------------+
| Viewport Tier     | Width Range    | Columns       | Horizontal Padding  |
+-------------------+----------------+---------------+---------------------+
| Mobile Compact    | < 640px        | 1 or 2 (grid) | 16px                |
| Phablet / Large   | 640px - 767px  | 2 columns     | 24px                |
| Tablet            | 768px - 1023px | 2 - 3 columns | 32px                |
| Desktop           | 1024px- 1279px | 3 - 4 columns | 48px                |
| Desktop Wide / XL | 1280px - 1536px| 4 columns     | 64px (max 1280px)   |
| Ultra-Wide        | > 1536px       | 4 columns     | Constrained 1440px  |
+-------------------+----------------+---------------+---------------------+
```

### 3.1 Mobile Device Rules (< 1024px)
- **Minimum Tap Target:** Every interactive element (variant chips, wishlist heart, pagination, inputs) must measure at least **44x44px** in physical touch area.
- **Sticky Viewport Controls:**
  - The Header remains pinned at `56px` height with backdrop blur.
  - On the Product Detail Page (PDP), scrolling past the main "Add to Cart" button triggers a sticky bottom purchasing bar.
- **Drawers Over Modals:** On mobile, cart, navigation menus, and faceted filters slide in as full-height bottom or side drawers rather than centered floating dialogs.

### 3.2 Desktop Device Rules (>= 1024px)
- **Hover Micro-Interactions:** Product card image cross-fade (`scale-105`), subtle gold underlines under navigation items, and quick-action reveals.
- **Dual-Pane Sticky Layouts:** Product details and Checkout utilize a 2-column split layout where the media or order summary panel remains sticky while the interactive forms scroll smoothly.

---

## 4. Storefront Layout & Section Specifications

### 4.1 Header, Navigation & Utility Bar

```
DESKTOP HEADER SPECIFICATION:
+------------------------------------------------------------------------------+
| [ANNOUNCEMENT] COMPLIMENTARY DELIVERY ON ORDERS ABOVE PKR 7,500 ACROSS PAKISTAN |
+------------------------------------------------------------------------------+
| [WOMEN]  [MEN]  [COLLECTIONS]   |   NOIR & GOLD   |   [SEARCH] [WISHLIST] [CART: 2] |
+------------------------------------------------------------------------------+

MOBILE HEADER SPECIFICATION:
+------------------------------------------------------------------------------+
| [ANNOUNCEMENT] FREE DELIVERY OVER PKR 7,500 (COD NATIONWIDE)                 |
+------------------------------------------------------------------------------+
| [☰ MENU]                       NOIR & GOLD              [SEARCH]  [CART: 2]  |
+------------------------------------------------------------------------------+
```

1. **Top Announcement Bar:**
   - Background: Deep Velvet (`#14111B`), Border Bottom: Hairline `#362F4A`.
   - Text: 11px uppercase in Champagne Gold (`#E6CA65`), letter-spacing `+0.12em`.
   - Content: Delivery guarantee + WhatsApp assistance link.
2. **Main Navigation Bar:**
   - Height: Desktop `76px`, Mobile `56px`.
   - Background: `rgba(11, 10, 15, 0.85)` with `backdrop-blur-md` and bottom border `rgba(54, 47, 74, 0.3)`.
   - Logo: Centered typographic serif wordmark `"NOIR & GOLD"` in Pearl White (`#F9F9FA`).
   - Links: Clean 14px uppercase links with animated gold underline indicator upon hover.
   - Utility Icons: Minimal 20px stroked icons for Search, Wishlist (with numeric badge), User Account, and Cart (with gold counter badge).

### 4.2 Search Overlay Experience
- Activated via the search icon or keyboard shortcut (`/` or `Ctrl+K`).
- Fullscreen or centered modal backdrop with `bg-[#0B0A0F]/90 backdrop-blur-md`.
- Large search input (24px text) with gold cursor and clear button (`×`).
- Live search response displays:
  - Suggested queries and direct category links.
  - Instant product card grid (thumbnails, title in Cormorant Garamond, price in PKR).

### 4.3 Mobile Navigation Drawer
- Slides in from left screen edge over 300ms with smooth cubic-bezier easing.
- Header contains close button (`×`) and NOIR & GOLD monogram.
- Accordion sections:
  - Women (Pret, Luxury Pret, Formal, Shawls, Accessories).
  - Men (Kurta Pajama, Waistcoats, Formal Suits, Luxury Casual).
  - Curated Collections (The Velvet Nocturne, The Gold Edit).
- Bottom utility links: Order Tracking (`/track-order`), Customer Support Hotline, Account Login / Register.

---

## 5. Homepage Architecture & Section Flow

The homepage establishes luxury positioning, highlights seasonal collections, and builds trust with Pakistani shoppers:

```
+-------------------------------------------------------+
| 1. ANNOUNCEMENT BAR (Free shipping > PKR 7,500)       |
+-------------------------------------------------------+
| 2. NAVIGATION HEADER (Wordmark, links, utilities)     |
+-------------------------------------------------------+
| 3. HERO EDITORIAL (Split banner, seasonal campaign)   |
+-------------------------------------------------------+
| 4. CURATED COLLECTIONS (Women's Pret, Men's Formal)   |
+-------------------------------------------------------+
| 5. NEW ARRIVALS CAROUSEL (Live product cards in PKR)  |
+-------------------------------------------------------+
| 6. ATELIER & CRAFTSMANSHIP (Fabric & embroidery story)|
+-------------------------------------------------------+
| 7. REGIONAL TRUST BANNER (COD, 3-5 day delivery, RTO) |
+-------------------------------------------------------+
| 8. EDITORIAL NEWSLETTER (VIP invitations)             |
+-------------------------------------------------------+
| 9. FOOTER (Policies, categories, contact, copyright)  |
+-------------------------------------------------------+
```

### 5.1 Hero Editorial Section
- **Visual Composition:** Split-screen or full-bleed editorial photograph showcasing model in signature collection garment.
- **Lighting:** Moody low-key studio lighting with warm rim light.
- **Typography:**
  - Overline: `"AUTUMN / WINTER 2026 CAMPAIGN"` in Champagne Gold (`#E6CA65`).
  - Headline: `"THE VELVET NOCTURNE"` in 56px Cormorant Garamond Pearl White.
  - Body: Brief 2-line poetic narrative highlighting bespoke craftsmanship.
- **Call-to-Action Group:**
  - Primary CTA: `"EXPLORE WOMEN'S PRET"` (Solid Sovereign Gold `#D4AF37`, black text).
  - Secondary CTA: `"EXPLORE MEN'S EDIT"` (Architectural Outline with Champagne Gold border).

### 5.2 Curated Collections Section
- Two large vertical cards (50% desktop width each, 100% mobile stacked).
- Left: Women's Luxury Collection; Right: Men's Formal Atelier.
- Card includes deep dark overlay gradient (`from-transparent to-[#0B0A0F]/90`), collection title, and a discrete gold underline CTA (`"DISCOVER COLLECTION →"`).

### 5.3 New Arrivals Product Showcase
- Responsive 4-column product grid (desktop) or smooth touch swipe carousel (mobile).
- Clean section header: `"NEW ARRIVALS"` with subtitle `"Crafted in pure silks, velvets, and hand-embroidered motifs."`

### 5.4 Atelier & Craftsmanship Showcase
- Editorial content block juxtaposing a high-resolution close-up macro shot of gold threadwork (Zari) against a narrative on pure Pakistani fabrics, hand-loom silk, and bespoke tailoring standards.

### 5.5 Regional Trust & Fulfillment Banner
- Four-column clean grid (2-column on mobile) reinforcing consumer confidence:
  1. **Cash on Delivery:** Available nationwide across all Pakistani cities.
  2. **Express Delivery:** 1–2 days within Karachi; 2–3 days to Lahore & Islamabad.
  3. **7-Day Exchange Window:** Hassle-free inspection and size replacement.
  4. **Dedicated Concierge:** Direct WhatsApp hotline for sizing guidance.

---

## 6. Product Card Design Specification

The product card is the atomic cornerstone of the catalog browsing experience.

```
+--------------------------------------------------+
| [NEW]                                        [♡] | <- Micro-badge & Wishlist
|                                                  |
|                                                  |
|                   3:4 PORTRAIT                   | <- Aspect Ratio: 3:4
|                 EDITORIAL IMAGE                  |    Desktop: Crossfade to
|                                                  |    alternate angle on hover
|                                                  |
|                                                  |
+--------------------------------------------------+
| WOMEN'S LUXURY PRET                              | <- Category Overline
| Midnight Velvet Anarkali                         | <- Title (Cormorant Garamond)
| PKR 24,500   PKR 28,000                          | <- Active Price & Original
| [XS] [S] [M] [L]                                 | <- Quick Size Chips on hover
+--------------------------------------------------+
```

### 6.1 Elements & Metrics
- **Aspect Ratio:** Fixed `3:4` vertical portrait ratio (e.g., 600x800px or 900x1200px source).
- **Image Container:** `#14111B` background with subtle 1px border `rgba(54, 47, 74, 0.4)`.
- **Desktop Hover Behavior:**
  - The primary image smoothly cross-fades to the second image (45-degree angle or garment back shot) with a slight zoom (`scale-105` over 500ms ease-out).
  - An architectural "Quick Add" size drawer slides up from the bottom of the image container revealing in-stock sizes (`XS`, `S`, `M`, `L`, `XL`).
- **Micro-Badges (Top Left):**
  - `"NEW"`: Deep velvet background with 1px Sovereign Gold border and Champagne Gold text.
  - `"LIMITED"`: Deep amber background (`#6E5A23`) with Champagne Gold text.
  - `"SOLD OUT"`: Obsidian background with subtle red border (`#922B21`) and Soft Platinum text.
- **Wishlist Toggle (Top Right):**
  - Minimal 36x36px circular backdrop (`rgba(11, 10, 15, 0.7)` with backdrop blur).
  - Hollow heart stroke (`#D6D4DC`); shifts to solid Sovereign Gold (`#D4AF37`) when wishlisted.
- **Typography & Pricing:**
  - Overline: 11px uppercase in Muted Lavender (`#948F9F`).
  - Title: 18px Cormorant Garamond in Pearl White (`#F9F9FA`).
  - Price: Tabular figures in Soft Platinum (`PKR 24,500`). If on sale, active price is highlighted in Champagne Gold (`#E6CA65`) and original crossed-out in Muted Lavender (`PKR 28,000`).

---

## 7. Product Detail Page (PDP) Layout & Interaction

The PDP is engineered for high conversion, tactile garment appreciation, and swift sizing selection.

```
DESKTOP PDP LAYOUT (2-COLUMN SPLIT):
+-------------------------------------+-------------------------------------+
| [STICKY MEDIA GALLERY]              | [SCROLLING PURCHASING PANEL]        |
|                                     |                                     |
| +---------------------------------+ | Category Breadcrumbs                |
| |                                 | | Product Title (36px Serif)          |
| |                                 | | SKU: NG-W26-MVA-01                |
| |     PRIMARY VIEWPORT (3:4)      | | Price: PKR 24,500                 |
| |      With Hover Zoom Lens       | | [In Stock - Ships in 24 Hours]    |
| |                                 | | --------------------------------- |
| +---------------------------------+ | SELECT COLOR: Midnight Obsidian   |
| [THUMB 1] [THUMB 2] [THUMB 3]       | [● Obsidian] [● Royal Plum]         |
|                                     | --------------------------------- |
|                                     | SELECT SIZE: [Size Guide Modal ?]   |
|                                     | [XS] [ S ] [ M ] [ L ] [XL]         |
|                                     | (Real-time stock: "Only 2 left")    |
|                                     | --------------------------------- |
|                                     | QUANTITY: [-]  1  [+]               |
|                                     | [ ADD TO CART (CASH ON DELIVERY) ]  |
|                                     | [ ♡ ADD TO WISHLIST ]               |
|                                     | --------------------------------- |
|                                     | Accordion: Fabric & Care            |
|                                     | Accordion: Shipping & COD Info      |
|                                     | Accordion: 7-Day Exchange Policy    |
+-------------------------------------+-------------------------------------+
```

### 7.1 Media Gallery Experience
- **Primary Viewport:** High-resolution portrait viewport. Clicking opens a full-screen high-res light-box zoom modal.
- **Thumbnails:** Vertical thumbnail strip on desktop (left of main viewport) or horizontal swipe strip below image on mobile.
- **Color Synchronization:** Selecting an alternate color swatch automatically shifts the thumbnail set to show the selected colorway.

### 7.2 Variant Matrix & Stock Indicator
- **Color Swatches:**
  - Circular 32x32px swatches showing true fabric color with a 1px border.
  - Selected swatch receives a 2px offset ring in Sovereign Gold (`#D4AF37`).
- **Size Selector:**
  - Crisp rectangular chips (44px height for mobile touch).
  - Selected chip: Solid Sovereign Gold border with Champagne Gold text.
  - Out of stock size: Crossed-out diagonal hairline, dimmed text (`#645F73`), unclickable.
- **Real-Time Stock Status Badge:**
  - When stock > 3: Display green dot with text `"In Stock — Ready for Dispatch"` in `#2ECC71`.
  - When stock is 1 to 3: Display amber dot with text `"Only [N] items left in stock"` in `#F39C12`.
  - When stock is 0: Display rose dot with text `"Sold Out — Join waitlist"` in `#E74C3C`.

### 7.3 Size Guide Modal
- Interactive dialog detailing measurements in both **Inches** and **Centimeters** via a toggle button.
- Comprehensive Pakistani fashion sizing table:
  - Bust / Chest
  - Waist
  - Hip
  - Garment Length
  - Shoulder Span
  - Sleeve Length
- Includes a concise visual diagram illustrating exact measurement positions on the body.

### 7.4 Mobile Sticky Purchasing Bar
- When the user scrolls past the main "Add to Cart" button on mobile, a fixed bar slides up at the bottom of the screen (`64px` height).
- Displays thumbnail, truncated title, price in PKR, and an instant `"Add to Cart"` button.

---

## 8. Cart, Checkout & Customer Portal Layouts

### 8.1 Slide-Over Cart Drawer (`CartDrawer`)
- **Header:** Title `"SHOPPING BAG (2)"` with close button (`×`).
- **Free Shipping Progress Meter:**
  - Visual progress bar showing distance to the PKR 7,500 threshold:
  - E.g., *"Add PKR 1,500 more to qualify for Free Delivery across Pakistan."*
- **Line Items List:**
  - 80x106px image thumbnail.
  - Product title, chosen color, and size chip.
  - Price per unit in PKR.
  - Inline quantity adjuster (`[-]` `1` `[+]`) with stock limit lockout.
  - Remove button with subtle trash icon.
- **Footer:**
  - Subtotal in PKR.
  - Delivery notice: *"Shipping calculated at checkout. Cash on Delivery available."*
  - Primary CTA: `"PROCEED TO CHECKOUT (COD)"` linking to `/checkout`.

### 8.2 Checkout Layout (`/checkout`)

```
DESKTOP CHECKOUT ARCHITECTURE (2 COLUMNS):
+---------------------------------------+-----------------------------------+
| STEP 1: CONTACT INFORMATION           | ORDER SUMMARY (STICKY)            |
| Email Address, Phone (03XX-XXXXXXX)   |                                   |
|                                       | Line Item 1: Midnight Velvet  x1  |
| STEP 2: PAKISTANI DELIVERY ADDRESS    | Line Item 2: Gold Thread Shawl x1 |
| Full Name                             | --------------------------------- |
| Complete Street Address & House #     | Subtotal:              PKR 34,500 |
| Nearest Landmark (Required)           | Shipping (Major Metros):  PKR 300 |
| City Selection (Dropdown: Lahore)     | Promo Code: [NOIR10]   - PKR 3,450|
| Province (Auto-selected: Punjab)      | --------------------------------- |
| Special Delivery Notes                | GRAND TOTAL (COD):     PKR 31,350 |
|                                       |                                   |
| STEP 3: PAYMENT METHOD                | [ COUPON INPUT ]  [ APPLY ]       |
| (●) Cash on Delivery (COD)            |                                   |
|     "Pay cash to courier on arrival"  | [ PLACE ORDER (CASH ON DELIVERY) ]|
+---------------------------------------+-----------------------------------+
```

- **Pakistani Form Ergonomics:**
  - Mobile phone field has an explicit prefix `+92` or accepts standard `0300-1234567` formatting.
  - The "Nearest Landmark" field is clearly marked as essential to prevent courier delivery delays.
  - Selecting a city updates the shipping rate dynamically:
    - Karachi: Flat PKR 200.
    - Lahore / Islamabad / Rawalpindi: Flat PKR 300.
    - Other cities: Flat PKR 400.
    - Orders >= PKR 7,500: PKR 0 (Free Delivery).

### 8.3 Order Confirmation Screen (`/checkout/success/[orderNumber]`)
- Celebratory dark luxury aesthetic: Soft golden circular checkmark icon.
- Prominent Human-Readable Order Number: `NG-2026-10492`.
- Clear Notice:
  - *"Thank you for your patronage. Your bespoke garments have been reserved."*
  - *"Our concierge will contact you shortly via phone or WhatsApp to confirm delivery details."*
- Itemized invoice receipt with printable button (`"Print Invoice"`).
- Estimated delivery window (e.g., 2–4 business days).

### 8.4 Customer Account Portal (`/account`)
- Left sidebar navigation with active indicator in Sovereign Gold.
- Tab views:
  - **Overview:** Welcome banner, quick view of the most recent order, and primary address.
  - **Orders (`/account/orders`):** Tabulated list with order date, order number, PKR total, status badge (`CONFIRMED`, `SHIPPED`, etc.), and `"View Details"` action.
  - **Addresses (`/account/addresses`):** Card-based address book allowing creation of multiple delivery addresses with a `"Default"` tag.
  - **Wishlist (`/account/wishlist`):** Product card grid with an instant `"Move to Bag"` CTA.

---

## 9. Admin Dashboard Visual Hierarchy & Data Tables

The admin dashboard operates on the same dark luxury foundation, refined for maximum operational clarity, legibility, and high information density.

```
ADMIN DASHBOARD LAYOUT:
+-------------------+---------------------------------------------------------+
| NOIR & GOLD       | [Breadcrumbs: Orders > All]   [Store Live ↗]  [Admin: Ali] |
| PORTAL            +---------------------------------------------------------+
|                   | [ METRICS BAR ]                                         |
| [Dashboard]       | Gross Sales: PKR 1,840,000 | Orders Today: 18 | Low Stock: 4|
| [Products]        +---------------------------------------------------------+
| [Categories]      | ORDERS PIPELINE                                         |
| [Inventory]       | [All (128)] [Pending (12)] [Confirmed (14)] [Shipped (32)] |
| [Orders]          +---------------------------------------------------------+
| [Customers]       | [Search customer, order #, phone...]  [Filter by Date ▾]|
| [Coupons]         | +-----------------------------------------------------+ |
| [Shipping Zones]  | | Order #  | Customer   | City   | Items | Total   | Status | |
| [Audit Logs]      | | NG-10492 | Fatima K.  | Lahore | 2     | 24,500  | [CONF] | |
| [Settings]        | | NG-10491 | Usman R.   | KHI    | 1     | 18,000  | [PEND] | |
+-------------------+---------------------------------------------------------+
```

### 9.1 Layout & Navigation
- **Sidebar:** Width 260px; deep velvet background (`#14111B`) with thin right border `#362F4A`. Collapsible to 64px on smaller monitors.
- **Top Bar:** Height 64px; breadcrumb navigation, quick link to open public store, current administrator profile chip, and logout action.

### 9.2 Data Table Standards
- **Container:** Royal Aubergine background (`#1C1826`) with 1px border `#362F4A` and 2px border radius.
- **Table Header:** Deep Velvet (`#14111B`), 12px uppercase font, Muted Lavender text, sort arrows on click.
- **Row Styling:** Height 56px, alternate subtle row striping or hairline borders; hover state shifts to Midnight Slate (`#262134`).
- **Status Pills:**
  - `PENDING`: Amber background (`rgba(243, 156, 18, 0.15)`) with `#F39C12` text.
  - `CONFIRMED`: Blue background (`rgba(52, 152, 219, 0.15)`) with `#3498DB` text.
  - `PROCESSING`: Purple background (`rgba(155, 89, 182, 0.15)`) with `#9B59B6` text.
  - `SHIPPED`: Emerald background (`rgba(46, 204, 113, 0.15)`) with `#2ECC71` text.
  - `FAILED_DELIVERY` / `CANCELLED`: Rose background (`rgba(231, 76, 60, 0.15)`) with `#E74C3C` text.

---

## 10. UI State Specifications

```
+-----------------------------------------------------------------------------+
| STATE SPECIFICATIONS & VISUAL BEHAVIORS                                     |
+-------------------+---------------------------------------------------------+
| State             | Visual Representation                                   |
+-------------------+---------------------------------------------------------+
| Loading Skeleton  | Deep Velvet base with subtle pulsing gold-slate shimmer |
|                   | animation (`bg-gradient-to-r from-noir-900 to-noir-800`)|
+-------------------+---------------------------------------------------------+
| Empty State       | Centered minimalist luxury vector icon, muted copy,     |
|                   | and a prominent Sovereign Gold action button.           |
+-------------------+---------------------------------------------------------+
| Form Error        | 1px solid Rose (`#E74C3C`), subtle red field tint, and  |
|                   | 12px descriptive error text below input.                |
+-------------------+---------------------------------------------------------+
| Form Success      | 1px solid Emerald (`#2ECC71`) and subtle checkmark.     |
+-------------------+---------------------------------------------------------+
| Disabled State    | 50% opacity, `cursor-not-allowed`, zero hover effects.  |
+-------------------+---------------------------------------------------------+
```

---

## 11. Accessibility, Contrast & Interaction Guidelines

1. **Color Contrast Verification (WCAG 2.1 AA):**
   - Pearl White (`#F9F9FA`) on Obsidian (`#0B0A0F`): **18.2:1** (Passes AAA).
   - Champagne Gold (`#E6CA65`) on Obsidian (`#0B0A0F`): **10.5:1** (Passes AAA).
   - Sovereign Gold (`#D4AF37`) on Obsidian (`#0B0A0F`): **7.8:1** (Passes AAA).
   - Black text (`#0B0A0F`) on Sovereign Gold (`#D4AF37`): **7.8:1** (Passes AAA).
   - Muted Lavender (`#948F9F`) on Obsidian (`#0B0A0F`): **5.1:1** (Passes AA).
2. **Keyboard Navigation & Focus Indicators:**
   - Every interactive control supports `Tab`, `Shift+Tab`, `Enter`, and `Space`.
   - Focused elements receive an unambiguous `2px solid #D4AF37` ring with a `2px offset`.
3. **Reduced Motion Adaptation:**
   - When `prefers-reduced-motion: reduce` is enabled:
     - Gallery transitions switch from sliding animations to instant opacity cross-fades.
     - Product card zoom on hover (`scale-105`) is deactivated.
     - Drawers appear instantaneously without sliding transitions.

---

## 12. Photography & Garment Direction (Men & Women)

To preserve the brand's luxury reputation and prevent high return rates, apparel imagery must adhere strictly to these principles:

1. **Standardized Aspect Ratio (3:4 Vertical):**
   - All catalog and product photography is framed in 3:4 portrait (1200x1600px native resolution).
   - Garments must not be stretched, distorted, or cropped at awkward seams.
2. **Color Calibration & Lighting Integrity:**
   - True-to-life color grading under 5500K daylight-balanced studio conditions.
   - Post-production color filters or saturation boosters are prohibited to ensure the fabric color received in the courier parcel matches the screen display.
3. **Required Multi-Angle Suite (Minimum 3 Angles per Product):**
   - **Angle 1 (Front Full):** Full-length model silhouette demonstrating overall fit and drape.
   - **Angle 2 (Back / 45-Degree):** Displays garment back, dupatta/shawl drape, or rear styling.
   - **Angle 3 (Macro Texture):** Close-up detail of fabric weave (pure silk, raw cotton, velvet) and embellishments (Zari, sequins, buttons).
