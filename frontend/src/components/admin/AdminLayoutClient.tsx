"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopBar } from "./AdminTopBar";
import { AdminUser } from "@/types";

interface AdminLayoutClientProps {
  children: React.ReactNode;
  initialUser?: AdminUser | null;
}

export function AdminLayoutClient({ children, initialUser }: AdminLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === "/admin/login";

  const [user, setUser] = useState<AdminUser | null>(initialUser ?? null);
  const [loading, setLoading] = useState(!isLoginPage && !initialUser);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/admin/auth/me");
      if (!res.ok) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        router.push("/admin/login");
      }
    } catch {
      router.push("/admin/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  // The login route returns its children before any loading gate is rendered, so
  // verification is skipped there instead of writing state synchronously.
  useEffect(() => {
    if (isLoginPage) return;
    const verify = async () => {
      await checkAuth();
    };
    void verify();
  }, [checkAuth, isLoginPage]);

  const handleLogout = async () => {
    try {
      await fetch("/api/v1/admin/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      router.push("/admin/login");
    }
  };

  // If on login page, render child directly
  if (isLoginPage) {
    return <>{children}</>;
  }

  // If not authenticated and still verifying on client, show loading gate without exposing children
  if (loading && !user) {
    return (
      <div className="fixed inset-0 z-50 bg-surface-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-2 border-border-subtle border-t-text-primary rounded-full animate-spin mb-4" />
        <span className="font-serif text-lg tracking-[0.2em] text-text-primary uppercase">
          NOIR &amp; GOLD
        </span>
        <span className="text-xs uppercase tracking-widest text-text-secondary font-sans mt-1">
          Verifying Atelier Credentials...
        </span>
      </div>
    );
  }

  // If verification completed and no user, do not render children
  if (!user) {
    return null;
  }

  return (
    <div className="admin-shell relative flex min-h-screen bg-canvas-bg text-text-primary">
      {/* Sidebar for Desktop & Mobile Drawer */}
      <AdminSidebar
        user={user}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onLogout={handleLogout}
      />


      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <AdminTopBar
          user={user}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
