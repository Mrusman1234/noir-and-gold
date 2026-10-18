import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Clone headers and forward current pathname to downstream Server Components
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-admin-pathname", pathname);

  // If visiting /admin/login, allow immediately without redirect loop
  if (pathname === "/admin/login") {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Check cookie presence at the edge for fast initial perimeter defense
  const sessionToken = request.cookies.get("noir_admin_session")?.value;
  if (!sessionToken) {
    const loginUrl = new URL("/admin/login", request.url);
    if (pathname !== "/admin" && pathname !== "/admin/") {
      loginUrl.searchParams.set("returnUrl", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Forward to server components for cryptographic / server-side session validation
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/admin/:path*"],
};
