import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth-guard";
import {
  getInventoryVariants,
  getInventoryAuditLogs,
} from "@/lib/admin-inventory-service";

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if ("status" in auth) return auth;

  try {
    const variants = await getInventoryVariants();
    const auditLogs = await getInventoryAuditLogs();

    return NextResponse.json({
      success: true,
      variants,
      auditLogs,
      totalVariants: variants.length,
    });
  } catch (error) {
    console.error("Admin inventory GET error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch inventory." } },
      { status: 500 }
    );
  }
}
