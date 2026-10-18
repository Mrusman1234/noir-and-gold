import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminSession } from "./admin-service";
import { AdminUser, UserRole } from "@/types";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Validates whether a mutating request originates from a trusted same-origin caller.
 * Defends against Cross-Site Request Forgery (CSRF) for cookie-authenticated sessions.
 */
function isCsrfValid(request: NextRequest): boolean {
  // 1. Check Sec-Fetch-Site metadata (browser-enforced)
  const secFetchSite = request.headers.get("sec-fetch-site")?.toLowerCase();
  if (secFetchSite === "cross-site") {
    return false;
  }

  // 2. Validate Origin header if present
  const origin = request.headers.get("origin");
  if (!origin) {
    // Non-browser or direct clients without Origin header are allowed if not explicitly cross-site
    return true;
  }

  try {
    const originUrl = new URL(origin);
    const host = request.headers.get("host") || request.nextUrl.host;
    const hostWithoutPort = host.split(":")[0];
    const originHostWithoutPort = originUrl.hostname;

    // Check exact host match (including port)
    if (originUrl.host === host) {
      return true;
    }

    // In local development or testing, allow loopback variations (localhost vs 127.0.0.1)
    if (
      process.env.NODE_ENV !== "production" &&
      (originHostWithoutPort === "localhost" || originHostWithoutPort === "127.0.0.1") &&
      (hostWithoutPort === "localhost" || hostWithoutPort === "127.0.0.1")
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export async function requireAdminAuth(
  request: NextRequest,
  allowedRoles?: UserRole[]
): Promise<{ user: AdminUser } | NextResponse> {
  const token =
    request.cookies.get(ADMIN_COOKIE_NAME)?.value ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required. Please log into the administration portal.",
        },
      },
      { status: 401 }
    );
  }

  const user = await verifyAdminSession(token);
  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SESSION_EXPIRED",
          message: "Your session has expired. Please log in again.",
        },
      },
      { status: 401 }
    );
  }

  // Role-Based Access Control (RBAC) Enforcement
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "FORBIDDEN_INSUFFICIENT_ROLE",
          message: "You do not have permission to perform this action.",
        },
      },
      { status: 403 }
    );
  }

  // CSRF Defense for mutating operations
  if (MUTATING_METHODS.has(request.method.toUpperCase())) {
    if (!isCsrfValid(request)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CSRF_FORBIDDEN",
            message: "Cross-site request validation failed.",
          },
        },
        { status: 403 }
      );
    }
  }

  return { user };
}
