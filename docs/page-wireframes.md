# Page Wireframes & Layout Architecture

**Project:** NOIR & GOLD — Luxury Apparel E-Commerce Store  
**Document Version:** 1.0.0  
**Status:** Approved Wireframe Specifications  
**Date:** October 2026  

---

## 1. Homepage (`/`)

### 1.1 Desktop Layout (>= 1024px)

```
+----------------------------------------------------------------------------------------------------+
| [ANNOUNCEMENT] COMPLIMENTARY DELIVERY ON ORDERS ABOVE PKR 7,500 ACROSS PAKISTAN | WHATSAPP CONCIERGE |
+----------------------------------------------------------------------------------------------------+
| [WOMEN]  [MEN]  [COLLECTIONS]          |   NOIR & GOLD   |          [SEARCH]  [WISHLIST(2)]  [BAG(1)] |
+----------------------------------------------------------------------------------------------------+
| HERO SECTION (SPLIT EDITORIAL BANNER - 650px Height)                                              |
| +-------------------------------------------------------+----------------------------------------+ |
| | EDITORIAL CAMPAIGN PHOTO                              | OVERLINE: AUTUMN / WINTER 2026         | |
| | (Model in Signature Obsidian Velvet Sherwani /        | HEADLINE: THE VELVET NOCTURNE           | |
| | Embroidered Raw Silk Anarkali)                        | TEXT: Handcrafted velvets and pure     | |
| |                                                       | silks woven with antique gold motifs.  | |
| |                                                       |                                        | |
| |                                                       | [ EXPLORE WOMEN'S PRET ] (Solid Gold)  | |
| |                                                       | [ EXPLORE MEN'S FORMAL ] (Gold Outline)| |
| +-------------------------------------------------------+----------------------------------------+ |
+----------------------------------------------------------------------------------------------------+
| CURATED COLLECTIONS (2-COLUMN GRID)                                                                |
| +---------------------------------------------------+--------------------------------------------+ |
| | [PHOTO: WOMEN'S LUXURY PRET]                      | [PHOTO: MEN'S BESPOKE ATELIER]             | |
| | Title: ELYSIAN SILKS & VELVETS                    | Title: ROYAL MONOLITH FORMAL               | |
| | Link: Discover Women's Edit →                     | Link: Discover Men's Edit →                | |
| +---------------------------------------------------+--------------------------------------------+ |
+----------------------------------------------------------------------------------------------------+
| NEW ARRIVALS (4-COLUMN RESPONSIVE PRODUCT GRID)                                                    |
| Section Header: NEW ARRIVALS — Autumn / Winter 2026                                               |
| +-------------------+ +-------------------+ +-------------------+ +------------------------------+ |
| | [CARD 1: 3:4]     | | [CARD 2: 3:4]     | | [CARD 3: 3:4]     | | [CARD 4: 3:4]                | |
| | [NEW]         [♡] | | [NEW]         [♡] | | [LIMITED]     [♡] | | [NEW]                    [♡] | |
| | Midnight Sherwani | | Velvet Anarkali   | | Raw Silk Kurta    | | Embroidered Shawl            | |
| | PKR 32,500        | | PKR 26,000        | | PKR 18,500        | | PKR 14,000                   | |
| +-------------------+ +-------------------+ +-------------------+ +------------------------------+ |
+----------------------------------------------------------------------------------------------------+
| ATELIER SPOTLIGHT (CRAFTSMANSHIP & TEXTILES)                                                       |
| +---------------------------------------------+--------------------------------------------------+ |
| | MACRO PHOTO: Hand-loom Zari threadwork      | "THE ART OF PAKISTANI LUXURY"                    | |
| | on deep midnight velvet weave               | Detailed storytelling on master karigars, pure   | |
| |                                             | natural silks, and bespoke atelier finishing.    | |
| +---------------------------------------------+--------------------------------------------------+ |
+----------------------------------------------------------------------------------------------------+
| TRUST & REGIONAL LOGISTICS BANNER (4-COLUMN HIGHLIGHTS)                                            |
| [1] Cash on Delivery Nationwide  [2] Express 24-48h Delivery  [3] 7-Day Exchange  [4] WhatsApp Care|
+----------------------------------------------------------------------------------------------------+
| FOOTER (Brand Manifesto, Collections, Customer Care Policies, Contact, Copyright & COD Notice)      |
+----------------------------------------------------------------------------------------------------+
```

