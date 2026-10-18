import crypto from "crypto";
import { AdminUser } from "@/types";

/**
 * Base32 Alphabet (RFC 4648 standard)
 */
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Encodes a buffer into RFC 4648 Base32 text
 */
export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decodes an RFC 4648 Base32 string into a buffer
 */
export function base32Decode(input: string): Buffer {
  const cleanInput = input.toUpperCase().replace(/[\s=-]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleanInput.length; i++) {
    const char = cleanInput[i];
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid Base32 character: ${char}`);
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generates a standard 20-byte (160-bit) Base32 secret for TOTP (compatible with Google Authenticator).
 */
export function generateTotpSecret(): string {
  const randomBytes = crypto.randomBytes(20);
  return base32Encode(randomBytes);
}

/**
 * Computes the 6-digit TOTP code for a secret at a specific counter step (RFC 6238 / RFC 4226).
 */
export function computeHotp(secretBase32: string, counter: number): string {
  const key = base32Decode(secretBase32);

  // Counter as 8-byte big-endian buffer
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigInt64BE(BigInt(counter), 0);

  // HMAC-SHA1
  const hmac = crypto.createHmac("sha1", key).update(counterBuffer).digest();

  // Dynamic truncation
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % 1_000_000;
  return otp.toString().padStart(6, "0");
}

/**
 * Generates the current 6-digit TOTP code for a given timestamp.
 */
export function generateTotp(secretBase32: string, timestampMs = Date.now(), timeStepSeconds = 30): string {
  const counter = Math.floor(timestampMs / 1000 / timeStepSeconds);
  return computeHotp(secretBase32, counter);
}

/**
 * Verifies a 6-digit TOTP code with time-step window skew tolerance (±1 window).
 * Constant-time comparison defends against timing attacks.
 */
export function verifyTotp(
  secretBase32: string,
  providedCode: string,
  timestampMs = Date.now(),
  windowTolerance = 1,
  timeStepSeconds = 30
): boolean {
  if (!providedCode || typeof providedCode !== "string") return false;
  const cleanCode = providedCode.trim();
  if (!/^\d{6}$/.test(cleanCode)) return false;

  const currentCounter = Math.floor(timestampMs / 1000 / timeStepSeconds);
  const candidateBuf = Buffer.from(cleanCode, "utf-8");

  for (let error = -windowTolerance; error <= windowTolerance; error++) {
    const candidateCounter = currentCounter + error;
    const expected = computeHotp(secretBase32, candidateCounter);
    const expectedBuf = Buffer.from(expected, "utf-8");

    if (candidateBuf.length === expectedBuf.length && crypto.timingSafeEqual(candidateBuf, expectedBuf)) {
      return true;
    }
  }

  return false;
}

/**
 * Generates an otpauth:// URI for QR code generators and authenticator apps.
 */
export function generateOtpAuthUri(
  accountName: string,
  issuer: string,
  secretBase32: string
): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(accountName);
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secretBase32}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Generates single-use emergency recovery codes.
 */
export function generateRecoveryCodes(count = 8): { plainCodes: string[]; hashedCodes: string[] } {
  const plainCodes: string[] = [];
  const hashedCodes: string[] = [];

  for (let i = 0; i < count; i++) {
    const part1 = crypto.randomBytes(2).toString("hex").toUpperCase();
    const part2 = crypto.randomBytes(2).toString("hex").toUpperCase();
    const code = `${part1}-${part2}`;
    plainCodes.push(code);

    const hash = crypto.createHash("sha256").update(code).digest("hex");
    hashedCodes.push(`v1:${hash}`);
  }

  return { plainCodes, hashedCodes };
}

/**
 * Verifies an emergency recovery code against stored hashes.
 */
export function verifyAndConsumeRecoveryCode(
  providedCode: string,
  hashedCodes: string[]
): { isValid: boolean; remainingHashedCodes: string[] } {
  const cleanCode = providedCode.trim().toUpperCase();
  const testHash = `v1:${crypto.createHash("sha256").update(cleanCode).digest("hex")}`;
  const testBuf = Buffer.from(testHash, "utf-8");

  for (let i = 0; i < hashedCodes.length; i++) {
    const stored = hashedCodes[i];
    const storedBuf = Buffer.from(stored, "utf-8");
    if (storedBuf.length === testBuf.length && crypto.timingSafeEqual(storedBuf, testBuf)) {
      const remaining = [...hashedCodes.slice(0, i), ...hashedCodes.slice(i + 1)];
      return { isValid: true, remainingHashedCodes: remaining };
    }
  }

  return { isValid: false, remainingHashedCodes: hashedCodes };
}

/**
 * In-memory / environment MFA state store for Admin accounts
 */
interface AdminMfaRecord {
  userId: string;
  email: string;
  isEnabled: boolean;
  totpSecret: string;
  recoveryCodesHashed: string[];
  updatedAt: string;
}

const ADMIN_MFA_STORE = new Map<string, AdminMfaRecord>();

/**
 * Gets or initializes MFA record for admin email.
 * If ADMIN_MFA_SECRET environment variable is set, it enables MFA by default.
 */
export function getAdminMfaRecord(email: string): AdminMfaRecord | null {
  const normEmail = email.toLowerCase().trim();
  const existing = ADMIN_MFA_STORE.get(normEmail);
  if (existing) return existing;

  const envMfaSecret = process.env.ADMIN_MFA_SECRET?.trim();
  if (envMfaSecret) {
    const record: AdminMfaRecord = {
      userId: "usr_admin_001",
      email: normEmail,
      isEnabled: true,
      totpSecret: envMfaSecret,
      recoveryCodesHashed: [],
      updatedAt: new Date().toISOString(),
    };
    ADMIN_MFA_STORE.set(normEmail, record);
    return record;
  }

  return null;
}

export function setAdminMfaRecord(record: AdminMfaRecord): void {
  ADMIN_MFA_STORE.set(record.email.toLowerCase().trim(), record);
}

/**
 * MFA Challenge token generator and verifier (5-minute expiration)
 */
function getChallengeSecret(): Buffer {
  const secret = process.env.ORDER_VERIFICATION_SECRET || "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  return Buffer.from(secret.slice(0, 64), "hex");
}

export function createMfaChallengeToken(user: AdminUser): string {
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  const payload = `${user.id}:${user.email}:${expiresAt}`;
  const signature = crypto
    .createHmac("sha256", getChallengeSecret())
    .update(`noir-admin-mfa-challenge:${payload}`)
    .digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${signature}`;
}

export function verifyMfaChallengeToken(challengeToken: string): { userId: string; email: string } | null {
  try {
    const parts = challengeToken.split(".");
    if (parts.length !== 2) return null;

    const [payloadB64, signature] = parts;
    const payload = Buffer.from(payloadB64, "base64url").toString("utf-8");
    const [userId, email, expiresAtStr] = payload.split(":");
    const expiresAt = Number(expiresAtStr);

    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return null;
    }

    const expectedSignature = crypto
      .createHmac("sha256", getChallengeSecret())
      .update(`noir-admin-mfa-challenge:${payload}`)
      .digest("base64url");

    const actualSigBuf = Buffer.from(signature, "utf-8");
    const expectedSigBuf = Buffer.from(expectedSignature, "utf-8");

    if (actualSigBuf.length !== expectedSigBuf.length || !crypto.timingSafeEqual(actualSigBuf, expectedSigBuf)) {
      return null;
    }

    return { userId, email };
  } catch {
    return null;
  }
}
