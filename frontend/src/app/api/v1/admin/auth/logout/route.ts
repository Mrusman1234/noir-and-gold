import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  invalidateAdminSession,
} from "@/lib/admin-service";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (token) {
      await invalidateAdminSession(token);
    }

    const response = NextResponse.json({
      success: true,
      message: "Successfully signed out of the administrative portal.",
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Admin logout API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to sign out." },
      },
      { status: 500 }
    );
  }
}
