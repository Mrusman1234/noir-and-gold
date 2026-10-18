import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdminAuth } from "@/lib/admin-auth-guard";
import { CATALOG_CACHE_TAG } from "@/lib/catalog-read";
import {
  updateProductAdmin,
  toggleProductArchiveAdmin,
} from "@/lib/admin-service";
import { getProductAdminByIdOrSlug } from "@/lib/product-service";
import { prisma } from "@/lib/prisma";
import { logSecurityEvent } from "@/lib/audit-logger";

function safeRevalidateTag(tag: string) {
  try {
    revalidateTag(tag, "max");
  } catch {
    // In unit / integration test contexts, the static generation store is not initialized
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(request);
  if ("status" in auth) return auth;

  const { id } = await params;
  const product = await getProductAdminByIdOrSlug(id);

  if (!product) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: `Product ${id} not found.` } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, product });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(request, ["ADMIN"]);
  if ("status" in auth) return auth;

  const { id } = await params;

  try {
    const body = await request.json();
    const existingDb = await prisma.product.findUnique({ where: { id } });

    if (!existingDb) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: `Product ${id} not found.` } },
        { status: 404 }
      );
    }

    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip");
    const userAgent = request.headers.get("user-agent");

    // Restore Action: resets deletedAt = null, status = PUBLISHED (ACTIVE)
    if (body.action === "RESTORE" || body.restore === true) {
      await prisma.$transaction(async (tx) => {
        await tx.product.update({
          where: { id: existingDb.id },
          data: {
            status: "PUBLISHED",
            deletedAt: null,
          },
        });
        await tx.productVariant.updateMany({
          where: { productId: existingDb.id },
          data: { isActive: true },
        });
        await logSecurityEvent(tx, {
          action: "PRODUCT_RESTORED",
          entityType: "Product",
          entityId: existingDb.id,
          actorId: auth.user.id,
          actorEmail: auth.user.email,
          ipAddress,
          userAgent,
          previousState: { status: existingDb.status, deletedAt: existingDb.deletedAt },
          newState: { status: "ACTIVE", deletedAt: null },
          reason: "Product restored via admin API",
        });
      });

      safeRevalidateTag(CATALOG_CACHE_TAG);

      return NextResponse.json({
        success: true,
        message: "Product restored successfully.",
      });
    }

    // Explicit Archive Action
    if (body.action === "ARCHIVE") {
      await prisma.$transaction(async (tx) => {
        await tx.product.update({
          where: { id: existingDb.id },
          data: {
            status: "ARCHIVED",
            deletedAt: new Date(),
          },
        });
        await tx.productVariant.updateMany({
          where: { productId: existingDb.id },
          data: { isActive: false },
        });
        await logSecurityEvent(tx, {
          action: "PRODUCT_SOFT_DELETED",
          entityType: "Product",
          entityId: existingDb.id,
          actorId: auth.user.id,
          actorEmail: auth.user.email,
          ipAddress,
          userAgent,
          previousState: { status: existingDb.status, deletedAt: existingDb.deletedAt },
          newState: { status: "ARCHIVED", deletedAt: new Date().toISOString() },
          reason: "Product soft deleted via admin API",
        });
      });

      safeRevalidateTag(CATALOG_CACHE_TAG);

      return NextResponse.json({
        success: true,
        message: "Product archived successfully.",
        archived: true,
      });
    }

    // Toggle sold out / archive helper
    if (body.toggleArchive !== undefined) {
      const toggled = await toggleProductArchiveAdmin(id, Boolean(body.toggleArchive));
      if (!toggled) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Product not found." } },
          { status: 404 }
        );
      }

      await prisma.$transaction(async (tx) => {
        await logSecurityEvent(tx, {
          action: body.toggleArchive ? "PRODUCT_ARCHIVED" : "PRODUCT_RESTORED",
          entityType: "Product",
          entityId: existingDb.id,
          actorId: auth.user.id,
          actorEmail: auth.user.email,
          ipAddress,
          userAgent,
          previousState: { status: existingDb.status },
          newState: { status: body.toggleArchive ? "ARCHIVED" : "PUBLISHED" },
          reason: `Product ${body.toggleArchive ? "archived" : "restored"} via admin API`,
        });
      });

      safeRevalidateTag(CATALOG_CACHE_TAG);

      return NextResponse.json({
        success: true,
        message: `Product ${body.toggleArchive ? "marked as sold out" : "activated"}.`,
      });
    }

    // Detect base price changes
    const newBasePrice =
      body.basePricePkr !== undefined
        ? Number(body.basePricePkr)
        : body.pricePkr !== undefined
          ? Number(body.pricePkr)
          : undefined;

    const priceChanged =
      newBasePrice !== undefined &&
      !isNaN(newBasePrice) &&
      newBasePrice !== existingDb.pricePkr;

    if (priceChanged) {
      await prisma.$transaction(async (tx) => {
        await logSecurityEvent(tx, {
          action: "PRODUCT_PRICE_CHANGED",
          entityType: "Product",
          entityId: existingDb.id,
          actorId: auth.user.id,
          actorEmail: auth.user.email,
          ipAddress,
          userAgent,
          previousState: { basePricePkr: existingDb.pricePkr, pricePkr: existingDb.pricePkr },
          newState: { basePricePkr: newBasePrice, pricePkr: newBasePrice },
          reason: body.priceChangeReason || "Product base price updated via admin API",
        });
        await logSecurityEvent(tx, {
          action: "PRICE_CHANGED",
          entityType: "Product",
          entityId: existingDb.id,
          actorId: auth.user.id,
          actorEmail: auth.user.email,
          ipAddress,
          userAgent,
          previousState: { pricePkr: existingDb.pricePkr },
          newState: { pricePkr: newBasePrice },
          reason: body.priceChangeReason || "Product base price updated via admin API",
        });
      });
    }

    const updateRes = await updateProductAdmin(id, body);
    if (!updateRes.success) {
      return NextResponse.json(
        { success: false, error: { code: "UPDATE_FAILED", message: updateRes.error || "Failed to update product." } },
        { status: 400 }
      );
    }

    safeRevalidateTag(CATALOG_CACHE_TAG);

    return NextResponse.json({
      success: true,
      product: updateRes.product,
      message: "Product updated successfully.",
    });
  } catch (error) {
    console.error("Admin product PATCH error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to update product." } },
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
    const existingDb = await prisma.product.findUnique({ where: { id } });
    if (!existingDb) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: `Product ${id} not found.` } },
        { status: 404 }
      );
    }

    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip");
    const userAgent = request.headers.get("user-agent");

    // Standardized soft delete: set status to ARCHIVED and set deletedAt timestamp
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: existingDb.id },
        data: {
          status: "ARCHIVED",
          deletedAt: new Date(),
        },
      });

      await tx.productVariant.updateMany({
        where: { productId: existingDb.id },
        data: { isActive: false },
      });

      await logSecurityEvent(tx, {
        action: "PRODUCT_SOFT_DELETED",
        entityType: "Product",
        entityId: existingDb.id,
        actorId: auth.user.id,
        actorEmail: auth.user.email,
        ipAddress,
        userAgent,
        previousState: { status: existingDb.status, deletedAt: existingDb.deletedAt },
        newState: { status: "ARCHIVED", deletedAt: new Date().toISOString() },
        reason: "Product soft deleted via admin API",
      });
    });

    safeRevalidateTag(CATALOG_CACHE_TAG);

    return NextResponse.json({
      success: true,
      message: "Product soft deleted successfully.",
      archived: true,
    });
  } catch (error) {
    console.error("Admin product DELETE error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to delete product." } },
      { status: 500 }
    );
  }
}

