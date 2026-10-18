"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/layout/Container";

interface DepartmentItem {
  id: string;
  title: string;
  href: string;
  imageUrl: string;
  subtitle: string;
}

const DEPARTMENTS: DepartmentItem[] = [
  {
    id: "women",
    title: "Women",
    subtitle: "Explore Collection",
    href: "/shop/women",
    imageUrl: "/images/categories/cat-women-pret.jpg",
  },
  {
    id: "men",
    title: "Men",
    subtitle: "Explore Collection",
    href: "/shop/men",
    imageUrl: "/images/categories/cat-men-bespoke.jpg",
  },
  {
    id: "accessories",
    title: "Accessories",
    subtitle: "Explore Collection",
    href: "/shop?category=Festive+Shawls+%26+Wraps",
    imageUrl: "/images/categories/cat-festive-shawls.jpg",
  },
  {
    id: "footwear",
    title: "Footwear",
    subtitle: "Explore Collection",
    href: "/shop",
    imageUrl: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=600&auto=format&fit=crop",
  },
];

export function CategoryBar() {
  return (
    <section
      aria-label="Department Quick Navigation"
      className="border-b border-border-subtle bg-surface-white/90 py-5 sm:py-6 backdrop-blur-xs"
    >
      <Container size="xl">
        <div className="grid grid-cols-2 divide-y divide-border-subtle/80 sm:divide-y-0 sm:divide-x sm:grid-cols-4 border border-border-subtle/70 rounded-2xl bg-canvas-bg/30 overflow-hidden shadow-xs">
          {DEPARTMENTS.map((dept) => (
            <Link
              key={dept.id}
              href={dept.href}
              className="group flex items-center gap-3.5 p-3.5 sm:p-5 transition-all duration-300 hover:bg-surface-white hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary"
            >
              {/* Thumbnail Frame */}
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-subtle sm:h-16 sm:w-16 border border-border-subtle/40">
                <Image
                  src={dept.imageUrl}
                  alt={dept.title}
                  fill
                  sizes="64px"
                  className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-108"
                />
              </div>

              {/* Department Label */}
              <div className="flex flex-col min-w-0">
                <span className="font-serif text-base font-medium tracking-tight text-text-primary transition-colors group-hover:text-accent-gold sm:text-lg">
                  {dept.title}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium tracking-wide text-text-muted transition-colors group-hover:text-text-primary">
                  {dept.subtitle}
                  <span
                    className="inline-block transition-transform duration-300 group-hover:translate-x-1 text-accent-gold"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
