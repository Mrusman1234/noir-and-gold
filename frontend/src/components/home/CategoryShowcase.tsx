import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/layout/Container";

interface CategoryTile {
  id: string;
  name: string;
  tag: string;
  subtitle: string;
  href: string;
  imageUrl: string;
}

const CATEGORIES: CategoryTile[] = [
  {
    id: "women-pret",
    name: "Women's Luxury Prêt",
    tag: "Atelier Women",
    subtitle: "Handcrafted Anarkalis & Raw Silks",
    href: "/shop?category=Women%27s+Luxury+Pr%C3%AAt",
    imageUrl: "/images/categories/cat-women-pret.jpg",
  },
  {
    id: "men-bespoke",
    name: "Men's Bespoke & Formal",
    tag: "Atelier Men",
    subtitle: "Imperial Sherwanis & Prince Coats",
    href: "/shop?category=Men%27s+Bespoke+%26+Formal",
    imageUrl: "/images/categories/cat-men-bespoke.jpg",
  },
  {
    id: "festive-shawls",
    name: "Festive Shawls & Wraps",
    tag: "Heritage Couture",
    subtitle: "Heirloom Zari Velvet & Tilla",
    href: "/shop?category=Festive+Shawls+%26+Wraps",
    imageUrl: "/images/categories/cat-festive-shawls.jpg",
  },
  {
    id: "men-kurta",
    name: "Men's Kurta & Waistcoat",
    tag: "Ceremonial Silks",
    subtitle: "Pure Raw Silk Kurtas & Jamawar Vests",
    href: "/shop?category=Men%27s+Kurta+%26+Waistcoat",
    imageUrl: "/images/categories/cat-men-kurta.jpg",
  },
];

export function CategoryShowcase() {
  return (
    <section aria-label="Shop by Category" className="py-16 sm:py-24 bg-canvas-bg">
      <Container size="xl">
        {/* Section Header */}
        <div className="mb-10 flex flex-col justify-between gap-4 sm:mb-14 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-[10.5px] uppercase font-bold tracking-[0.24em] text-text-primary">
              Curated Departments
            </p>
            <h2 className="font-serif text-3xl font-medium text-text-primary sm:text-5xl tracking-tight">
              Shop by category
            </h2>
          </div>
          <Link
            href="/shop"
            className="editorial-link text-xs uppercase tracking-[0.16em] text-text-primary font-bold hover:text-text-secondary"
          >
            View Complete Catalog
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {/* 4-Column Balanced Grid spanning full xl width */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-8">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={cat.href}
              className="group relative flex flex-col overflow-hidden rounded-lg border border-border-subtle bg-surface-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary transition-all duration-500 hover:shadow-lg hover:border-border-hover"
            >
              {/* Aspect Ratio 3/4 Frame */}
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface-subtle">
                <Image
                  src={cat.imageUrl}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                />
                {/* Clean, high-contrast bottom text backing: leaves top 50% untouched */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none transition-opacity duration-500 group-hover:from-black/95" />

                {/* Overlaid Category Information with High-Contrast Text */}
                <div className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-6">
                  <span className="text-[10px] uppercase font-bold tracking-[0.22em] text-[#FFFFFF] drop-shadow-xs">
                    {cat.tag}
                  </span>
                  <h3 className="mt-1 font-serif text-lg font-medium leading-snug text-surface-white sm:text-2xl drop-shadow-xs">
                    {cat.name}
                  </h3>
                  <p className="mt-1 text-xs text-[#FAF7F2] font-normal line-clamp-1 drop-shadow-xs">
                    {cat.subtitle}
                  </p>
                  <span className="editorial-link mt-3.5 inline-flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.16em] text-surface-white font-bold">
                    Explore Department
                    <span aria-hidden="true">→</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
