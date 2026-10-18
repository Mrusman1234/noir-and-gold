"use client";

import React from "react";
import dynamic from "next/dynamic";

const LuxuryHeroScene = dynamic(
  () => import("@/components/3d/LuxuryHeroScene"),
  {
    ssr: false,
    loading: () => (
      <div
        className="pointer-events-none relative h-full w-full opacity-30 transition-opacity"
        aria-hidden="true"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-56 w-56 rounded-full border border-accent-gold/25 blur-xs" />
        </div>
      </div>
    ),
  }
);

interface Hero3DWrapperProps {
  className?: string;
}

export function Hero3DWrapper({ className = "" }: Hero3DWrapperProps) {
  return <LuxuryHeroScene className={className} />;
}