- **Section Order:** Announcement Bar → Navigation Header → Hero Editorial → Curated Collections → New Arrivals → Atelier Spotlight → Trust Banner → Footer.
- **Main User Actions:** Browse Men/Women, click collection banners, add items to wishlist, open slide-over cart, search catalog.

---

### 1.2 Mobile Layout (< 1024px)

```
+--------------------------------------------------+
| [ANNOUNCEMENT] FREE DELIVERY OVER PKR 7,500 (COD)|
+--------------------------------------------------+
| [☰ MENU]           NOIR & GOLD         [🔍] [👜:1]|
+--------------------------------------------------+
| HERO EDITORIAL (FULL BLEED STACKED)              |
| +----------------------------------------------+ |
| | 3:4 EDITORIAL MODEL PHOTOGRAPH               | |
| | (Atmospheric rim lighting, pure silk drape)  | |
| +----------------------------------------------+ |
| | THE VELVET NOCTURNE                          | |
| | Bespoke Autumn / Winter 2026 Collection      | |
| |                                              | |
| | [ EXPLORE WOMEN'S PRET ] (Full-width Gold)   | |
| | [ EXPLORE MEN'S FORMAL ] (Full-width Outline)| |
+--------------------------------------------------+
| CURATED COLLECTIONS (VERTICAL STACK)             |
| +----------------------------------------------+ |
| | [PHOTO: WOMEN'S PRET]                        | |
| | ELYSIAN SILKS & VELVETS  [DISCOVER →]        | |
| +----------------------------------------------+ |
| | [PHOTO: MEN'S FORMAL]                        | |
| | ROYAL MONOLITH FORMAL    [DISCOVER →]        | |
+--------------------------------------------------+
| NEW ARRIVALS (2-COLUMN COMPACT GRID)             |
| +---------------------+ +----------------------+ |
| | [CARD 1: 3:4]   [♡] | | [CARD 2: 3:4]    [♡] | |
| | Midnight Sherwani   | | Velvet Anarkali      | |
| | PKR 32,500          | | PKR 26,000           | |
| +---------------------+ +----------------------+ |
+--------------------------------------------------+
| REGIONAL TRUST (2x2 GRID)                        |
| [Cash on Delivery]      [Express 24-48h Dispatch]|
| [7-Day Exchange Window] [WhatsApp Concierge]     |
+--------------------------------------------------+
| FOOTER (Accordion Navigation & WhatsApp Hotline) |
+--------------------------------------------------+
```

- **Mobile Adaptations:** Header compresses to 56px sticky bar; hero buttons become full-width 48px touch targets; product grid renders in 2 columns with touch-optimized margins.

---

## 2. Shop / Product Listing Page (`/shop`, `/shop/[category]`)

### 2.1 Desktop Layout (>= 1024px)

