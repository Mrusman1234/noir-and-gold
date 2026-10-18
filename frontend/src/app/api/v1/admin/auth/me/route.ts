import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth-guard";

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if ("status" in auth) return auth;

  return NextResponse.json({
    success: true,
    user: auth.user,
  });
}
