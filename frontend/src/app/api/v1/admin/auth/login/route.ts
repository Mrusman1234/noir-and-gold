import { NextRequest, NextResponse } from "next/server";
import {
  authenticateAdmin,
  ADMIN_COOKIE_NAME,
  ADMIN_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/admin-service";
import {
  checkDualLoginAllowed,
  clearDualLoginFailures,
  extractClientIp,
  normalizeEmail,
  recordDualLoginFailure,
} from "@/lib/login-rate-limit";
import {
  createMfaChallengeToken,
  getAdminMfaRecord,
} from "@/lib/totp-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_CREDENTIALS",
            message: "Both email and password are required.",
          },
        },
        { status: 400 }
      );
    }

    const normEmail = normalizeEmail(email);
    const clientIp = extractClientIp(request);

    // Enforce dual-bucket rate limit (per-email and per-IP)
    const throttleCheck = checkDualLoginAllowed(normEmail, clientIp);
    if (!throttleCheck.allowed) {
      const response = NextResponse.json(
        {
          success: false,
          error: {
            code: "TOO_MANY_ATTEMPTS",
            message: "Too many failed sign-in attempts. Please try again later.",
            retryAfter: throttleCheck.retryAfterSeconds,
          },
        },
        { status: 429 }
      );
      response.headers.set("Retry-After", String(throttleCheck.retryAfterSeconds));
      return response;
    }

    const authResult = await authenticateAdmin(normEmail, password);
    if (!authResult) {
      recordDualLoginFailure(normEmail, clientIp);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password.",
          },
        },
        { status: 401 }
      );
    }

    // Clear failed attempts upon successful password verification
    clearDualLoginFailures(normEmail, clientIp);

    // Check if Multi-Factor Authentication (MFA) is enabled for this admin account
    const mfaRecord = getAdminMfaRecord(normEmail);
    if (mfaRecord && mfaRecord.isEnabled) {
      const mfaChallengeToken = createMfaChallengeToken(authResult.user);
      return NextResponse.json({
        success: true,
        mfaRequired: true,
        mfaToken: mfaChallengeToken,
        message: "Multi-factor authentication code required to complete login.",
      });
    }

    const response = NextResponse.json({
      success: true,
      user: authResult.user,
      message: `Welcome back, ${authResult.user.name}.`,
    });

    // Set secure HTTP-only session cookie
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: authResult.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: ADMIN_COOKIE_MAX_AGE_SECONDS,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Admin login API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to authenticate administrator." },
      },
      { status: 500 }
    );
  }
}
