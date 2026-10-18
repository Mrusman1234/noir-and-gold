# Design System & UI Specifications

**Project:** NOIR & GOLD — Luxury Apparel E-Commerce Store  
**Document Version:** 1.0.0  
**Status:** Approved for Implementation Planning  
**Date:** October 2026  

---

## 1. Visual Philosophy: The Dark Luxury Aesthetic

NOIR & GOLD embodies high-fashion editorial prestige. The visual language merges deep obsidian darkness, opulent aubergine/velvet purple undertones, and restrained, metallic warm gold highlights. The design avoids garish neon yellow golds, opting instead for refined champagne and antique gold tones inspired by haute couture ateliers and bespoke tailoring houses.

### Core Principles
1. **Atmospheric Depth:** Deep, layered dark surfaces establish a cinematic canvas that makes apparel imagery and textures leap forward.
2. **Restrained Gold:** Gold is an intentional accent—used exclusively for active focal points, primary action calls, fine hair-line borders, and brand badges—never overwhelming the UI.
3. **Architectural Precision:** Razor-sharp or micro-rounded silhouettes, thin 1px borders, generous whitespace/padding, and clear typographic hierarchy.
4. **Editorial Typography:** High-contrast pairing of a regal editorial serif for headlines and a modern geometric sans-serif for effortless readability on mobile screens.

---

## 2. Color Palette & Design Tokens

### 2.1 Complete Color Swatches (with Exact HEX Codes)

| Token Name | HEX Value | Tailwind Utility Class | Intended Application |
| :--- | :--- | :--- | :--- |
| **Obsidian Core (Base)** | `#0B0A0F` | `bg-noir-950` / `bg-obsidian` | Global page background, deepest canvas layer. |
| **Deep Velvet (Surface 1)** | `#14111B` | `bg-noir-900` / `bg-velvet` | Primary card surfaces, table headers, sticky nav bar. |
| **Royal Aubergine (Surface 2)** | `#1C1826` | `bg-noir-800` / `bg-aubergine` | Secondary cards, dropdown menus, input backgrounds. |
| **Midnight Slate (Surface 3)** | `#262134` | `bg-noir-700` | Hover states, active list selections, modal backdrops. |
| **Border / Divider** | `#362F4A` | `border-noir-600` | Subtle hairline dividers, container outlines (30%–50% opacity). |
| **Pure Sovereign Gold** | `#D4AF37` | `text-gold-500` / `bg-gold-500` | Primary action buttons, badges, key hover transitions. |
| **Champagne Gold (Light)** | `#E6CA65` | `text-gold-300` | High-contrast gold text on dark surfaces, icon highlights. |
| **Antique Pale Gold** | `#AA8B2F` | `border-gold-600` | Elegant hairline borders on luxury cards and secondary buttons. |
| **Muted Bronze Gold** | `#6E5A23` | `text-gold-800` | Disabled gold states, subtle background tinting. |
| **Pearl White (Headline)** | `#F9F9FA` | `text-pearl` | Primary headings, product titles, high-emphasis text. |
| **Soft Platinum (Body)** | `#D6D4DC` | `text-platinum` | Body paragraphs, product descriptions, input values. |
| **Muted Lavender-Grey** | `#948F9F` | `text-muted-lavender` | Secondary labels, timestamps, breadcrumbs, placeholder text. |
| **Status: Success / In-Stock** | `#2ECC71` | `text-emerald-500` | "In Stock" indicator, order confirmed state, coupon valid. |
| **Status: Warning / Low-Stock** | `#F39C12` | `text-amber-500` | "Only 2 left" indicator, pending order review state. |
| **Status: Error / Destructive** | `#E74C3C` | `text-rose-500` | Validation errors, out of stock, cancelled order, card remove. |

---

## 3. Typography Scale & System

### 3.1 Font Family Stacks
- **Display & Headings:** `Cormorant Garamond` (Google Font) or `Playfair Display`
  - Fallback: `Didot, Bodoni MT, "Times New Roman", serif`
  - Character: Regal, high-contrast, editorial elegance.
- **Body, UI & Numbers:** `Plus Jakarta Sans` or `Inter` (Google Font)
  - Fallback: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
  - Character: Clean, geometric, legible at small sizes, tabular figures for PKR pricing.

### 3.2 Typographic Hierarchy Scale

