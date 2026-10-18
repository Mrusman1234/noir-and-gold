import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding NOIR & GOLD SQL Database...");

  // 1. Seed Shipping Zones
  const shippingZones = [
    {
      id: "zone-karachi",
      zoneName: "Local Karachi",
      shippingFeePkr: 200,
      freeThresholdPkr: 10000,
      estimatedDays: "1-2 Business Days",
    },
    {
      id: "zone-metros",
      zoneName: "Major Metros (Lahore, Islamabad, Rawalpindi)",
      shippingFeePkr: 300,
      freeThresholdPkr: 10000,
      estimatedDays: "2-4 Business Days",
    },
    {
      id: "zone-nationwide",
      zoneName: "Nationwide Pakistan",
      shippingFeePkr: 400,
      freeThresholdPkr: 10000,
      estimatedDays: "3-5 Business Days",
    },
  ];

  for (const zone of shippingZones) {
    const existing = await prisma.shippingZone.findUnique({ where: { id: zone.id } });
    if (!existing) {
      await prisma.shippingZone.create({ data: zone });
    }
  }

  // 2. Seed Categories
  const categories = [
    {
      id: "cat-w-pret",
      name: "Women's Luxury Prêt",
      slug: "womens-luxury-pret",
      audience: "women",
      description: "Artisanal hand-worked tunics, flared anarkalis, and ready-to-wear luxury silhouettes.",
      imageUrl: "/images/category-women.svg",
    },
    {
      id: "cat-m-bespoke",
      name: "Men's Bespoke & Formal",
      slug: "mens-bespoke-formal",
      audience: "men",
      description: "Architectural imperial sherwanis and structured bespoke prince coats.",
      imageUrl: "/images/category-men.svg",
    },
    {
      id: "cat-m-casual",
      name: "Men's Luxury Casual",
      slug: "mens-luxury-casual",
      audience: "men",
      description: "Handloom natural raw silk kurtas and tailored ceremonial shalwars.",
      imageUrl: "/images/product-kurta.svg",
    },
    {
      id: "cat-shawls",
      name: "Festive Shawls & Wraps",
      slug: "festive-shawls-wraps",
      audience: "unisex",
      description: "Heirloom micro-velvet unisex shawls embellished with authentic tilla and gold zari.",
      imageUrl: "/images/product-shawl.svg",
    },
    {
      id: "cat-w-formal",
      name: "Women's Formal Wear",
      slug: "womens-formal-wear",
      audience: "women",
      description: "Dramatic godet gowns and opulent zardozi wedding guest ensembles.",
      imageUrl: "/images/product-anarkali.svg",
    },
    {
      id: "cat-m-waistcoat",
      name: "Men's Kurta & Waistcoat",
      slug: "mens-kurta-waistcoat",
      audience: "men",
      description: "Banarsi jamawar vests paired with coordinating pure cotton-silk ensembles.",
      imageUrl: "/images/product-kurta.svg",
    },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
  }

  // 3. Seed Products with Variants and Images
  const products = [
    {
      id: "prod-001",
      slug: "midnight-velvet-anarkali-set",
      title: "Midnight Velvet Anarkali Set",
      categorySlug: "womens-luxury-pret",
      audience: "women",
      pricePkr: 24500,
      salePricePkr: 28000,
      isNew: true,
      isLimited: false,
      isFeatured: true,
      primaryImageUrl: "/images/product-anarkali.svg",
      hoverImageUrl: "/images/product-anarkali.svg",
      description:
        "Handcrafted from pure 9000 micro-velvet, this ceremonial anarkali silhouette features intricate antique zardozi, kora, and dabka hand-embroidery along the neckline and cuffs. Paired with a crushed raw silk churidar and an organza dupatta with scalloped borders.",
      fabricDetails: "100% Pure Micro-Velvet (Anarkali), Raw Silk 80g (Churidar), Pure Organza (Dupatta)",
      careInstructions: "Strictly Dry Clean Only by luxury garment specialists. Steam iron inside out with protective muslin cloth.",
      images: [
        { url: "/images/product-anarkali.svg", altText: "Midnight Velvet Anarkali Set - Front View", displayOrder: 0, isPrimary: true },
        { url: "/images/craftsmanship-detail.svg", altText: "Macro Zari Embroidery Detail", displayOrder: 1, isPrimary: false },
        { url: "/images/category-women.svg", altText: "Silhouette Editorial View", displayOrder: 2, isPrimary: false },
      ],
      variants: [
        { sku: "NG-W26-MVA-01-BLK-XS", size: "XS", colorName: "Obsidian Black", colorHex: "#0B0A0F", stockQuantity: 3, pricePkr: 24500 },
        { sku: "NG-W26-MVA-01-BLK-S", size: "S", colorName: "Obsidian Black", colorHex: "#0B0A0F", stockQuantity: 5, pricePkr: 24500 },
        { sku: "NG-W26-MVA-01-BLK-M", size: "M", colorName: "Obsidian Black", colorHex: "#0B0A0F", stockQuantity: 2, pricePkr: 24500 },
        { sku: "NG-W26-MVA-01-BLK-L", size: "L", colorName: "Obsidian Black", colorHex: "#0B0A0F", stockQuantity: 4, pricePkr: 24500 },
        { sku: "NG-W26-MVA-01-PLM-S", size: "S", colorName: "Deep Plum", colorHex: "#2E1036", stockQuantity: 3, pricePkr: 24500 },
        { sku: "NG-W26-MVA-01-PLM-M", size: "M", colorName: "Deep Plum", colorHex: "#2E1036", stockQuantity: 4, pricePkr: 24500 },
      ],
    },
    {
      id: "prod-002",
      slug: "royal-monolith-sherwani",
      title: "Royal Monolith Sherwani",
      categorySlug: "mens-bespoke-formal",
      audience: "men",
      pricePkr: 32500,
      salePricePkr: null,
      isNew: true,
      isLimited: false,
      isFeatured: true,
      primaryImageUrl: "/images/product-sherwani.svg",
      hoverImageUrl: "/images/product-sherwani.svg",
      description:
        "A sculptural royal sherwani crafted from structured imperial jacquard brocade with delicate tone-on-tone matte threadwork. Features hand-cast 24k gold-plated monogram buttons and an architectural Mandarin collar tailored for royal Pakistani ceremonial affairs.",
      fabricDetails: "Structured Imperial Jacquard Brocade, Bemberg Cupro Silk Lining",
      careInstructions: "Strictly Specialist Dry Clean Only. Store on contoured wooden hanger in garment dust-cover.",
      images: [
        { url: "/images/product-sherwani.svg", altText: "Royal Monolith Sherwani - Editorial Front", displayOrder: 0, isPrimary: true },
        { url: "/images/craftsmanship-detail.svg", altText: "Brocade and Monogram Buttons", displayOrder: 1, isPrimary: false },
      ],
      variants: [
        { sku: "NG-M26-RMS-02-BLK-38", size: "38", colorName: "Obsidian Black", colorHex: "#0B0A0F", stockQuantity: 3, pricePkr: 32500 },
        { sku: "NG-M26-RMS-02-BLK-40", size: "40", colorName: "Obsidian Black", colorHex: "#0B0A0F", stockQuantity: 4, pricePkr: 32500 },
        { sku: "NG-M26-RMS-02-BLK-42", size: "42", colorName: "Obsidian Black", colorHex: "#0B0A0F", stockQuantity: 2, pricePkr: 32500 },
        { sku: "NG-M26-RMS-02-GLD-40", size: "40", colorName: "Antique Gold", colorHex: "#C5A059", stockQuantity: 3, pricePkr: 32500 },
      ],
    },
    {
      id: "prod-003",
      slug: "pure-raw-silk-kurta-set",
      title: "Pure Raw Silk Kurta Set",
      categorySlug: "mens-luxury-casual",
      audience: "men",
      pricePkr: 18500,
      salePricePkr: null,
      isNew: false,
      isLimited: true,
      isFeatured: true,
      primaryImageUrl: "/images/product-kurta.svg",
      hoverImageUrl: "/images/product-kurta.svg",
      description:
        "An understated luxury essential woven from 100% natural Pakistani raw silk with distinctive tactile slub texture. Styled with minimal topstitched plackets, genuine mother-of-pearl buttons, and comfortable tapered shalwar.",
      fabricDetails: "100% Natural Pakistani Handloom Raw Silk (80g)",
      careInstructions: "Gentle dry clean or mild hand wash in cold water with silk detergent. Dry flat in shade.",
      images: [
        { url: "/images/product-kurta.svg", altText: "Pure Raw Silk Kurta Set - Front", displayOrder: 0, isPrimary: true },
      ],
      variants: [
        { sku: "NG-M26-RSK-03-IVR-S", size: "S", colorName: "Ivory", colorHex: "#F4F0E8", stockQuantity: 4, pricePkr: 18500 },
        { sku: "NG-M26-RSK-03-IVR-M", size: "M", colorName: "Ivory", colorHex: "#F4F0E8", stockQuantity: 6, pricePkr: 18500 },
        { sku: "NG-M26-RSK-03-IVR-L", size: "L", colorName: "Ivory", colorHex: "#F4F0E8", stockQuantity: 3, pricePkr: 18500 },
        { sku: "NG-M26-RSK-03-BLK-M", size: "M", colorName: "Obsidian Black", colorHex: "#0B0A0F", stockQuantity: 3, pricePkr: 18500 },
      ],
    },
    {
      id: "prod-004",
      slug: "hand-embroidered-zari-shawl",
      title: "Hand-Embroidered Zari Shawl",
      categorySlug: "festive-shawls-wraps",
      audience: "unisex",
      pricePkr: 14000,
      salePricePkr: null,
      isNew: true,
      isLimited: false,
      isFeatured: true,
      primaryImageUrl: "/images/product-shawl.svg",
      hoverImageUrl: "/images/product-shawl.svg",
      description:
        "An heirloom winter accessory embroidered with authentic Kashmiri tilla and sovereign gold zari motifs across four borders. Backed with pure silk crepe and finished with artisanal hand-knotted fringe tassels.",
      fabricDetails: "High-Density Micro-Velvet Face with Pure Silk Crepe Lining",
      careInstructions: "Dry Clean Only. Store rolled in tissue paper inside signature cedar box.",
      images: [
        { url: "/images/product-shawl.svg", altText: "Hand-Embroidered Zari Shawl", displayOrder: 0, isPrimary: true },
      ],
      variants: [
        { sku: "NG-U26-HZS-04-GLD-STD", size: "Standard", colorName: "Antique Gold", colorHex: "#C5A059", stockQuantity: 5, pricePkr: 14000 },
        { sku: "NG-U26-HZS-04-PLM-STD", size: "Standard", colorName: "Deep Plum", colorHex: "#2E1036", stockQuantity: 3, pricePkr: 14000 },
      ],
    },
    {
      id: "prod-005",
      slug: "silk-peplum-set",
      title: "Silk Peplum Set",
      categorySlug: "womens-luxury-pret",
      audience: "women",
      pricePkr: 21500,
      salePricePkr: null,
      isNew: true,
      isLimited: false,
      isFeatured: false,
      primaryImageUrl: "/images/category-women.svg",
      hoverImageUrl: "/images/category-women.svg",
      description:
        "A modern festive silhouette tailored from lustrous pure silk organza with delicate floral threadwork and mirror accents. Styled with sleek cigarette pants for contemporary formal evenings.",
      fabricDetails: "Pure Silk Organza with Cotton Silk Lining, Raw Silk Trousers",
      careInstructions: "Strictly Dry Clean Only. Steam iron on reverse side.",
      images: [
        { url: "/images/category-women.svg", altText: "Silk Peplum Set - Front Silhouette", displayOrder: 0, isPrimary: true },
      ],
      variants: [
        { sku: "NG-W26-SPS-05-EMR-S", size: "S", colorName: "Emerald Green", colorHex: "#0F3B2C", stockQuantity: 4, pricePkr: 21500 },
        { sku: "NG-W26-SPS-05-EMR-M", size: "M", colorName: "Emerald Green", colorHex: "#0F3B2C", stockQuantity: 3, pricePkr: 21500 },
        { sku: "NG-W26-SPS-05-BLK-M", size: "M", colorName: "Obsidian Black", colorHex: "#0B0A0F", stockQuantity: 4, pricePkr: 21500 },
      ],
    },
    {
      id: "prod-006",
      slug: "zari-velvet-formal-gown",
      title: "Zari Velvet Formal Gown",
      categorySlug: "womens-formal-wear",
      audience: "women",
      pricePkr: 34000,
      salePricePkr: null,
      isNew: false,
      isLimited: true,
      isFeatured: true,
      primaryImageUrl: "/images/product-anarkali.svg",
      hoverImageUrl: "/images/product-anarkali.svg",
      description:
        "A dramatic floor-sweeping gown in deep plum velvet, intricately embellished with antique resham, sequins, and metallic bullion wire. Finished with a dramatic godet skirt train.",
      fabricDetails: "High-Grade Micro-Velvet Body, Silk Satin Lining",
      careInstructions: "Specialist Dry Clean Only.",
      images: [
        { url: "/images/product-anarkali.svg", altText: "Zari Velvet Formal Gown", displayOrder: 0, isPrimary: true },
      ],
      variants: [
        { sku: "NG-W26-ZVG-06-PLM-S", size: "S", colorName: "Deep Plum", colorHex: "#2E1036", stockQuantity: 2, pricePkr: 34000 },
        { sku: "NG-W26-ZVG-06-PLM-M", size: "M", colorName: "Deep Plum", colorHex: "#2E1036", stockQuantity: 3, pricePkr: 34000 },
      ],
    },
    {
      id: "prod-007",
      slug: "bespoke-prince-coat-ensemble",
      title: "Bespoke Prince Coat Ensemble",
      categorySlug: "mens-bespoke-formal",
      audience: "men",
      pricePkr: 28000,
      salePricePkr: null,
      isNew: false,
      isLimited: false,
      isFeatured: false,
      primaryImageUrl: "/images/category-men.svg",
      hoverImageUrl: "/images/category-men.svg",
      description:
        "A sharp, royal prince coat structured from heavyweight tropical wool blend, accentuated with a midnight velvet collar and custom engraved brass buttons.",
      fabricDetails: "High-Twist Tropical Wool Blend, Velvet Collar Accents",
      careInstructions: "Professional Dry Clean Only.",
      images: [
        { url: "/images/category-men.svg", altText: "Bespoke Prince Coat Ensemble", displayOrder: 0, isPrimary: true },
      ],
      variants: [
        { sku: "NG-M26-PCE-07-NVY-38", size: "38", colorName: "Royal Navy", colorHex: "#132238", stockQuantity: 3, pricePkr: 28000 },
        { sku: "NG-M26-PCE-07-NVY-40", size: "40", colorName: "Royal Navy", colorHex: "#132238", stockQuantity: 4, pricePkr: 28000 },
      ],
    },
    {
      id: "prod-008",
      slug: "embroidered-formal-waistcoat-set",
      title: "Embroidered Formal Waistcoat Set",
      categorySlug: "mens-kurta-waistcoat",
      audience: "men",
      pricePkr: 16500,
      salePricePkr: null,
      isNew: false,
      isLimited: false,
      isFeatured: false,
      primaryImageUrl: "/images/product-kurta.svg",
      hoverImageUrl: "/images/product-kurta.svg",
      description:
        "A rich jamawar waistcoat highlighted with subtle golden zari threadwork, paired with a matching pure cotton-silk kurta and churidar.",
      fabricDetails: "Banarsi Jamawar (Waistcoat), Cotton-Silk (Kurta Ensemble)",
      careInstructions: "Dry Clean Recommended.",
      images: [
        { url: "/images/product-kurta.svg", altText: "Embroidered Formal Waistcoat Set", displayOrder: 0, isPrimary: true },
      ],
      variants: [
        { sku: "NG-M26-EFW-08-GLD-S", size: "S", colorName: "Antique Gold", colorHex: "#C5A059", stockQuantity: 3, pricePkr: 16500 },
        { sku: "NG-M26-EFW-08-GLD-M", size: "M", colorName: "Antique Gold", colorHex: "#C5A059", stockQuantity: 5, pricePkr: 16500 },
      ],
    },
  ];

  for (const prodData of products) {
    const category = await prisma.category.findUnique({
      where: { slug: prodData.categorySlug },
    });

    if (!category) continue;

    const { images, variants, categorySlug, ...baseProduct } = prodData;

    const product = await prisma.product.upsert({
      where: { slug: baseProduct.slug },
      update: {
        ...baseProduct,
        categoryId: category.id,
      },
      create: {
        ...baseProduct,
        categoryId: category.id,
      },
    });

    // Seed Images
    for (const img of images) {
      const existingImg = await prisma.productImage.findFirst({
        where: { productId: product.id, url: img.url },
      });
      if (!existingImg) {
        await prisma.productImage.create({
          data: {
            productId: product.id,
            url: img.url,
            altText: img.altText,
            displayOrder: img.displayOrder,
            isPrimary: img.isPrimary,
          },
        });
      }
    }

    // Seed Variants
    for (const v of variants) {
      await prisma.productVariant.upsert({
        where: { sku: v.sku },
        update: {
          stockQuantity: v.stockQuantity,
          pricePkr: v.pricePkr,
        },
        create: {
          productId: product.id,
          sku: v.sku,
          size: v.size,
          colorName: v.colorName,
          colorHex: v.colorHex,
          pricePkr: v.pricePkr,
          stockQuantity: v.stockQuantity,
        },
      });
    }
  }

  console.log("Database seeded successfully with Pakistani luxury apparel catalog!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