```
+----------------------------------------------------------------------------------------------------+
| HEADER & BREADCRUMBS: Home / Women / Luxury Pret                                                   |
| CATEGORY TITLE: WOMEN'S LUXURY PRET (64 Items Found)                                               |
+----------------------------------------------------------------------------------------------------+
| [STICKY FILTER SIDEBAR (280px)]  | [PRODUCT GRID & CONTROLS (FLEX)]                                |
|                                  | Filter Pills: [Size: M ×] [In Stock Only ×] [Clear All]        |
| SUBCATEGORIES                    | Sorting: [ Sort by: Newest Arrivals ▾ ]                         |
| [ ] Formal Wear (24)             |                                                                 |
| [x] Luxury Pret (18)             | +-------------------+ +-------------------+ +-----------------+ |
| [ ] Festive Shawls (12)          | | [CARD 1: 3:4] [♡] | | [CARD 2: 3:4] [♡] | | [CARD 3: 3:4] | |
|                                  | | Velvet Anarkali   | | Silk Peplum Set   | | Pure Organza  | |
| SIZE                             | | PKR 26,000        | | PKR 21,500        | | PKR 19,000    | |
| [XS] [S] [xM] [L] [XL]           | +-------------------+ +-------------------+ +-----------------+ |
|                                  | +-------------------+ +-------------------+ +-----------------+ |
| COLOR                            | | [CARD 4: 3:4] [♡] | | [CARD 5: 3:4] [♡] | | [CARD 6: 3:4] | |
| [● Black] [● Plum] [● Gold]      | | Zari Kurta Set    | | Raw Silk Tunic    | | Velvet Gown   | |
|                                  | | PKR 18,500        | | PKR 16,000        | | PKR 34,000    | |
| PRICE (PKR)                      | +-------------------+ +-------------------+ +-----------------+ |
| [Min: 10,000] - [Max: 50,000]    |                                                                 |
|                                  | PAGINATION:  [< Prev]   [1]   [2]   [3]   [4]   [Next >]        |
| AVAILABILITY                     | Showing 1–12 of 64 products                                     |
| [x] In Stock Only                |                                                                 |
+----------------------------------+-----------------------------------------------------------------+
```

- **Main User Actions:** Select filter facets, change sort order, hover to see alternate product angle and quick size drawer, toggle wishlist, paginate.

---

### 2.2 Mobile Layout (< 1024px)

```
+--------------------------------------------------+
| HEADER & BREADCRUMBS: Home / Women               |
| CATEGORY TITLE: WOMEN'S LUXURY PRET (64 Items)   |
+--------------------------------------------------+
| FILTER & SORT CONTROL BAR (STICKY 48px)          |
| [ ⚙ FILTERS (2 Active) ]    |  [ ⇅ SORT: NEWEST ]|
+--------------------------------------------------+
| 2-COLUMN RESPONSIVE PRODUCT GRID                 |
| +---------------------+ +----------------------+ |
| | [CARD 1: 3:4]   [♡] | | [CARD 2: 3:4]    [♡] | |
| | Velvet Anarkali     | | Silk Peplum Set      | |
| | PKR 26,000          | | PKR 21,500           | |
| +---------------------+ +----------------------+ |
| +---------------------+ +----------------------+ |
| | [CARD 3: 3:4]   [♡] | | [CARD 4: 3:4]    [♡] | |
| | Pure Organza Shirt  | | Zari Kurta Set       | |
| | PKR 19,000          | | PKR 18,500           | |
| +---------------------+ +----------------------+ |
+--------------------------------------------------+
| MOBILE PAGINATION: [ < PREV ]  Page 1 of 6  [ NEXT > ]
+--------------------------------------------------+
| [MOBILE FILTER DRAWER (SLIDES UP ON TRIGGER)]    |
| Header: Filter Products (64 Results)     [Close ×]|
| - Accordion: Subcategory                         |
| - Size Selection Chips                           |
| - Color Swatches                                 |
| - Price Range Inputs (PKR)                       |
| Sticky Bottom Bar: [ APPLY FILTERS (64) ] (Gold) |
+--------------------------------------------------+
```

- **Mobile Adaptations:** Filters move to a dedicated bottom drawer with active count pills; sticky sort/filter bar remains reachable during scroll.

---

## 3. Product Detail Page (PDP) (`/product/[slug]`)

### 3.1 Desktop Layout (>= 1024px)

