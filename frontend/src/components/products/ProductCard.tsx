"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ProductSummary } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { formatPKR } from "@/lib/utils";

export interface ProductCardProps {
  product: ProductSummary;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const hoverSrc =
    product.hoverImageUrl && product.hoverImageUrl !== product.primaryImageUrl
      ? product.hoverImageUrl
      : null;

  return (
    <article className={`group relative flex flex-col ${className || ""}`}>
      {/* Product Image Frame */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md border border-border-subtle bg-surface-subtle">
        <Link
          href={`/product/${product.slug}`}
          className="absolute inset-0 z-0 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary"
          tabIndex={-1}
          aria-hidden="true"
        >
          <Image
            src={product.primaryImageUrl}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="img-zoom object-cover object-center transition-[transform,filter] duration-500"
          />
          {hoverSrc && (
            <Image
              src={hoverSrc}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover object-center opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          )}
        </Link>

        {/* Status Badges */}
        <div className="pointer-events-none absolute left-2.5 top-2.5 z-10 flex flex-col gap-1">
          {product.isNew && <Badge variant="neutral">New</Badge>}
          {product.isLimited && <Badge variant="warning">Limited</Badge>}
          {product.isSoldOut && <Badge variant="error">Sold out</Badge>}
        </div>
      </div>

      {/* Product Metadata */}
      <div className="flex flex-1 flex-col gap-1 pt-3.5">
        <span className="text-[10px] uppercase font-bold tracking-[0.16em] text-text-secondary">
          {product.categoryName}
        </span>
        <h3 className="font-serif text-base font-medium leading-snug text-text-primary transition-colors group-hover:text-text-secondary sm:text-lg">
          <Link
            href={`/product/${product.slug}`}
            className="focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary"
          >
            {product.title}
          </Link>
        </h3>
        <div className="mt-0.5 flex items-baseline gap-2 font-sans text-sm">
          <span className="tabular-nums font-medium text-text-primary">
            {formatPKR(product.pricePkr)}
          </span>
          {product.salePricePkr && (
            <span className="text-xs text-text-muted line-through">
              {formatPKR(product.salePricePkr)}
            </span>
          )}
        </div>
        <Link
          href={`/product/${product.slug}`}
          className="editorial-link mt-1.5 w-fit text-[10px] uppercase tracking-[0.14em] text-text-primary font-medium hover:text-text-secondary"
        >
          View Piece <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
