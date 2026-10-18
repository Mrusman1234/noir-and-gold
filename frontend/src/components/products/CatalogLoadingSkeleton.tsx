import React from "react";
import { Container } from "@/components/layout/Container";

interface CatalogLoadingSkeletonProps {
  category?: string;
}

export function CatalogLoadingSkeleton({ category }: CatalogLoadingSkeletonProps) {
  const title =
    category === "women"
      ? "Women's Prêt & Couture"
      : category === "men"
      ? "Men's Bespoke & Formal"
      : "Master Apparel Catalog";

  return (
    <div className="bg-canvas-bg text-text-primary min-h-screen py-8 sm:py-12 animate-pulse">
      <Container size="xl">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2 mb-6">
          <div className="h-3 w-10 bg-surface-subtle border border-border-subtle" />
          <span className="text-text-secondary text-xs">/</span>
          {category ? (
            <>
              <div className="h-3 w-10 bg-surface-subtle border border-border-subtle" />
              <span className="text-text-secondary text-xs">/</span>
              <div className="h-3 w-16 bg-surface-subtle border border-border-subtle" />
            </>
          ) : (
            <div className="h-3 w-12 bg-surface-subtle border border-border-subtle" />
          )}
        </div>

        {/* Page Header Skeleton */}
        <div className="border-b border-border-subtle pb-8 mb-8 sm:mb-10">
          <div className="max-w-3xl">
            <h1 className="font-serif text-3xl sm:text-5xl font-medium tracking-tight text-text-primary/20 mb-3">
              {title}
            </h1>
            <div className="h-4 w-3/4 max-w-lg bg-surface-subtle mb-2" />
            <div className="h-4 w-1/2 max-w-md bg-surface-subtle" />
          </div>

          {/* Search Bar Skeleton */}
          <div className="mt-6 h-11 max-w-xl bg-surface-white border border-border-subtle rounded-full flex items-center px-4">
            <div className="w-4 h-4 bg-text-secondary/20 mr-3 rounded-full" />
            <div className="h-3 w-48 bg-surface-subtle" />
          </div>
        </div>

        {/* Main Content Skeleton Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 xl:gap-12 items-start">
          {/* Desktop Filter Sidebar Skeleton */}
          <aside className="hidden lg:block lg:col-span-1 space-y-8 bg-surface-white p-6 border border-border-subtle rounded-xl shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
              <div className="h-4 w-20 bg-surface-subtle" />
              <div className="h-3 w-12 bg-surface-subtle" />
            </div>

            {/* Filter Section Skeletons */}
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-3 pb-6 border-b border-border-subtle">
                <div className="h-3 w-24 bg-surface-subtle" />
                <div className="space-y-2 pt-1">
                  <div className="h-3 w-32 bg-surface-subtle" />
                  <div className="h-3 w-28 bg-surface-subtle" />
                  <div className="h-3 w-36 bg-surface-subtle" />
                </div>
              </div>
            ))}
          </aside>

          {/* Product Grid Area */}
          <div className="lg:col-span-3">
            {/* Toolbar Skeleton */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-border-subtle">
              <div className="h-4 w-36 bg-surface-subtle" />
              <div className="h-9 w-40 bg-surface-white border border-border-subtle rounded-full" />
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div
                  key={idx}
                  className="bg-surface-white border border-border-subtle rounded-md overflow-hidden flex flex-col"
                >
                  <div className="aspect-[3/4] w-full bg-surface-subtle border-b border-border-subtle relative">
                    <div className="absolute top-2.5 left-2.5 h-4 w-12 bg-surface-white/60 rounded-full" />
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="h-2.5 w-16 bg-surface-subtle" />
                    <div className="h-4 w-3/4 bg-surface-subtle" />
                    <div className="h-3.5 w-24 bg-surface-subtle pt-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
