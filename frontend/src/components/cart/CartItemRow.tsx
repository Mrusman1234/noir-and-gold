"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { CartItem } from "@/types";
import { formatPKR } from "@/lib/utils";

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
}: CartItemRowProps) {
  const lineTotalPkr = item.pricePkr * item.quantity;
  const isMaxStockReached = item.quantity >= item.maxStock;

  return (
    <article
      className="flex flex-col items-start justify-between gap-4 border-b border-border-subtle py-6 sm:flex-row sm:items-center sm:gap-6 font-sans"
      aria-labelledby={`cart-item-${item.id}`}
    >
      {/* Product Image & Core Details */}
      <div className="flex items-start gap-4 min-w-0 flex-1">
        {/* 3:4 Thumbnail Image */}
        <Link
          href={`/product/${item.slug}`}
          className="group relative h-28 w-20 flex-shrink-0 overflow-hidden rounded-md border border-border-subtle bg-surface-subtle shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary sm:h-32 sm:w-24"
        >
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            sizes="96px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        {/* Text Details */}
        <div className="flex flex-col min-w-0 space-y-1.5 flex-1">
          <span className="text-[10px] uppercase tracking-[0.2em] text-text-secondary block truncate">
            {item.categoryName}
          </span>

          <h3 id={`cart-item-${item.id}`} className="font-serif text-base sm:text-lg font-normal text-text-primary leading-snug line-clamp-1">
            <Link
              href={`/product/${item.slug}`}
              className="hover:text-text-secondary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary"
            >
              {item.title}
            </Link>
          </h3>

          {/* Variant Spec Chips */}
          <div className="flex items-center gap-2 pt-0.5 text-xs font-sans text-text-secondary">
            <span className="border border-border-subtle bg-surface-subtle px-2.5 py-1 text-[11px] font-medium rounded-full">
              Size: <strong className="text-text-primary font-semibold">{item.size}</strong>
            </span>
            <span className="flex items-center gap-1.5 border border-border-subtle bg-surface-subtle px-2.5 py-1 text-[11px] font-medium rounded-full">
              <span>Color:</span>
              <strong className="text-text-primary font-semibold">{item.color}</strong>
            </span>
          </div>

          {/* Unit Price Display */}
          <div className="flex items-baseline gap-2 pt-1 text-xs font-sans">
            <span className="text-text-secondary text-[11px]">Unit:</span>
            <span className="font-semibold text-text-primary">
              {formatPKR(item.pricePkr)}
            </span>
            {item.originalPricePkr && item.originalPricePkr > item.pricePkr && (
              <span className="text-text-secondary/60 line-through text-[11px]">
                {formatPKR(item.originalPricePkr)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quantity Selector, Line Total & Remove Action */}
      <div className="flex items-center justify-between sm:justify-end gap-5 sm:gap-8 w-full sm:w-auto pt-3 sm:pt-0 border-t border-border-subtle sm:border-t-0">
        {/* Quantity Stepper */}
        <div className="flex flex-col items-start sm:items-center space-y-1">
          <div className="inline-flex items-center rounded-full border border-border-subtle bg-surface-white shadow-xs">
            <button
              type="button"
              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1}
              aria-label={`Decrease quantity of ${item.title}`}
              className="h-9 w-9 flex items-center justify-center text-text-primary hover:bg-surface-subtle disabled:text-text-secondary/30 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary cursor-pointer"
            >
              −
            </button>
            <span className="w-8 text-center text-xs font-sans font-semibold tabular-nums text-text-primary">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              disabled={isMaxStockReached}
              aria-label={`Increase quantity of ${item.title}`}
              className="h-9 w-9 flex items-center justify-center text-text-primary hover:bg-surface-subtle disabled:text-text-secondary/30 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary cursor-pointer"
            >
              +
            </button>
          </div>
          {isMaxStockReached && (
            <span className="text-[10px] text-amber-800 font-sans">
              Max available ({item.maxStock})
            </span>
          )}
        </div>

        {/* Line Total in PKR */}
        <div className="text-right sm:min-w-[110px]">
          <span className="text-[10px] uppercase tracking-wider text-text-secondary block sm:hidden">
            Total
          </span>
          <span className="font-sans text-sm font-bold tabular-nums text-text-primary sm:text-base">
            {formatPKR(lineTotalPkr)}
          </span>
        </div>

        {/* Remove Button */}
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          aria-label={`Remove ${item.title} (${item.size}, ${item.color}) from bag`}
          className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:text-rose-600 hover:bg-rose-50 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
            />
          </svg>
        </button>
      </div>
    </article>
  );
}
