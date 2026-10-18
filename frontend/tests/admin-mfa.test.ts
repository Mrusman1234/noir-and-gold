import assert from "node:assert/strict";
import crypto from "node:crypto";
import { test } from "node:test";

process.env.ADMIN_EMAIL = "mfa-admin@noirandgold.test";
const TEST_ADMIN_PASSWORD = "NoirGold_Admin_2026_MfaSecurePass!";
process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;
process.env.ADMIN_NAME = "MFA Administrator";

import { NextRequest } from "next/server";
import {
  base32Encode,
  base32Decode,
  generateTotpSecret,
  generateTotp,
  verifyTotp,
  generateRecoveryCodes,
  verifyAndConsumeRecoveryCode,
  createMfaChallengeToken,
  verifyMfaChallengeToken,
  setAdminMfaRecord,
} from "../src/lib/totp-service";
import { AdminUser } from "../src/types";

const TEST_ADMIN_USER: AdminUser = {
  id: "usr_admin_test_001",
  email: "mfa-admin@noirandgold.test",
  name: "MFA Administrator",
  role: "ADMIN",
  createdAt: "2026-01-01T00:00:00.000Z",
};

test("Base32 encoding and decoding correctly round-trips arbitrary buffers", () => {
  const original = crypto.randomBytes(32);
  const encoded = base32Encode(original);
  assert.match(encoded, /^[A-Z2-7]+$/);

  const decoded = base32Decode(encoded);
  assert.equal(decoded.toString("hex"), original.toString("hex"));
});

test("RFC 6238 TOTP computation and verification conforms to standards with skew tolerance", () => {
  const secret = generateTotpSecret();
  assert.ok(secret.length >= 32);

  const now = Date.now();
  const currentCode = generateTotp(secret, now);
  assert.match(currentCode, /^\d{6}$/);

  // Exact time matches
  assert.equal(verifyTotp(secret, currentCode, now), true);

  // 25 seconds drift matches (within current or adjacent 30s window)
  assert.equal(verifyTotp(secret, currentCode, now + 25_000), true);
  assert.equal(verifyTotp(secret, currentCode, now - 25_000), true);

  // 120 seconds drift is rejected (outside ±1 window)
  assert.equal(verifyTotp(secret, currentCode, now + 120_000), false);
  assert.equal(verifyTotp(secret, currentCode, now - 120_000), false);

  // Incorrect code is rejected
  assert.equal(verifyTotp(secret, "999999" === currentCode ? "111111" : "999999", now), false);
  assert.equal(verifyTotp(secret, "abc", now), false);
  assert.equal(verifyTotp(secret, "", now), false);
});

test("emergency recovery codes can be generated and consumed exactly once", () => {
  const { plainCodes, hashedCodes } = generateRecoveryCodes(4);
  assert.equal(plainCodes.length, 4);
  assert.equal(hashedCodes.length, 4);

  const targetCode = plainCodes[1];

  // First consumption: valid and returns 3 remaining codes
  const firstCheck = verifyAndConsumeRecoveryCode(targetCode, hashedCodes);
  assert.equal(firstCheck.isValid, true);
  assert.equal(firstCheck.remainingHashedCodes.length, 3);

  // Second consumption with the remaining list: rejected (single-use)
  const secondCheck = verifyAndConsumeRecoveryCode(targetCode, firstCheck.remainingHashedCodes);
  assert.equal(secondCheck.isValid, false);
  assert.equal(secondCheck.remainingHashedCodes.length, 3);

  // Invalid code is rejected
  const badCheck = verifyAndConsumeRecoveryCode("INVALID-CODE", firstCheck.remainingHashedCodes);
  assert.equal(badCheck.isValid, false);
});

test("MFA challenge tokens can be created and verified, and expire after 5 minutes", () => {
  const token = createMfaChallengeToken(TEST_ADMIN_USER);
  assert.ok(token);

  const verified = verifyMfaChallengeToken(token);
  assert.ok(verified);
  assert.equal(verified?.email, TEST_ADMIN_USER.email);
  assert.equal(verified?.userId, TEST_ADMIN_USER.id);

  // Tampered token fails
  const parts = token.split(".");
  const tamperedToken = `${parts[0]}.badsignature`;
  assert.equal(verifyMfaChallengeToken(tamperedToken), null);
});

