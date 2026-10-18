import { Request, Response } from "express";
import { prisma } from "../config/db.js";

export async function getCategories(req: Request, res: Response): Promise<void> {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            products: {
              where: { deletedAt: null, status: "PUBLISHED" },
            },
          },
        },
      },
    });

    const formatted = categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      audience: c.audience,
      imageUrl: c.imageUrl,
      productCount: c._count.products,
    }));

    res.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to fetch categories." },
    });
  }
}
