"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminUser } from "@/types";

interface AdminTopBarProps {
  user: AdminUser | null;
  onOpenMobileSidebar: () => void;
  onLogout: () => void;
}

export function AdminTopBar({
  user,
  onOpenMobileSidebar,
  onLogout,
}: AdminTopBarProps) {
  const pathname = usePathname();

  // Compute breadcrumb path segments
  const segments = pathname
    ?.replace(/^\/admin/, "")
    .split("/")
    .filter(Boolean) || [];

  const getSegmentLabel = (seg: string) => {
    switch (seg) {
      case "orders":
        return "Orders Pipeline";
      case "products":
        return "Garment Catalog";
      case "inventory":
        return "Variant Inventory";
      case "categories":
        return "Categories";
      default:
        return seg;
    }
  };

  return (
    <header className="h-16 lg:h-20 bg-surface-white/95 backdrop-blur-md border-b border-border-subtle sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8">
      {/* Left: Mobile hamburger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 text-text-secondary hover:text-text-primary rounded-lg border border-border-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary cursor-pointer"
          aria-label="Open sidebar"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Breadcrumb Trail */}
        <nav aria-label="Breadcrumbs" className="flex items-center text-xs tracking-wider">
          <Link
            href="/admin"
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            Portal
          </Link>
          {segments.length === 0 ? (
            <>
              <span className="mx-2 text-text-secondary/40">/</span>
              <span className="text-text-primary font-semibold">Dashboard Overview</span>
            </>
          ) : (
            segments.map((seg, idx) => {
              const href = `/admin/${segments.slice(0, idx + 1).join("/")}`;
              const isLast = idx === segments.length - 1;
              return (
                <React.Fragment key={href}>
                  <span className="mx-2 text-text-secondary/40">/</span>
                  {isLast ? (
                    <span className="text-text-primary font-semibold">
                      {getSegmentLabel(seg)}
                    </span>
                  ) : (
                    <Link
                      href={href}
                      className="text-text-secondary hover:text-text-primary transition-colors"
                    >
                      {getSegmentLabel(seg)}
                    </Link>
                  )}
                </React.Fragment>
              );
            })
          )}
        </nav>
      </div>

      {/* Right: Actions and Live Store Link */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Open Live Storefront */}
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open live storefront in a new tab"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-text-secondary hover:text-text-primary border border-border-subtle hover:border-text-primary bg-surface-white transition-colors"
        >
          <span className="hidden sm:inline font-medium">Live Atelier</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </Link>

        {/* Staff Profile Chip */}
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-border-subtle">
          <div className="w-7 h-7 rounded-full bg-surface-subtle border border-border-subtle flex items-center justify-center text-xs font-serif font-bold text-text-primary">
            {user?.name ? user.name.slice(0, 1) : "A"}
          </div>
          <div className="text-xs">
            <span className="text-text-primary font-semibold block leading-none">{user?.name || "Admin"}</span>
            <span className="text-[10px] text-text-secondary font-mono block leading-none mt-0.5">
              {user?.role || "ADMIN"}
            </span>
          </div>
        </div>

        {/* Sign Out Shortcut */}
        <button
          type="button"
          onClick={onLogout}
          aria-label="Sign out"
          className="hidden sm:inline-flex p-2 text-text-secondary hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
          title="Sign Out"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  );
}
