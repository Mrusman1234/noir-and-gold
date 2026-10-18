import React from "react";
import { Container } from "@/components/layout/Container";

export default function ProductLoading() {
  return (
    <div className="bg-obsidian text-pearl min-h-screen py-6 sm:py-10 animate-pulse">
      <Container size="lg">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2 mb-6 sm:mb-8">
          <div className="h-3 w-10 bg-velvet border border-border-subtle" />
          <span className="text-muted-lavender text-xs">/</span>
          <div className="h-3 w-10 bg-velvet border border-border-subtle" />
          <span className="text-muted-lavender text-xs">/</span>
          <div className="h-3 w-28 bg-gold-sovereign/20 border border-gold-sovereign/30" />
        </div>

        {/* 2-Column PDP Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-14 items-start">
          {/* Gallery Skeleton (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="aspect-[3/4] w-full bg-velvet border border-border-subtle relative">
              <div className="absolute top-3 left-3 h-4 w-16 bg-gold-sovereign/20" />
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="aspect-[3/4] w-full bg-velvet border border-border-subtle"
                />
              ))}
            </div>
          </div>

          {/* Purchasing Column Skeleton (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <div className="h-3 w-28 bg-gold-sovereign/30" />
              <div className="h-8 w-3/4 bg-pearl/20" />
              <div className="h-4 w-1/2 bg-aubergine/40" />
              <div className="h-3 w-32 bg-aubergine/30" />
            </div>

            <div className="h-8 w-40 bg-pearl/30 border-b border-border-subtle pb-4" />

            <div className="space-y-2">
              <div className="h-3 w-full bg-aubergine/30" />
              <div className="h-3 w-5/6 bg-aubergine/20" />
              <div className="h-3 w-2/3 bg-aubergine/20" />
            </div>

            {/* Swatches Skeleton */}
            <div className="space-y-2">
              <div className="h-3 w-20 bg-muted-lavender/30" />
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-aubergine/50" />
                <div className="w-8 h-8 rounded-full bg-aubergine/50" />
              </div>
            </div>

            {/* Sizes Skeleton */}
            <div className="space-y-2">
              <div className="h-3 w-20 bg-muted-lavender/30" />
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-12 h-10 bg-velvet border border-border-subtle"
                  />
                ))}
              </div>
            </div>

            {/* CTA Skeleton */}
            <div className="h-12 w-full bg-gold-sovereign/20 border border-gold-sovereign/30" />

            {/* Accordion Skeletons */}
            <div className="border-t border-border-subtle divide-y divide-border-subtle pt-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="py-4 flex justify-between">
                  <div className="h-4 w-40 bg-pearl/20" />
                  <div className="h-4 w-4 bg-pearl/20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