```
+----------------------------------------------------------------------------------------------------+
| BREADCRUMBS: Home / Women / Luxury Pret / Midnight Velvet Anarkali                                 |
+----------------------------------------------------------------------------------------------------+
| [STICKY GALLERY COLUMN (55% WIDTH)] | [PURCHASING & DETAILS COLUMN (45% WIDTH)]                    |
|                                     |                                                              |
| +---------------------------------+ | BRAND OVERLINE: NOIR & GOLD ATELIER                          |
| |                                 | | TITLE: Midnight Velvet Anarkali Set                          |
| |                                 | | SKU: NG-W26-MVA-01                                           |
| |                                 | |                                                              |
| |      PRIMARY 3:4 VIEWPORT       | | PRICE: PKR 24,500   Original: PKR 28,000 (12% Off)           |
| |   High-Resolution Editorial     | | STATUS: [● In Stock — Dispatches in 24 Hours] (Emerald)      |
| |     With Hover Zoom Lens        | | ------------------------------------------------------------ |
| |                                 | | COLOR: Midnight Obsidian                                     |
| |                                 | | [● Obsidian (Selected)]   [● Deep Plum]   [● Antique Gold]   |
| |                                 | | ------------------------------------------------------------ |
| +---------------------------------+ | SELECT SIZE:                  [ SIZING & MEASUREMENT GUIDE ?]|
| [THUMB 1]  [THUMB 2]  [THUMB 3]     | [XS]   [ S ]   [x M]   [ L ]   [XL (Sold Out)]               |
| (Front)    (Back)     (Zari Macro)  | Real-time inventory: "Only 2 items left in stock"            |
|                                     | ------------------------------------------------------------ |
|                                     | QUANTITY: [-]  1  [+]                                        |
|                                     |                                                              |
|                                     | [ ADD TO SHOPPING BAG (COD) ] (Solid Sovereign Gold Button)  |
|                                     | [ ♡ ADD TO WISHLIST ]         (Antique Gold Outline Button)  |
|                                     | ------------------------------------------------------------ |
|                                     | ACCORDION DETAILS:                                           |
|                                     | [+] Fabric Composition & Atelier Craftsmanship               |
|                                     |     (Pure Micro-Velvet with Zari & Dabka handwork)           |
|                                     | [+] Wash & Care Instructions (Dry Clean Only)                |
|                                     | [+] Shipping & Cash on Delivery (COD) Coverage               |
|                                     | [+] 7-Day Inspection & Exchange Policy                       |
+-------------------------------------+--------------------------------------------------------------+
| RECOMMENDED ATELIER PIECES (4-COLUMN CAROUSEL)                                                     |
+----------------------------------------------------------------------------------------------------+
```

- **Main User Actions:** Switch gallery thumbnails, trigger zoom lens, change colorway, select size chip, open size guide modal, increment quantity, add to cart.

---

### 3.2 Mobile Layout (< 1024px)

```
+--------------------------------------------------+
| BREADCRUMBS: Home / Women / Pret                 |
+--------------------------------------------------+
| PRODUCT MEDIA GALLERY (TOUCH SWIPE)              |
| +----------------------------------------------+ |
| | 3:4 PORTRAIT IMAGE CAROUSEL                  | |
| | (Swipeable 1 of 4, pinch-to-zoom support)    | |
| +----------------------------------------------+ |
| [● 1]  [○ 2]  [○ 3]  [○ 4] (Dot indicators)      |
+--------------------------------------------------+
| PRODUCT DETAILS                                  |
| TITLE: Midnight Velvet Anarkali Set              |
| PRICE: PKR 24,500   PKR 28,000                   |
| STATUS: [● In Stock — Dispatches in 24h]         |
|                                                  |
| COLOR: Midnight Obsidian                         |
| [● Obsidian]  [● Deep Plum]  [● Antique Gold]    |
|                                                  |
| SIZE:                 [ SIZE GUIDE (IN/CM) ? ]   |
| [XS]   [ S ]   [x M]   [ L ]   [XL (Sold Out)]   |
| "Only 2 items left in stock"                     |
|                                                  |
| QUANTITY: [-]  1  [+]                            |
|                                                  |
| [ ADD TO SHOPPING BAG (COD) ] (Full-width Gold)  |
| [ ♡ SAVE TO WISHLIST ]        (Full-width Outline)|
|                                                  |
| ACCORDION: Fabric, Care & Delivery Details       |
+--------------------------------------------------+
| [STICKY BOTTOM BUY BAR (Appears on scroll)]      |
| Anarkali (Size M) | PKR 24,500 | [ ADD TO BAG ]  |
+--------------------------------------------------+
```

- **Mobile Adaptations:** Touch carousel with indicator dots; full-width buttons; sticky bottom buy bar ensures user can add to cart at any point while reading descriptions.

---

## 4. Shopping Cart (`/cart` & Slide-Over Drawer)

