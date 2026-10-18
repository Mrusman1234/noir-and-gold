"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminUser } from "@/types";
import { BRAND_NAME } from "@/lib/constants";

interface AdminSidebarProps {
  user: AdminUser | null;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onLogout: () => void;
}

export function AdminSidebar({
  user,
  isOpenMobile,
  onCloseMobile,
  onLogout,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Dashboard",
      href: "/admin",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      exact: true,
    },
    {
      label: "Orders Pipeline",
      href: "/admin/orders",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      label: "Garment Catalog",
      href: "/admin/products",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    },
    {
      label: "Variant Inventory",
      href: "/admin/inventory",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      label: "Categories",
      href: "/admin/categories",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-surface-white border-r border-border-subtle flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-xs ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 px-6 border-b border-border-subtle flex items-center justify-between">
          <Link href="/admin" onClick={onCloseMobile} className="group">
            <span className="font-serif text-lg tracking-[0.2em] font-bold text-text-primary uppercase block">
              {BRAND_NAME}
            </span>
            <span className="text-[10px] tracking-[0.25em] text-accent-gold font-sans font-semibold uppercase block -mt-0.5">
              Portal • Atelier Ops
            </span>
          </Link>
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden text-text-secondary hover:text-text-primary p-1 cursor-pointer"
            aria-label="Close sidebar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-text-secondary">
            Operations &amp; Catalog
          </div>
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname?.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex min-h-11 items-center gap-3.5 px-3.5 py-2.5 text-xs font-medium rounded-lg transition-all ${
                  isActive
                    ? "bg-surface-subtle text-text-primary border-l-2 border-text-primary font-semibold"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-subtle/50"
                }`}
              >
                <span className={isActive ? "text-text-primary" : "text-text-secondary"}>
                  {item.icon}
                </span>
                <span className="tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom User Profile Chip & Logout */}
        <div className="border-t border-border-subtle bg-surface-white p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-surface-subtle border border-border-subtle flex items-center justify-center text-xs font-serif font-bold text-text-primary shrink-0">
                {user?.name ? user.name.slice(0, 1) : "A"}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-text-primary truncate">
                  {user?.name || "Admin"}
                </div>
                <div className="text-[10px] text-text-secondary truncate font-mono">
                  {user?.email || "Administrator"}
                </div>
              </div>
            </div>
            <span
              className={`text-[9px] px-2 py-0.5 rounded font-mono uppercase tracking-wider shrink-0 ${
                user?.role === "ADMIN"
                  ? "bg-surface-subtle text-text-primary border border-border-subtle font-semibold"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}
            >
              {user?.role || "ADMIN"}
            </span>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs text-text-secondary hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-border-subtle hover:border-rose-200 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
