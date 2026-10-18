import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_COOKIE_MAX_AGE_SECONDS,
  createAdminSessionForUser,
  getAdminUserByEmail,
} from "@/lib/admin-service";
import {
  verifyMfaChallengeToken,
  getAdminMfaRecord,
  verifyTotp,
  verifyAndConsumeRecoveryCode,
  setAdminMfaRecord,
} from "@/lib/totp-service";
import {
  extractClientIp,
  checkDualLoginAllowed,
  recordDualLoginFailure,
  clearDualLoginFailures,
} from "@/lib/login-rate-limit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mfaToken, totpCode, recoveryCode } = body;

    if (!mfaToken || typeof mfaToken !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: { code: "MISSING_CHALLENGE", message: "MFA challenge token is required." },
        },
        { status: 400 }
      );
    }

    if (!totpCode && !recoveryCode) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "MISSING_CODE", message: "Please provide a 6-digit TOTP code or emergency recovery code." },
        },
        { status: 400 }
      );
    }

    const clientIp = extractClientIp(request);

    // 1. Verify challenge token signature and expiry
    const challenge = verifyMfaChallengeToken(mfaToken);
    if (!challenge) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CHALLENGE_EXPIRED",
            message: "MFA challenge token has expired or is invalid. Please sign in again.",
          },
        },
        { status: 401 }
      );
    }

    const email = challenge.email.toLowerCase().trim();

    // 2. Rate limit MFA verification attempts to prevent brute-forcing 6-digit codes
    const throttleCheck = checkDualLoginAllowed(email, clientIp);
    if (!throttleCheck.allowed) {
      const response = NextResponse.json(
        {
          success: false,
          error: {
            code: "TOO_MANY_ATTEMPTS",
            message: "Too many failed MFA verification attempts. Please try again later.",
            retryAfter: throttleCheck.retryAfterSeconds,
          },
        },
        { status: 429 }
      );
      response.headers.set("Retry-After", String(throttleCheck.retryAfterSeconds));
      return response;
    }

    // 3. Retrieve user and MFA secret
    const user = getAdminUserByEmail(email);
    const mfaRecord = getAdminMfaRecord(email);

    if (!user || !mfaRecord || !mfaRecord.isEnabled) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "MFA_NOT_CONFIGURED", message: "MFA configuration not found for this account." },
        },
        { status: 400 }
      );
    }

    // 4. Verify code (TOTP or Recovery Code)
    let isCodeValid = false;

    if (totpCode && typeof totpCode === "string") {
      isCodeValid = verifyTotp(mfaRecord.totpSecret, totpCode);
    } else if (recoveryCode && typeof recoveryCode === "string") {
      const recoveryCheck = verifyAndConsumeRecoveryCode(recoveryCode, mfaRecord.recoveryCodesHashed);
      if (recoveryCheck.isValid) {
        isCodeValid = true;
        // Update stored hashed codes with consumed code removed
        setAdminMfaRecord({
          ...mfaRecord,
          recoveryCodesHashed: recoveryCheck.remainingHashedCodes,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    if (!isCodeValid) {
      recordDualLoginFailure(email, clientIp);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_MFA_CODE",
            message: "Invalid multi-factor authentication code. Please check your authenticator app and try again.",
          },
        },
        { status: 401 }
      );
    }

    // Clear failed attempts upon successful verification
    clearDualLoginFailures(email, clientIp);

    // 5. Issue authenticated session
    const sessionToken = createAdminSessionForUser(user);

    const response = NextResponse.json({
      success: true,
      user,
      message: `Multi-factor authentication verified. Welcome back, ${user.name}.`,
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: ADMIN_COOKIE_MAX_AGE_SECONDS,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("MFA verification error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to verify multi-factor authentication." },
      },
      { status: 500 }
    );
  }
}