### 4.1 Slide-Over Cart Drawer (`CartDrawer`)

```
+---------------------------------------------------------------+
| SHOPPING BAG (2 ITEMS)                                [CLOSE ×]|
+---------------------------------------------------------------+
| FREE DELIVERY METER:                                          |
| [████████████████████████░░░░░░░░░] PKR 6,000 / PKR 7,500     |
| Add PKR 1,500 more for Free Delivery across Pakistan!         |
+---------------------------------------------------------------+
| LINE ITEMS:                                                   |
| +---------+-------------------------------------------------+ |
| | [THUMB] | Midnight Velvet Anarkali Set                    | |
| |  80x106 | Color: Obsidian | Size: M                       | |
| |         | PKR 24,500                                      | |
| |         | Quantity: [-]  1  [+]                [Remove 🗑] | |
| +---------+-------------------------------------------------+ |
| +---------+-------------------------------------------------+ |
| | [THUMB] | Hand-Embroidered Zari Shawl                     | |
| |  80x106 | Color: Antique Gold | Size: Standard            | |
| |         | PKR 14,000                                      | |
| |         | Quantity: [-]  1  [+]                [Remove 🗑] | |
| +---------+-------------------------------------------------+ |
+---------------------------------------------------------------+
| ORDER SUMMARY:                                                |
| Subtotal:                                          PKR 38,500 |
| Shipping:                           Calculated at Checkout    |
| Delivery Method:              Cash on Delivery (Nationwide)   |
|                                                               |
| [ PROCEED TO CHECKOUT (COD) ] (Solid Sovereign Gold)          |
| [ View Full Shopping Bag ]    (Ghost Link)                    |
+---------------------------------------------------------------+
```

- **Main User Actions:** Adjust quantities, remove items, observe free delivery meter update, click "Proceed to Checkout".

---

## 5. Checkout Page (`/checkout`)

### 5.1 Desktop Layout (>= 1024px)

```
+----------------------------------------------------------------------------------------------------+
| NOIR & GOLD — SECURE CASH ON DELIVERY CHECKOUT                                                     |
+------------------------------------------------------------------+---------------------------------+
| CHECKOUT FORM (LEFT COLUMN - 60% WIDTH)                          | ORDER SUMMARY (STICKY - 40%)    |
|                                                                  |                                 |
| 1. CONTACT INFORMATION                                           | ITEMS IN ORDER (2)              |
| Email Address:   [ customer@domain.com                         ] | Velvet Anarkali (M)  PKR 24,500 |
| Mobile Phone:    [ +92 300 1234567                             ] | Zari Shawl (Std)     PKR 14,000 |
| (Used for SMS and WhatsApp delivery coordination)                | ------------------------------- |
|                                                                  | Subtotal:            PKR 38,500 |
| 2. DELIVERY DESTINATION (PAKISTAN)                               | Shipping (Nationwide):   PKR 400 |
| Recipient Name:  [ Fatima Khan                                 ] | Promo Discount:         - PKR 0 |
| Street Address:  [ House 42, Street 14, Sector F-7/2            ] | ------------------------------- |
| Nearest Landmark:[ Opposite Safa Gold Mall (Required)          ] | GRAND TOTAL (COD):   PKR 38,900 |
| City:            [ Islamabad ▾                                 ] |                                 |
| Province:        [ Islamabad Capital Territory (Auto)          ] | PROMO CODE / COUPON:            |
| Delivery Notes:  [ Please call 30 mins prior to arrival        ] | [ ENTER CODE      ] [ APPLY ]   |
|                                                                  |                                 |
| 3. PAYMENT METHOD                                                | PAYMENT METHOD SELECTED:        |
| (●) Cash on Delivery (COD)                                       | [●] Cash on Delivery (COD)      |
|     "Pay cash directly to courier upon parcel arrival."          | "No card required. Pay courier."|
|                                                                  |                                 |
| [ CONFIRM ORDER (CASH ON DELIVERY) ] (Primary Sovereign Gold)    | [ CONFIRM ORDER (COD) ]         |
+------------------------------------------------------------------+---------------------------------+
```

---

### 5.2 Mobile Layout (< 1024px)

