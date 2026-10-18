/**
 * Checkout Rate Limiting and Anti-Abuse Controls for Guest Cash on Delivery (COD).
 *
 * Scopes:
 * 1. Client IP address (bounds rapid automated bot submissions).
 * 2. Normalized customer mobile number (bounds order flooding targeting real or fake phone numbers).
 *
 * Idempotent requests (retries of an existing order key) bypass the decrement throttle
 * so legitimate network retries are never blocked.
 */

export const IP_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const MAX_ORDERS_PER_IP = 10; // Max 10 new orders per IP per 15 minutes

export const PHONE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const MAX_ORDERS_PER_PHONE = 5; // Max 5 new orders per phone number per 15 minutes

interface RateBucket {
  count: number;
  resetAt: number;
}

const ipBuckets = new Map<string, RateBucket>();
const phoneBuckets = new Map<string, RateBucket>();

export function normalizePhoneNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("923") && digits.length === 12) {
    return digits;
  }
  if (digits.startsWith("03") && digits.length === 11) {
    return `92${digits.slice(1)}`;
  }
  if (digits.startsWith("3") && digits.length === 10) {
    return `92${digits}`;
  }
  return digits;
}

function checkBucket(
  buckets: Map<string, RateBucket>,
  key: string,
  maxAttempts: number
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= maxAttempts) {
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return { allowed: false, retryAfterSeconds };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

function recordBucket(
  buckets: Map<string, RateBucket>,
  key: string,
  windowMs: number
): void {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  bucket.count += 1;
}

export interface CheckoutRateLimitResult {
  allowed: boolean;
  code?: "TOO_MANY_ATTEMPTS";
  reason?: "IP_LIMIT_EXCEEDED" | "PHONE_LIMIT_EXCEEDED";
  message?: string;
  retryAfterSeconds?: number;
}

export function checkCheckoutRateLimit(
  arg1: { ip: string; normalizedPhone?: string } | string,
  arg2?: string
): CheckoutRateLimitResult {
  const ip = typeof arg1 === "object" ? arg1.ip : arg1;
  const rawPhone = typeof arg1 === "object" ? arg1.normalizedPhone : arg2;
  const cleanIp = (ip || "").trim().toLowerCase();

  const ipCheck = checkBucket(ipBuckets, cleanIp, MAX_ORDERS_PER_IP);
  if (!ipCheck.allowed) {
    return {
      allowed: false,
      code: "TOO_MANY_ATTEMPTS",
      reason: "IP_LIMIT_EXCEEDED",
      message: "Too many checkout attempts from this connection. Please wait before placing another order.",
      retryAfterSeconds: ipCheck.retryAfterSeconds,
    };
  }

  if (rawPhone) {
    const cleanPhone = normalizePhoneNumber(rawPhone);
    const phoneCheck = checkBucket(phoneBuckets, cleanPhone, MAX_ORDERS_PER_PHONE);
    if (!phoneCheck.allowed) {
      return {
        allowed: false,
        code: "TOO_MANY_ATTEMPTS",
        reason: "PHONE_LIMIT_EXCEEDED",
        message: "Too many orders have been placed with this mobile number recently. Please try again later.",
        retryAfterSeconds: phoneCheck.retryAfterSeconds,
      };
    }
  }

  return { allowed: true };
}

export function recordCheckoutAttempt(
  arg1: { ip: string; normalizedPhone?: string } | string,
  arg2?: string
): void {
  const ip = typeof arg1 === "object" ? arg1.ip : arg1;
  const rawPhone = typeof arg1 === "object" ? arg1.normalizedPhone : arg2;

  const cleanIp = (ip || "").trim().toLowerCase();
  recordBucket(ipBuckets, cleanIp, IP_WINDOW_MS);

  if (rawPhone) {
    const cleanPhone = normalizePhoneNumber(rawPhone);
    recordBucket(phoneBuckets, cleanPhone, PHONE_WINDOW_MS);
  }
}

export const recordCheckoutOrder = recordCheckoutAttempt;

/** Testing helper to clear buckets between test runs. */
export function clearCheckoutRateLimits(): void {
  ipBuckets.clear();
  phoneBuckets.clear();
}
