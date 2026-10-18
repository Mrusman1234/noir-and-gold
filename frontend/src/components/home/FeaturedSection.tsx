import React from "react";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { ProductCard } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/Button";
import { readCatalogProducts } from "@/lib/catalog-read";

export async function FeaturedSection() {
  // Read full featured showcase (up to 8 garments for rich catalog density)
  const catalogProducts = await readCatalogProducts({ limit: 8 });

  return (
    <section
      aria-label="New in Featured Arrivals"
      className="bg-surface-white border-y border-border-subtle py-16 sm:py-24"
    >
      <Container size="xl">
        {/* Section Header */}
        <div className="mb-10 flex flex-col justify-between gap-4 sm:mb-14 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-[10.5px] uppercase font-bold tracking-[0.24em] text-text-primary">
              New in · Season 2026
            </p>
            <h2 className="font-serif text-3xl font-medium text-text-primary sm:text-5xl tracking-tight">
              Featured arrivals
            </h2>
          </div>
          <div className="flex flex-col sm:items-end gap-1">
            <p className="max-w-sm text-xs leading-5 text-text-secondary sm:text-sm">
              Handworked velvets, artisanal raw silks, and tailored silhouettes
              ready to dispatch nationwide with Cash on Delivery.
            </p>
            <Link
              href="/shop"
              className="editorial-link text-xs uppercase tracking-[0.16em] text-text-primary font-bold mt-2"
            >
              Browse All ({catalogProducts.length} Pieces) <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* 8-Product High-Density 4-Column Grid in Container XL */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8">
          {catalogProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Discovery Action */}
        <div className="mt-14 flex flex-col items-center justify-center gap-4 sm:mt-18 sm:flex-row">
          <Button href="/shop" variant="primary" size="lg" showArrow>
            Explore Master Collection
          </Button>
          <Button href="/shop/women" variant="secondary" size="lg" showArrow>
            Shop Women&apos;s Prêt
          </Button>
        </div>
      </Container>
    </section>
  );
}
