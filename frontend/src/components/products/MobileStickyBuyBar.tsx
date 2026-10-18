"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { formatPKR } from "@/lib/utils";

interface MobileStickyBuyBarProps {
  title: string;
  imageUrl: string;
  pricePkr: number;
  selectedSize: string;
  selectedColor: string;
  isAvailable: boolean;
  onAddToCart: () => void;
  isAdding: boolean;
  justAdded: boolean;
}

export function MobileStickyBuyBar({
  title,
  imageUrl,
  pricePkr,
  selectedSize,
  selectedColor,
  isAvailable,
  onAddToCart,
  isAdding,
  justAdded,
}: MobileStickyBuyBarProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show when scrolled past top 450px
      if (window.scrollY > 450) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Mobile quick purchase bar"
      className="fixed bottom-0 inset-x-0 z-40 bg-surface-white/95 backdrop-blur-md border-t border-border-subtle p-3 px-4 lg:hidden shadow-lg transition-all duration-300 animate-fade-in"
    >
      <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
        {/* Thumbnail & Title/Info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative w-10 h-12 flex-shrink-0 bg-surface-subtle border border-border-subtle rounded-md overflow-hidden">
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="40px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-serif text-text-primary truncate font-medium">
              {title}
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-text-secondary font-sans">
              <span>{selectedColor}</span>
              <span>•</span>
              <span className="font-semibold text-text-primary">{selectedSize}</span>
            </div>
            <p className="text-xs font-sans font-bold text-text-primary">
              {formatPKR(pricePkr)}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onAddToCart}
          disabled={!isAvailable || isAdding}
          className={`flex-shrink-0 rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary ${
            justAdded
              ? "bg-status-success text-white"
              : !isAvailable
              ? "cursor-not-allowed border border-border-subtle bg-surface-subtle text-text-secondary"
              : "cursor-pointer bg-text-primary text-white hover:bg-black active:scale-[0.985]"
          }`}
        >
          {justAdded
            ? "Added ✓"
            : !isAvailable
            ? "Sold Out"
            : isAdding
            ? "Adding..."
            : "Add to Bag"}
        </button>
      </div>
    </aside>
  );
}