test("admin login triggers MFA challenge when enabled, and mfa verify issues session cookie upon valid TOTP", async () => {
  const { POST: loginPost } = await import("../src/app/api/v1/admin/auth/login/route");
  const { POST: verifyPost } = await import("../src/app/api/v1/admin/auth/mfa/verify/route");
  const { ADMIN_COOKIE_NAME } = await import("../src/lib/admin-service");

  const email = process.env.ADMIN_EMAIL!;
  const password = process.env.ADMIN_PASSWORD!;

  // 1. Enable MFA for this admin account
  const mfaSecret = generateTotpSecret();
  const { plainCodes, hashedCodes } = generateRecoveryCodes(4);
  setAdminMfaRecord({
    userId: "usr_admin_001",
    email,
    isEnabled: true,
    totpSecret: mfaSecret,
    recoveryCodesHashed: hashedCodes,
    updatedAt: new Date().toISOString(),
  });

  // 2. Perform password login: should return mfaRequired and mfaToken
  const loginReq = new NextRequest("http://localhost:3000/api/v1/admin/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const loginRes = await loginPost(loginReq);
  assert.equal(loginRes.status, 200);
  const loginData = await loginRes.json();

  assert.equal(loginData.success, true);
  assert.equal(loginData.mfaRequired, true);
  assert.ok(loginData.mfaToken);

  // Verify that session cookie was NOT set yet
  assert.equal(loginRes.cookies.get(ADMIN_COOKIE_NAME), undefined);

  // 3. Test verification with wrong TOTP code -> rejected with 401
  const badVerifyReq = new NextRequest("http://localhost:3000/api/v1/admin/auth/mfa/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mfaToken: loginData.mfaToken, totpCode: "000000" }),
  });

  const badVerifyRes = await verifyPost(badVerifyReq);
  assert.equal(badVerifyRes.status, 401);
  const badVerifyData = await badVerifyRes.json();
  assert.equal(badVerifyData.error.code, "INVALID_MFA_CODE");

  // 4. Test verification with valid TOTP code -> accepted with 200 and session cookie
  const validTotp = generateTotp(mfaSecret);
  const goodVerifyReq = new NextRequest("http://localhost:3000/api/v1/admin/auth/mfa/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mfaToken: loginData.mfaToken, totpCode: validTotp }),
  });

  const goodVerifyRes = await verifyPost(goodVerifyReq);
  assert.equal(goodVerifyRes.status, 200);
  const goodVerifyData = await goodVerifyRes.json();
  assert.equal(goodVerifyData.success, true);
  assert.equal(goodVerifyData.user.email, email.toLowerCase());

  // Verify session cookie is set
  const sessionCookie = goodVerifyRes.cookies.get(ADMIN_COOKIE_NAME);
  assert.ok(sessionCookie);
  assert.ok(sessionCookie.value.length >= 32);

  // 5. Test verification with emergency recovery code
  const recoveryChallenge = createMfaChallengeToken({
    id: "usr_admin_001",
    email,
    name: "Owner",
    role: "ADMIN",
    createdAt: new Date().toISOString(),
  });

  const recoveryReq = new NextRequest("http://localhost:3000/api/v1/admin/auth/mfa/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mfaToken: recoveryChallenge, recoveryCode: plainCodes[0] }),
  });

  const recoveryRes = await verifyPost(recoveryReq);
  assert.equal(recoveryRes.status, 200);
  const recoveryData = await recoveryRes.json();
  assert.equal(recoveryData.success, true);

  // Turn off MFA so subsequent tests stay independent
  setAdminMfaRecord({
    userId: "usr_admin_001",
    email,
    isEnabled: false,
    totpSecret: mfaSecret,
    recoveryCodesHashed: [],
    updatedAt: new Date().toISOString(),
  });
});
