import React from "react";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { ProductCard } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/Button";
import { readCatalogProducts } from "@/lib/catalog-read";

export async function FeaturedSection() {
  // Read up to 8 garments from the catalog
  const catalogProducts = await readCatalogProducts({ limit: 8 });

  return (
    <section
      aria-label="Featured Collection and Best Sellers"
      className="bg-surface-white border-b border-border-subtle py-16 sm:py-24"
    >
      <Container size="xl">
        {/* Section Header: Aligned with reference design */}
        <div className="mb-10 flex flex-col justify-between gap-4 sm:mb-14 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-[11px] uppercase font-bold tracking-[0.24em] text-accent-gold">
              Featured Collection
            </p>
            <h2 className="font-serif text-3xl font-medium text-text-primary sm:text-5xl tracking-tight">
              Our Best Sellers
            </h2>
          </div>

          <div className="flex flex-col sm:items-end">
            <Link
              href="/shop"
              className="group inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-text-primary font-semibold transition-colors hover:text-accent-gold"
            >
              View All Products
              <span
                className="inline-block transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              >
                →
              </span>
            </Link>
          </div>
        </div>

        {/* High-Density Editorial Product Grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8">
          {catalogProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={index < 4}
            />
          ))}
        </div>

        {/* Master Catalog Discovery */}
        <div className="mt-14 flex flex-col items-center justify-center gap-4 sm:mt-18 sm:flex-row">
          <Button href="/shop" variant="primary" size="lg" showArrow>
            Explore Complete Catalog
          </Button>
          <Button href="/shop/women" variant="secondary" size="lg" showArrow>
            Shop Women&apos;s Prêt
          </Button>
        </div>
      </Container>
    </section>
  );
}
