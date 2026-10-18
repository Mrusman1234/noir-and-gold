import { Request, Response } from "express";
import { prisma } from "../config/db.js";

/**
 * List products with pagination, category filter, audience filter, search, and sorting.
 */
export async function getProducts(req: Request, res: Response): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 12));
    const skip = (page - 1) * limit;

    const categoryParam = (req.query.category as string || "").trim().toLowerCase();
    const audienceParam = (req.query.audience as string || "").trim().toLowerCase();
    const searchParam = (req.query.search as string || "").trim();
    const sortParam = (req.query.sort as string || "featured").trim().toLowerCase();

    // Build Prisma where clause
    const whereClause: any = {
      status: "PUBLISHED",
      deletedAt: null,
    };

    // Category / Audience filtering
    if (categoryParam) {
      if (categoryParam === "men" || categoryParam === "women" || categoryParam === "unisex") {
        whereClause.OR = [
          { audience: categoryParam },
          { audience: "unisex" },
          { category: { audience: categoryParam } },
        ];
      } else {
        whereClause.category = {
          slug: categoryParam,
        };
      }
    } else if (audienceParam) {
      whereClause.OR = [
        { audience: audienceParam },
        { audience: "unisex" },
      ];
    }

    // Search query
    if (searchParam) {
      whereClause.AND = [
        {
          OR: [
            { title: { contains: searchParam } },
            { description: { contains: searchParam } },
            { fabricDetails: { contains: searchParam } },
          ],
        },
      ];
    }

    // Sorting order
    let orderBy: any = { isFeatured: "desc" };
    switch (sortParam) {
      case "price-asc":
        orderBy = { pricePkr: "asc" };
        break;
      case "price-desc":
        orderBy = { pricePkr: "desc" };
        break;
      case "newest":
        orderBy = { createdAt: "desc" };
        break;
      case "name-asc":
        orderBy = { title: "asc" };
        break;
      default:
        orderBy = [{ isFeatured: "desc" }, { createdAt: "desc" }];
    }

    const [total, rawProducts] = await Promise.all([
      prisma.product.count({ where: whereClause }),
      prisma.product.findMany({
        where: whereClause,
        orderBy,
        skip,
        take: limit,
        include: {
          category: { select: { name: true, slug: true } },
          images: { orderBy: { displayOrder: "asc" } },
          variants: { where: { isActive: true } },
        },
      }),
    ]);

    // Format products consistent with frontend contracts
    const formatted = rawProducts.map((p) => {
      const availableSizes = Array.from(new Set(p.variants.map((v) => v.size)));
      const availableColors = Array.from(new Set(p.variants.map((v) => v.colorName)));
      const totalStock = p.variants.reduce((acc, v) => acc + v.stockQuantity, 0);

      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        categoryName: p.category.name,
        categorySlug: p.category.slug,
        pricePkr: p.pricePkr,
        salePricePkr: p.salePricePkr,
        primaryImageUrl: p.primaryImageUrl,
        hoverImageUrl: p.hoverImageUrl,
        isNew: p.isNew,
        isLimited: p.isLimited,
        isSoldOut: totalStock === 0,
        availableSizes,
        availableColors,
        audience: p.audience,
        createdAt: p.createdAt.toISOString(),
      };
    });

    res.json({
      success: true,
      data: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Get products error:", error);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to fetch products from database." },
    });
  }
}

/**
 * Retrieve single product by id or slug with complete image gallery and variant matrix.
 */
export async function getProductByIdOrSlug(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        status: "PUBLISHED",
        deletedAt: null,
      },
      include: {
        category: true,
        images: { orderBy: { displayOrder: "asc" } },
        variants: { where: { isActive: true } },
      },
    });

    if (!product) {
      res.status(404).json({
        success: false,
        error: { code: "PRODUCT_NOT_FOUND", message: `Product '${id}' not found.` },
      });
      return;
    }

    const availableSizes = Array.from(new Set(product.variants.map((v) => v.size)));
    const availableColors = Array.from(new Set(product.variants.map((v) => v.colorName)));
    const totalStock = product.variants.reduce((acc, v) => acc + v.stockQuantity, 0);

    const detailed = {
      id: product.id,
      title: product.title,
      slug: product.slug,
      sku: product.variants[0]?.sku || `NG-26-${product.slug.slice(0, 4).toUpperCase()}`,
      categoryName: product.category.name,
      categorySlug: product.category.slug,
      audience: product.audience,
      pricePkr: product.pricePkr,
      salePricePkr: product.salePricePkr,
      primaryImageUrl: product.primaryImageUrl,
      hoverImageUrl: product.hoverImageUrl,
      isNew: product.isNew,
      isLimited: product.isLimited,
      isSoldOut: totalStock === 0,
      availableSizes,
      availableColors,
      rating: product.rating,
      reviewCount: product.reviewCount,
      description: product.description,
      fabric: product.fabricDetails || "Pure Pakistani Luxury Fabric",
      careInstructions: product.careInstructions ? [product.careInstructions] : ["Specialist Dry Clean Only"],
      details: ["Handcrafted by master atelier artisans in Pakistan", "Signature monogram finish"],
      images: product.images.map((img) => ({
        id: img.id,
        url: img.url,
        alt: img.altText,
        isPrimary: img.isPrimary,
      })),
      variants: product.variants.map((v) => ({
        id: v.id,
        size: v.size,
        colorName: v.colorName,
        colorHex: v.colorHex,
        sku: v.sku,
        stock: v.stockQuantity,
      })),
      createdAt: product.createdAt.toISOString(),
    };

    res.json({
      success: true,
      data: detailed,
    });
  } catch (error: any) {
    console.error("Get product by ID error:", error);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to fetch product details." },
    });
  }
}
