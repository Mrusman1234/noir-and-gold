"use client";

import React, { Suspense } from "react";
import { usePathname } from "next/navigation";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

function StorefrontChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-canvas-bg text-text-primary">
        {children}
      </div>
    );
  }

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer />
    </>
  );
}

export function StorefrontShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col min-h-screen bg-canvas-bg text-text-primary">
          {children}
        </div>
      }
    >
      <StorefrontChrome>{children}</StorefrontChrome>
    </Suspense>
  );
}
