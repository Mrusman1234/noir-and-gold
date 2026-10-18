import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth-guard";
import { toggleCategoryStatusAdmin } from "@/lib/admin-service";
import { prisma } from "@/lib/prisma";
import { logSecurityEvent } from "@/lib/audit-logger";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(request);
  if ("status" in auth) return auth;

  const { id } = await params;

  try {
    const body = await request.json();
    const { isActive } = body;

    const toggled = await toggleCategoryStatusAdmin(id, Boolean(isActive));
    if (!toggled) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Category not found." } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Category status updated to ${isActive ? "active" : "inactive"}.`,
    });
  } catch (error) {
    console.error("Category PATCH error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to update category status." } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(request, ["ADMIN"]);
  if ("status" in auth) return auth;

  const { id } = await params;

  try {
    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Category not found." } },
        { status: 404 }
      );
    }

    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip");
    const userAgent = request.headers.get("user-agent");

    await prisma.$transaction(async (tx) => {
      await tx.category.update({
        where: { id },
        data: {
          isActive: false,
          deletedAt: new Date(),
        },
      });

      await logSecurityEvent(tx, {
        action: "CATEGORY_ARCHIVED",
        entityType: "Category",
        entityId: existing.id,
        actorId: auth.user.id,
        actorEmail: auth.user.email,
        ipAddress,
        userAgent,
        previousState: { isActive: existing.isActive, deletedAt: existing.deletedAt },
        newState: { isActive: false, deletedAt: new Date().toISOString() },
        reason: "Category soft deleted / archived via admin API",
      });
    });

    return NextResponse.json({
      success: true,
      message: `Category "${existing.name}" archived successfully.`,
    });
  } catch (error) {
    console.error("Category DELETE error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to delete category." } },
      { status: 500 }
    );
  }
}

