import React from "react";
import { Container } from "@/components/layout/Container";

export function OrderSuccessSkeleton() {
  return (
    <div className="bg-canvas-bg text-text-primary min-h-screen py-10 sm:py-16 animate-pulse">
      <Container size="md" className="space-y-8">
        {/* Header Skeleton */}
        <div className="text-center space-y-3 pb-8 border-b border-border-subtle">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100/60 border border-emerald-300/40" />
          <div className="h-3 w-36 bg-surface-subtle mx-auto rounded-full" />
          <div className="h-8 w-72 bg-border-subtle mx-auto rounded-md" />
          <div className="h-4 w-96 max-w-full bg-surface-subtle mx-auto rounded-md" />
          <div className="h-7 w-48 bg-surface-subtle mx-auto rounded-full mt-2" />
        </div>

        {/* Banner Skeleton */}
        <div className="h-24 bg-surface-white border border-border-subtle rounded-2xl shadow-xs" />

        {/* 2-Col Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-44 bg-surface-white border border-border-subtle rounded-2xl shadow-xs" />
          <div className="h-44 bg-surface-white border border-border-subtle rounded-2xl shadow-xs" />
        </div>

        {/* Items List Skeleton */}
        <div className="h-48 bg-surface-white border border-border-subtle rounded-2xl shadow-xs" />
      </Container>
    </div>
  );
}
