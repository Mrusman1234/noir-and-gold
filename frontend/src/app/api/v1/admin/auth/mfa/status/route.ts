import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth-guard";
import {
  getAdminMfaRecord,
  generateTotpSecret,
  generateOtpAuthUri,
  generateRecoveryCodes,
  setAdminMfaRecord,
} from "@/lib/totp-service";
import { BRAND_NAME } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const authResult = await requireAdminAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;
  const mfaRecord = getAdminMfaRecord(user.email);

  return NextResponse.json({
    success: true,
    mfaEnabled: Boolean(mfaRecord?.isEnabled),
    hasRecoveryCodes: Boolean(mfaRecord && mfaRecord.recoveryCodesHashed.length > 0),
    recoveryCodesCount: mfaRecord ? mfaRecord.recoveryCodesHashed.length : 0,
  });
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdminAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;
  const newSecret = generateTotpSecret();
  const otpAuthUri = generateOtpAuthUri(user.email, BRAND_NAME, newSecret);
  const { plainCodes, hashedCodes } = generateRecoveryCodes(8);

  setAdminMfaRecord({
    userId: user.id,
    email: user.email,
    isEnabled: true,
    totpSecret: newSecret,
    recoveryCodesHashed: hashedCodes,
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({
    success: true,
    message: "Multi-factor authentication configured.",
    secret: newSecret,
    otpAuthUri,
    recoveryCodes: plainCodes,
  });
}
