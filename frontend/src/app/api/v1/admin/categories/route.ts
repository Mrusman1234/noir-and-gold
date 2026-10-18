import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth-guard";
import {
  getCategoriesAdmin,
  createCategoryAdmin,
} from "@/lib/admin-service";

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if ("status" in auth) return auth;

  try {
    const categories = await getCategoriesAdmin();
    return NextResponse.json({
      success: true,
      categories,
      total: categories.length,
    });
  } catch (error) {
    console.error("Categories GET error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch categories." } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if ("status" in auth) return auth;

  try {
    const body = await request.json();
    const result = await createCategoryAdmin(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: "CREATION_FAILED", message: result.error || "Failed to create category." } },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      category: result.category,
      message: "Category created successfully.",
    });
  } catch (error) {
    console.error("Categories POST error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to create category." } },
      { status: 500 }
    );
  }
}