```
+--------------------------------------------------+
| NOIR & GOLD — CHECKOUT                           |
+--------------------------------------------------+
| ORDER SUMMARY DROPDOWN: Total PKR 38,900 [View ▾]|
+--------------------------------------------------+
| STEP 1: CONTACT DETAILS                          |
| Mobile Number: [ +92 300 1234567               ] |
| Email:         [ customer@domain.com           ] |
+--------------------------------------------------+
| STEP 2: PAKISTANI DELIVERY DESTINATION           |
| Full Name:     [ Fatima Khan                   ] |
| Street Address:[ House 42, Street 14, F-7/2    ] |
| Landmark:      [ Near Safa Mall (Required)     ] |
| City:          [ Islamabad ▾                   ] |
| Province:      [ Islamabad Capital Territory   ] |
+--------------------------------------------------+
| STEP 3: PAYMENT METHOD                           |
| [●] Cash on Delivery (COD)                       |
+--------------------------------------------------+
| PROMO CODE:    [ CODE ] [ APPLY ]                |
+--------------------------------------------------+
| GRAND TOTAL (COD): PKR 38,900                    |
| [ CONFIRM ORDER (CASH ON DELIVERY) ] (Gold CTA)  |
+--------------------------------------------------+
```

- **Main User Actions:** Enter mobile phone and landmark, pick city (triggers live shipping rate recalculation), apply promo code, confirm COD order.

---

## 6. Login & Registration Pages (`/login`, `/register`)

### 6.1 Desktop Layout

```
+----------------------------------------------------------------------------------------------------+
| CENTERED LUXURY CARD (CARD WIDTH: 480px, BACKGROUND: #14111B VELVET, BORDER: #362F4A)               |
|                                                                                                    |
|                                         NOIR & GOLD                                                |
|                                       ATELIER ACCOUNT                                              |
|                                                                                                    |
| [ TAB: SIGN IN (ACTIVE) ]                          [ TAB: CREATE ACCOUNT ]                         |
|                                                                                                    |
| Email Address:                                                                                     |
| [ customer@domain.com                                                                            ] |
|                                                                                                    |
| Password:                                                                                          |
| [ ••••••••••••••••                                                                     [Show 👁] ] |
|                                                                                                    |
| [x] Remember this device                           [ Forgot Password? ]                            |
|                                                                                                    |
| [ SIGN IN TO ATELIER ] (Solid Sovereign Gold Button)                                               |
|                                                                                                    |
| -------------------------------------- OR -------------------------------------------------------- |
|                                                                                                    |
| New to NOIR & GOLD? [ Create an Atelier Account ]                                                  |
| Direct Order Tracking: [ Track Your Parcel Without Sign In → ]                                     |
+----------------------------------------------------------------------------------------------------+
```

- **Registration Fields:** Full Name, Email Address, Pakistani Mobile Phone (`+92 3XX XXXXXXX`), Password, Confirm Password.

---

## 7. Customer Account & Order History (`/account`, `/account/orders`)

### 7.1 Desktop Layout (>= 1024px)

```
+----------------------------------------------------------------------------------------------------+
| ACCOUNT DASHBOARD: Welcome, Fatima Khan                                                            |
+-----------------------------------+----------------------------------------------------------------+
| [ACCOUNT NAVIGATION (260px)]      | [ACCOUNT WORKSPACE CONTENT]                                    |
|                                   |                                                                |
| [x] Order History                 | ORDER HISTORY (3 Orders Placed)                                |
| [ ] Saved Addresses (2)           |                                                                |
| [ ] Profile & Security            | +------------------------------------------------------------+ |
| [ ] Wishlist (4 Items)            | | ORDER #NG-2026-10492                      DATE: 10 Oct 2026| |
| [ ] Logout                        | | Status: [● SHIPPED] (Trax Logistics: TR-9482103)          | |
|                                   | | Items: Midnight Velvet Anarkali Set (M) x1                 | |
|                                   | | Total: PKR 24,800 (COD)                                    | |
|                                   | | [ View Order Receipt ]       [ Track Consignment ↗ ]       | |
|                                   | +------------------------------------------------------------+ |
|                                   | +------------------------------------------------------------+ |
|                                   | | ORDER #NG-2026-09811                      DATE: 14 Sep 2026| |
|                                   | | Status: [● DELIVERED]                                      | |
|                                   | | Items: Pure Raw Silk Kurta (M) x1                          | |
|                                   | | Total: PKR 18,500 (COD)                                    | |
|                                   | | [ View Order Receipt ]       [ Reorder Items ]             | |
|                                   | +------------------------------------------------------------+ |
+-----------------------------------+----------------------------------------------------------------+
```