| Level | Size (Desktop / Mobile) | Line Height | Weight | Letter Spacing | Font Family |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display 1 (Hero)** | 56px / 38px | 1.1 | Bold (700) | `-0.02em` | Serif |
| **Display 2 (Campaign)**| 44px / 32px | 1.15 | SemiBold (600) | `-0.01em` | Serif |
| **Heading 1 (H1 - Page)**| 36px / 28px | 1.2 | SemiBold (600) | `normal` | Serif |
| **Heading 2 (H2 - Section)**| 28px / 22px | 1.25 | Medium (500) | `normal` | Serif |
| **Heading 3 (H3 - Card)** | 20px / 18px | 1.3 | Medium (500) | `normal` | Serif / Sans |
| **Body Large** | 18px / 16px | 1.6 | Regular (400) | `normal` | Sans |
| **Body Regular** | 15px / 14px | 1.5 | Regular (400) | `normal` | Sans |
| **Body Small** | 13px / 12px | 1.45 | Regular (400) | `+0.01em` | Sans |
| **Overline / Micro-label** | 11px / 10px | 1.3 | SemiBold (600) | `+0.12em` (Uppercase) | Sans |
| **Price (PKR)** | 18px / 16px | 1.2 | SemiBold (600) | `normal` (Tabular) | Sans |

---

## 4. Spacing, Borders, Radii, and Shadows

### 4.1 Spacing Scale (8-Point Grid)
- `2xs: 4px` — Micro gaps between badges, icon offsets.
- `xs: 8px` — Inner button padding, icon-to-label spacing.
- `sm: 12px` — Compact form control padding, chip gaps.
- `md: 16px` — Standard card interior padding, mobile grid margins.
- `lg: 24px` — Card margins, section column gutters.
- `xl: 32px` — Section vertical rhythm on tablet/mobile.
- `2xl: 48px` — Section vertical rhythm on desktop.
- `3xl: 64px` — Major homepage block spacing.
- `4xl: 96px` — Editorial hero section spacing.

### 4.2 Corner Radii Philosophy
To preserve the crisp, bespoke tailoring identity of high luxury fashion, rounded "pill" or bubble shapes are strictly avoided:
- `rounded-none: 0px` — Primary choice for editorial image containers, banner blocks, and primary CTAs.
- `rounded-sm: 2px` — Micro-softening for form inputs and table containers.
- `rounded: 4px` — Maximum allowable radius for badges, dropdown menus, and toasts.

### 4.3 Borders & Hairlines
- **Standard Border:** `1px solid rgba(54, 47, 74, 0.4)` (`#362F4A` at 40% opacity).
- **Gold Accent Border:** `1px solid rgba(212, 175, 55, 0.45)` (`#D4AF37` at 45% opacity).
- **Selected Variant Border:** `1.5px solid #D4AF37`.

### 4.4 Shadow & Ambient Glow Scale
- **Card Ambient Shadow:** `0 4px 20px -2px rgba(0, 0, 0, 0.7)`
- **Drawer / Modal Shadow:** `0 20px 40px -4px rgba(0, 0, 0, 0.9)`
- **Gold Glow (Hover Accent):** `0 0 20px rgba(212, 175, 55, 0.18)`

---

## 5. UI Component Conventions

### 5.1 Buttons

```
[ Primary Gold CTA ]        [ Secondary Outline ]       [ Ghost / Link ]
+-----------------------+   +-----------------------+   +-------------------+
|   ADD TO CART (COD)   |   |   VIEW COLLECTION     |   |   Return to Shop  |
+-----------------------+   +-----------------------+   +-------------------+
Background: #D4AF37         Background: Transparent     Background: None
Text: #0B0A0F (Bold)        Border: 1px #D4AF37         Text: #E6CA65
Hover: #E6CA65 + Glow       Text: #E6CA65               Hover: Text Underline
Radius: 0px or 2px          Hover: bg-[#D4AF37]/10      Radius: None
```

- **Primary Button:** High visual weight; black text over Pure Sovereign Gold (`#D4AF37`).
- **Secondary Button:** Architectural outline; transparent background, 1px Antique Gold border, Champagne Gold text.
- **Destructive Button:** Subtle deep red (`#922B21` background or `#E74C3C` text with dark border).

### 5.2 Form Inputs & Form Controls
- **Background:** Deep Velvet (`#14111B`) or Royal Aubergine (`#1C1826`).
- **Border:** Hairline Midnight Slate (`#362F4A`).
- **Focus State:** Border shifts cleanly to Pure Sovereign Gold (`#D4AF37`) with a subtle `rgba(212, 175, 55, 0.15)` ring; no browser-default blue outlines.
- **Labels:** Positioned cleanly above the input in Soft Platinum (`#D6D4DC`), with an explicit red asterisk (`*`) for mandatory fields.
- **Error State:** Border shifts to `#E74C3C` with an error message in 12px below the input.

