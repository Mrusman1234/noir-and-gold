"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ProductSummary } from "@/types";
import { formatPKR } from "@/lib/utils";
import { Heart } from "lucide-react";

export interface ProductCardProps {
  product: ProductSummary;
  className?: string;
  priority?: boolean;
}

export function ProductCard({
  product,
  className = "",
  priority = false,
}: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(`wishlist_${product.id}`) === "true";
    } catch {
      return false;
    }
  });

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(`wishlist_${product.id}`, String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const hoverSrc =
    product.hoverImageUrl && product.hoverImageUrl !== product.primaryImageUrl
      ? product.hoverImageUrl
      : null;

  return (
    <article
      className={`group relative flex flex-col transition-all duration-300 ${className}`}
    >
      {/* Product Image Frame */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-border-subtle bg-surface-subtle transition-all duration-500 ease-out group-hover:border-border-hover group-hover:shadow-md">
        <Link
          href={`/product/${product.slug}`}
          className="absolute inset-0 z-0 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary"
          tabIndex={-1}
          aria-hidden="true"
        >
          {/* Primary Product Photography */}
          <Image
            src={product.primaryImageUrl}
            alt={product.title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover object-center transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
          />

          {/* Secondary Hover Image Dissolve */}
          {hoverSrc && (
            <Image
              src={hoverSrc}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover object-center opacity-0 transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-100"
            />
          )}
        </Link>

        {/* Refined Pill Badges (New, Best Seller, Limited) */}
        <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col gap-1.5">
          {product.isNew && (
            <span className="rounded-full border border-border-subtle/80 bg-surface-white/90 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-text-primary backdrop-blur-xs shadow-xs">
              New
            </span>
          )}
          {product.isLimited && (
            <span className="rounded-full border border-accent-gold/40 bg-accent-gold/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#735824] backdrop-blur-xs shadow-xs">
              Best Seller
            </span>
          )}
          {product.isSoldOut && (
            <span className="rounded-full border border-red-200 bg-red-50/90 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-700 backdrop-blur-xs">
              Sold out
            </span>
          )}
        </div>

        {/* Quick View Overlay Bar (Appears gracefully on desktop hover) */}
        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 hidden translate-y-2 opacity-0 transition-all duration-300 ease-out group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 sm:block">
          <Link
            href={`/product/${product.slug}`}
            className="flex w-full items-center justify-center rounded-lg border border-border-subtle/80 bg-surface-white/95 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-primary shadow-sm backdrop-blur-sm transition-colors hover:bg-text-primary hover:text-surface-white"
          >
            View Piece
          </Link>
        </div>
      </div>

      {/* Product Metadata & Wishlist Row */}
      <div className="flex flex-1 flex-col pt-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <h3 className="font-serif text-[15px] sm:text-base font-medium leading-snug text-text-primary transition-colors group-hover:text-accent-gold truncate">
              <Link
                href={`/product/${product.slug}`}
                className="focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary"
              >
                {product.title}
              </Link>
            </h3>
            <span className="mt-0.5 text-[11px] font-normal tracking-wide text-text-muted">
              {product.categoryName}
            </span>
          </div>

          {/* Interactive Wishlist Heart Button */}
          <button
            type="button"
            onClick={toggleWishlist}
            className="group/heart relative -mr-1 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-muted transition-transform active:scale-125 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary"
            aria-label={
              isWishlisted
                ? `Remove ${product.title} from wishlist`
                : `Add ${product.title} to wishlist`
            }
          >
            <Heart
              className={`h-4 w-4 transition-colors duration-200 ${
                isWishlisted
                  ? "fill-red-500 text-red-500"
                  : "stroke-[1.6] group-hover/heart:scale-110"
              }`}
            />
          </button>
        </div>

        {/* Pricing */}
        <div className="mt-2 flex items-baseline gap-2 font-sans text-sm">
          <span className="tabular-nums font-medium text-text-primary">
            {formatPKR(product.pricePkr)}
          </span>
          {product.salePricePkr && product.salePricePkr < product.pricePkr && (
            <span className="text-xs text-text-muted line-through">
              {formatPKR(product.salePricePkr)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
