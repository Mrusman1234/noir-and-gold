import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth-guard";
import { getAdminDashboardMetrics } from "@/lib/admin-service";

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request, ["ADMIN"]);
  if ("status" in auth) return auth;

  try {
    const metrics = await getAdminDashboardMetrics();
    return NextResponse.json({
      success: true,
      metrics,
    });
  } catch (error) {
    console.error("Admin metrics API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to calculate dashboard analytics." },
      },
      { status: 500 }
    );
  }
}