---

## 8. Admin Dashboard (`/admin/dashboard`, `/admin/orders`, `/admin/products/new`)

### 8.1 Admin Orders Overview Layout

```
+----------------------------------------------------------------------------------------------------+
| NOIR & GOLD | Orders > Order Management                      [View Live Store ↗]  [Admin: Ali R. ▾]|
| PORTAL      +--------------------------------------------------------------------------------------+
|             | ORDERS PIPELINE METRICS                                                              |
| [Dashboard] | Total Orders: 142 | Pending: 12 | Confirmed: 18 | Shipped: 24 | Delivered: 82       |
| [Products]  +--------------------------------------------------------------------------------------+
| [Categories]| PIPELINE TABS: [All]  [x Pending (12)]  [Confirmed (18)]  [Shipped (24)]  [Failed/RTO] |
| [Inventory] +--------------------------------------------------------------------------------------+
| [x Orders]  | Search: [ Customer name, phone, order #...   ]  Zone: [ All Zones ▾ ] Date: [ Today ▾]|
| [Customers] +--------------------------------------------------------------------------------------+
| [Coupons]   | Order ID   | Date    | Customer     | City   | Items | Total (PKR)| Status  | Action  |
| [Shipping]  | NG-10492   | 10:14 AM| Fatima K.    | ISB    | 2     | 38,900     | [PEND]  | [View 👁]|
| [Audit Logs]| NG-10491   | 09:30 AM| Usman R.     | KHI    | 1     | 18,500     | [CONF]  | [View 👁]|
| [Settings]  | NG-10490   | Yesterday| Zainab B.   | LHR    | 3     | 54,000     | [SHIP]  | [View 👁]|
+-------------+--------------------------------------------------------------------------------------+
```

### 8.2 Admin Product Creator (`/admin/products/new`)

```
+----------------------------------------------------------------------------------------------------+
| CREATE NEW PRODUCT                                                     [ CANCEL ]  [ SAVE PRODUCT ]|
+-------------------------------------------------+--------------------------------------------------+
| BASIC INFORMATION                               | MEDIA ASSETS (DRAG & DROP)                       |
| Product Title: [ Midnight Velvet Anarkali Set ] | +----------------------------------------------+ |
| Slug:          [ midnight-velvet-anarkali-set ] | | [THUMB 1 (Primary)]  [THUMB 2]  [THUMB 3]    | |
| Category:      [ Women's Luxury Pret ▾        ] | | Drag files here to upload (3:4 portrait)     | |
| Description:   [ Rich Text Editorial Editor   ] | +----------------------------------------------+ |
| Fabric Details:[ Pure micro-velvet, silk lining]|                                                  |
| Care Guide:    [ Professional dry clean only  ] | PRICING & INVENTORY                              |
|                                                 | Base Price (PKR): [ 28,000 ] Sale: [ 24,500 ]    |
| VARIANT MATRIX GENERATOR                        | ------------------------------------------------ |
| Colors: [x] Obsidian Black  [x] Deep Plum       | VARIANT SKUS (GENERATED MATRIX):                 |
| Sizes:  [x] XS  [x] S  [x] M  [x] L  [x] XL     | - NG-MVA-OBS-S  | Stock: [ 10 ] | Price: [24,500]|
|                                                 | - NG-MVA-OBS-M  | Stock: [ 15 ] | Price: [24,500]|
| Status: (●) Published   (○) Draft               | - NG-MVA-PLM-S  | Stock: [  8 ] | Price: [24,500]|
+-------------------------------------------------+--------------------------------------------------+
```