### 5.3 Product Card
- **Aspect Ratio:** Fixed 3:4 portrait ratio for product imagery.
- **Image Treatment:** High-resolution product photograph; on desktop hover, smoothly cross-fades to the second angle (model back/detail shot) with a slight zoom (`scale-105` over 500ms).
- **Badges:** Top-left corner micro-badge: `"NEW"`, `"LIMITED"`, or `"SOLD OUT"` with dark purple background and gold hairline border.
- **Card Content:** 
  - Overline category name in Muted Lavender (`#948F9F`).
  - Product title in Pearl White (`#F9F9FA`) Cormorant Garamond.
  - Price formatted in Pakistani Rupees: `PKR 14,500` (or sale price `PKR 12,500` in Champagne Gold with crossed-out original in Muted Lavender).

### 5.4 Modals & Slide-Over Drawers
- **Backdrop:** Deep obsidian overlay with heavy gaussian blur (`bg-[#0B0A0F]/80 backdrop-blur-md`).
- **Drawer Panels:** Slide smoothly from the right edge with a clean left border of `#362F4A`. Header includes a gold close icon (`×`) and clear step count or item counter.

---

## 6. Responsive Breakpoints & Layout Grid

Tailwind-compatible breakpoint specifications:

| Screen Size | Breakpoint | Container Width | Storefront Grid Columns |
| :--- | :--- | :--- | :--- |
| **Mobile (Compact)** | `< 640px` | 100% (16px padding) | 1 column (or 2-column compact for shop grid) |
| **Mobile (Large / Phablet)** | `sm: 640px` | 100% (24px padding) | 2 columns |
| **Tablet** | `md: 768px` | 720px | 2 to 3 columns |
| **Desktop (Standard)** | `lg: 1024px` | 960px | 3 to 4 columns |
| **Desktop (Wide / Full)** | `xl: 1280px` | 1200px | 4 columns |
| **Ultra-Wide Screens** | `2xl: 1536px`| 1440px | 4 columns (max constrained with generous side margins) |

---

## 7. Accessibility & Contrast Guidelines (WCAG 2.1 AA)

1. **Text Contrast Compliance:**
   - Pearl White (`#F9F9FA`) on Obsidian (`#0B0A0F`): Contrast ratio **18.2:1** (Exceeds WCAG AAA).
   - Champagne Gold (`#E6CA65`) on Obsidian (`#0B0A0F`): Contrast ratio **10.5:1** (Exceeds WCAG AAA).
   - Sovereign Gold (`#D4AF37`) on Obsidian (`#0B0A0F`): Contrast ratio **7.8:1** (Exceeds WCAG AAA).
   - Black text (`#0B0A0F`) on Sovereign Gold button (`#D4AF37`): Contrast ratio **7.8:1** (Exceeds WCAG AAA).
   - Muted Lavender (`#948F9F`) on Obsidian (`#0B0A0F`): Contrast ratio **5.1:1** (Exceeds WCAG AA standard of 4.5:1 for body copy).
2. **Focus Visibility:**
   - Keyboard users navigating via `Tab` receive an explicit `2px solid #D4AF37` outline with `2px offset`.
3. **Screen Reader Labels:**
   - All interactive icon buttons (Search trigger, Cart drawer toggle, Wishlist heart) require explicit `aria-label` attributes.
   - Live variant selection changes use `aria-live="polite"` to communicate updated stock states to screen readers.

---

## 8. Photography & Visual Branding Guidelines

1. **Lighting & Atmosphere:**
   - Moody, high-contrast studio editorial lighting.
   - Dramatic soft rim-lighting on dark garments to accentuate silhouette, embroidery, and silk sheen against the dark backdrop.
2. **Model & Garment Framing:**
   - 3:4 portrait orientation (e.g., 1200x1600px).
   - Every product requires at least 3 standardized angles:
     - Shot 1: Full-length front silhouette.
     - Shot 2: 45-degree angle / movement shot.
     - Shot 3: Close-up macro detail of fabric texture, embroidery, gold threadwork, and button hardware.
3. **Color Accuracy:**
   - True-to-life color calibration to minimize customer returns caused by color discrepancy under ambient home lighting.
