/**
 * Multi-tier login throttle for the admin authentication portal.
 *
 * Enforces three complementary rate-limiting buckets:
 * 1. Per client-account bucket (`${ip}:${email}`, max 10 failed attempts / 15 min):
 *    Direct client throttle isolating individual client connections.
 * 2. Global per-email bucket (`email:${email}`, max 25 failed attempts / 15 min):
 *    Prevents distributed brute-force attacks rotating source IPs (or spoofing headers).
 * 3. Global per-IP bucket (`ip:${ip}`, max 30 failed attempts / 15 min):
 *    Prevents credential stuffing and password spraying attacks across multiple accounts.
 *
 * Backwards-compatible legacy single-key API is retained for test compatibility.
 */

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const MAX_FAILURES_PER_CLIENT = 10;
export const MAX_FAILURES_PER_EMAIL = 25;
export const MAX_FAILURES_PER_IP = 30;
export const MAX_FAILURES_LEGACY = 10;

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function normalizeEmail(email: unknown): string {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase();
}

export function extractClientIp(request: Request): string {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return "127.0.0.1";
}

function checkBucket(key: string, limit: number): { allowed: boolean; retryAfterSeconds: number } {
  const bucket = buckets.get(key);
  if (!bucket) return { allowed: true, retryAfterSeconds: 0 };

  const now = Date.now();
  if (now > bucket.resetAt) {
    buckets.delete(key);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return { allowed: false, retryAfterSeconds: retryAfter };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

function recordBucketFailure(key: string): void {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  bucket.count += 1;
}

export function checkDualLoginAllowed(
  email: string,
  clientIp: string
): { allowed: boolean; retryAfterSeconds: number; reason?: "CLIENT_LOCKED" | "EMAIL_LOCKED" | "IP_LOCKED" } {
  const normEmail = normalizeEmail(email);
  const cleanIp = clientIp.trim() || "127.0.0.1";

  // Tier 1: Client-account connection throttle (10 attempts)
  if (normEmail) {
    const clientCheck = checkBucket(`${cleanIp}:${normEmail}`, MAX_FAILURES_PER_CLIENT);
    if (!clientCheck.allowed) {
      return { allowed: false, retryAfterSeconds: clientCheck.retryAfterSeconds, reason: "CLIENT_LOCKED" };
    }
  }

  // Tier 2: Account-wide distributed throttle across all IPs (25 attempts)
  if (normEmail) {
    const emailCheck = checkBucket(`email:${normEmail}`, MAX_FAILURES_PER_EMAIL);
    if (!emailCheck.allowed) {
      return { allowed: false, retryAfterSeconds: emailCheck.retryAfterSeconds, reason: "EMAIL_LOCKED" };
    }
  }

  // Tier 3: IP-wide credential stuffing throttle (30 attempts)
  const ipCheck = checkBucket(`ip:${cleanIp}`, MAX_FAILURES_PER_IP);
  if (!ipCheck.allowed) {
    return { allowed: false, retryAfterSeconds: ipCheck.retryAfterSeconds, reason: "IP_LOCKED" };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export function recordDualLoginFailure(email: string, clientIp: string): void {
  const normEmail = normalizeEmail(email);
  const cleanIp = clientIp.trim() || "127.0.0.1";

  if (normEmail) {
    recordBucketFailure(`${cleanIp}:${normEmail}`);
    recordBucketFailure(`email:${normEmail}`);
  }
  recordBucketFailure(`ip:${cleanIp}`);
}

export function clearDualLoginFailures(email: string, clientIp: string): void {
  const normEmail = normalizeEmail(email);
  const cleanIp = clientIp.trim() || "127.0.0.1";

  if (normEmail) {
    buckets.delete(`${cleanIp}:${normEmail}`);
    buckets.delete(`email:${normEmail}`);
  }
  buckets.delete(`ip:${cleanIp}`);
}

// Backwards-compatible single-key API
export function loginAllowed(key: string, limit: number = MAX_FAILURES_LEGACY): boolean {
  return checkBucket(key, limit).allowed;
}

export function recordLoginFailure(key: string): void {
  recordBucketFailure(key);
}

export function clearLoginFailures(key: string): void {
  buckets.delete(key);
}

export function resetAllLoginRateLimits(): void {
  buckets.clear();
}
