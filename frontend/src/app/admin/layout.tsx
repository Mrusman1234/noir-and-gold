import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminLayoutClient } from "@/components/admin/AdminLayoutClient";
import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/lib/admin-service";
import { BRAND_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Operations Portal | ${BRAND_NAME}`,
  description: "Secure Administrative Operations and Order Management for NOIR & GOLD Atelier.",
  robots: "noindex, nofollow",
};

export const instant = false;

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const pathname = headerList.get("x-admin-pathname") || "";
  const isLoginPage = pathname === "/admin/login" || pathname.startsWith("/admin/login");

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const user = await verifyAdminSession(token);

  if (isLoginPage) {
    if (user) {
      redirect("/admin");
    }
    return <>{children}</>;
  }

  // Enforce server-side authentication: an invalid, absent, or expired token redirects
  if (!user) {
    redirect("/admin/login");
  }

  return <AdminLayoutClient initialUser={user}>{children}</AdminLayoutClient>;
}

