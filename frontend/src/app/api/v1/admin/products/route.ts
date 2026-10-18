import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdminAuth } from "@/lib/admin-auth-guard";
import {
  getAllProductsAdmin,
} from "@/lib/product-service";
import { createProductAdmin } from "@/lib/admin-service";
import { CATALOG_CACHE_TAG } from "@/lib/catalog-read";

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if ("status" in auth) return auth;

  try {
    const products = await getAllProductsAdmin();
    return NextResponse.json({
      success: true,
      products,
      total: products.length,
    });
  } catch (error) {
    console.error("Admin products GET error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch products." } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if ("status" in auth) return auth;

  try {
    const body = await request.json();
    const result = await createProductAdmin(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: "CREATION_FAILED", message: result.error || "Failed to create product." } },
        { status: 400 }
      );
    }

    // The storefront caches catalog reads, so a committed write must invalidate it.
    revalidateTag(CATALOG_CACHE_TAG, "max");

    return NextResponse.json({
      success: true,
      product: result.product,
      message: "Product created successfully in atelier catalog.",
    });
  } catch (error) {
    console.error("Admin product POST error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to create product." } },
      { status: 500 }
    );
  }
}
