import { ProductSummary } from "@/types";

/**
 * Curated Demo Showcase Data for NOIR & GOLD
 * Documented in docs/visual-design-specification.md and docs/page-wireframes.md
 * Note: These are development demo items representative of planned catalog collections.
 */

export interface CategoryShowcaseItem {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  href: string;
  imageUrl: string;
  tag: string;
}

export const DEMO_CATEGORIES: CategoryShowcaseItem[] = [
  {
    id: "cat-women",
    title: "Women's Prêt & Couture",
    subtitle: "Pure micro-velvets, raw silks, and hand-embroidered anarkalis.",
    slug: "women",
    href: "/shop/women",
    imageUrl: "/images/categories/cat-women-pret.jpg",
    tag: "Atelier Women",
  },
  {
    id: "cat-men",
    title: "Men's Bespoke & Formal",
    subtitle: "Tailored sherwanis, prince coats, and ceremonial raw silk kurtas.",
    slug: "men",
    href: "/shop/men",
    imageUrl: "/images/categories/cat-men-bespoke.jpg",
    tag: "Atelier Men",
  },
  {
    id: "cat-shawls",
    title: "Festive Shawls & Wraps",
    subtitle: "Heirloom micro-velvet unisex shawls embellished with gold zari.",
    slug: "festive-shawls-wraps",
    href: "/shop?category=Festive+Shawls+%26+Wraps",
    imageUrl: "/images/categories/cat-festive-shawls.jpg",
    tag: "Artisanal Wraps",
  },
  {
    id: "cat-waistcoat",
    title: "Men's Kurta & Waistcoat",
    subtitle: "Banarsi jamawar vests paired with pure handloom raw silk.",
    slug: "mens-kurta-waistcoat",
    href: "/shop?category=Men%27s+Kurta+%26+Waistcoat",
    imageUrl: "/images/categories/cat-men-kurta.jpg",
    tag: "Ceremonial Sets",
  },
];

export const DEMO_PRODUCTS: ProductSummary[] = [
  {
    id: "prod-001",
    title: "Midnight Velvet Anarkali Set",
    slug: "midnight-velvet-anarkali-set",
    categoryName: "Women's Luxury Prêt",
    audience: "women",
    pricePkr: 24500,
    salePricePkr: 28000,
    primaryImageUrl: "/images/products/prod-001-primary.jpg",
    hoverImageUrl: "/images/products/prod-001-hover.jpg",
    isNew: true,
    availableSizes: ["XS", "S", "M", "L", "XL"],
    availableColors: ["Obsidian Black", "Deep Plum"],
    createdAt: "2026-10-08T12:00:00Z",
  },
  {
    id: "prod-002",
    title: "Royal Monolith Sherwani",
    slug: "royal-monolith-sherwani",
    categoryName: "Men's Bespoke & Formal",
    audience: "men",
    pricePkr: 32500,
    salePricePkr: null,
    primaryImageUrl: "/images/products/prod-002-primary.jpg",
    hoverImageUrl: "/images/products/prod-002-hover.jpg",
    isNew: true,
    availableSizes: ["38", "40", "42", "44"],
    availableColors: ["Obsidian Black", "Antique Gold"],
    createdAt: "2026-10-09T14:30:00Z",
  },
  {
    id: "prod-003",
    title: "Pure Raw Silk Kurta Set",
    slug: "pure-raw-silk-kurta-set",
    categoryName: "Men's Luxury Casual",
    audience: "men",
    pricePkr: 18500,
    salePricePkr: null,
    primaryImageUrl: "/images/products/prod-003-primary.jpg",
    hoverImageUrl: "/images/products/prod-003-hover.jpg",
    isLimited: true,
    availableSizes: ["S", "M", "L", "XL"],
    availableColors: ["Ivory", "Obsidian Black"],
    createdAt: "2026-10-05T09:15:00Z",
  },
  {
    id: "prod-004",
    title: "Hand-Embroidered Zari Shawl",
    slug: "hand-embroidered-zari-shawl",
    categoryName: "Festive Shawls & Wraps",
    audience: "unisex",
    pricePkr: 14000,
    salePricePkr: null,
    primaryImageUrl: "/images/products/prod-004-primary.jpg",
    hoverImageUrl: "/images/products/prod-004-hover.jpg",
    isNew: true,
    availableSizes: ["Standard"],
    availableColors: ["Antique Gold", "Deep Plum"],
    createdAt: "2026-10-07T16:00:00Z",
  },
  {
    id: "prod-005",
    title: "Silk Peplum Set",
    slug: "silk-peplum-set",
    categoryName: "Women's Luxury Prêt",
    audience: "women",
    pricePkr: 21500,
    salePricePkr: null,
    primaryImageUrl: "/images/products/prod-005-primary.jpg",
    hoverImageUrl: "/images/products/prod-005-hover.jpg",
    isNew: true,
    availableSizes: ["XS", "S", "M", "L"],
    availableColors: ["Emerald Green", "Obsidian Black"],
    createdAt: "2026-10-04T11:00:00Z",
  },
  {
    id: "prod-006",
    title: "Zari Velvet Formal Gown",
    slug: "zari-velvet-formal-gown",
    categoryName: "Women's Formal Wear",
    audience: "women",
    pricePkr: 34000,
    salePricePkr: null,
    primaryImageUrl: "/images/products/prod-006-primary.jpg",
    hoverImageUrl: "/images/products/prod-006-hover.jpg",
    isLimited: true,
    availableSizes: ["S", "M", "L"],
    availableColors: ["Deep Plum", "Obsidian Black"],
    createdAt: "2026-10-10T18:00:00Z",
  },
  {
    id: "prod-007",
    title: "Bespoke Prince Coat Ensemble",
    slug: "bespoke-prince-coat-ensemble",
    categoryName: "Men's Bespoke & Formal",
    audience: "men",
    pricePkr: 28000,
    salePricePkr: null,
    primaryImageUrl: "/images/products/prod-007-primary.jpg",
    hoverImageUrl: "/images/products/prod-007-hover.jpg",
    availableSizes: ["38", "40", "42"],
    availableColors: ["Royal Navy", "Obsidian Black"],
    createdAt: "2026-10-03T08:30:00Z",
  },
  {
    id: "prod-008",
    title: "Embroidered Formal Waistcoat Set",
    slug: "embroidered-formal-waistcoat-set",
    categoryName: "Men's Kurta & Waistcoat",
    audience: "men",
    pricePkr: 16500,
    salePricePkr: null,
    primaryImageUrl: "/images/products/prod-008-primary.jpg",
    hoverImageUrl: "/images/products/prod-008-hover.jpg",
    availableSizes: ["S", "M", "L", "XL"],
    availableColors: ["Antique Gold", "Obsidian Black"],
    createdAt: "2026-10-02T10:00:00Z",
  },
];

export const DEMO_FEATURED_PRODUCTS: ProductSummary[] = DEMO_PRODUCTS.slice(0, 4);
