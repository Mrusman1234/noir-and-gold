"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ProductImage } from "@/types";
import { Badge } from "@/components/ui/Badge";

interface ProductGalleryProps {
  images: ProductImage[];
  title: string;
  isNew?: boolean;
  isLimited?: boolean;
  discountPercent?: number | null;
}

export function ProductGallery({
  images,
  title,
  isNew,
  isLimited,
  discountPercent,
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const displayImages = images.length > 0 ? images : [
    {
      id: "fallback-img",
      url: "/images/products/prod-001-primary.jpg",
      alt: title,
      isPrimary: true,
    },
  ];

  const currentImage = displayImages[activeIndex] || displayImages[0];

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Primary 3:4 Viewport */}
      <div className="group relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-border-subtle bg-surface-subtle shadow-xs">
        <Image
          src={currentImage.url}
          alt={currentImage.alt || title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover object-center transition-all duration-500 ease-out"
        />

        {/* Micro Badges (Top-Left) */}
        <div className="absolute top-3.5 left-3.5 z-10 flex flex-col gap-1.5 pointer-events-none">
          {isNew && <Badge variant="gold">NEW ARRIVAL</Badge>}
          {isLimited && <Badge variant="warning">LIMITED ATELIER</Badge>}
          {discountPercent && (
            <Badge variant="gold">{discountPercent}% OFF</Badge>
          )}
        </div>

        {/* Left / Right Carousel Arrow Buttons */}
        {displayImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous gallery image"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface-white/90 hover:bg-surface-white border border-border-subtle text-text-primary flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 shadow-sm hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary cursor-pointer"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>

            <button
              type="button"
              onClick={handleNext}
              aria-label="Next gallery image"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface-white/90 hover:bg-surface-white border border-border-subtle text-text-primary flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 shadow-sm hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary cursor-pointer"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </>
        )}

        {/* Image Counter Pill (Bottom-Right) */}
        <div className="absolute bottom-3.5 right-3.5 z-10 px-3 py-1 bg-surface-white/90 border border-border-subtle text-[11px] font-sans text-text-secondary tracking-wider uppercase rounded-full shadow-xs">
          {activeIndex + 1} / {displayImages.length}
        </div>
      </div>

      {/* Indicator Dots Bar */}
      {displayImages.length > 1 && (
        <div className="flex items-center justify-center gap-2 py-1">
          {displayImages.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(idx)}
              aria-label={`Go to image slide ${idx + 1}`}
              className={`transition-all duration-300 rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary ${
                activeIndex === idx
                  ? "w-6 h-2 bg-text-primary"
                  : "w-2 h-2 bg-border-subtle hover:bg-text-secondary"
              }`}
            />
          ))}
        </div>
      )}

      {/* Clickable Thumbnail Strip */}
      {displayImages.length > 1 && (
        <div
          className="grid grid-cols-4 sm:grid-cols-4 gap-3 pt-1"
          role="region"
          aria-label="Garment image thumbnails"
        >
          {displayImages.map((img, idx) => {
            const isSelected = activeIndex === idx;
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => setActiveIndex(idx)}
                aria-label={`Select angle ${idx + 1}: ${img.alt || title}`}
                className={`relative aspect-[3/4] w-full overflow-hidden rounded-md border border-border-subtle bg-surface-subtle cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary ${
                  isSelected
                    ? "opacity-100 ring-2 ring-text-primary"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                <Image
                  src={img.url}
                  alt={img.alt || `${title} thumbnail ${idx + 1}`}
                  fill
                  sizes="(max-width: 640px) 25vw, 12vw"
                  className="object-cover object-center"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
