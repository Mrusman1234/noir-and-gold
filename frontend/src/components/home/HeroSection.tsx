"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Hero3DWrapper } from "@/components/3d/Hero3DWrapper";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

interface HeroSlide {
  id: number;
  kicker: string;
  titlePrefix: string;
  titleEmphasis: string;
  subtitle: string;
  ctaText: string;
  ctaHref: string;
  imageSrc: string;
  imageAlt: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 1,
    kicker: "TIMELESS ELEGANCE",
    titlePrefix: "Style That",
    titleEmphasis: "Speaks Luxury",
    subtitle:
      "Discover premium fashion designed for those who appreciate the finer details. Crafted in Pakistan with nationwide delivery.",
    ctaText: "Shop Now",
    ctaHref: "/shop",
    imageSrc: "/images/campaign/hero-editorial.jpg",
    imageAlt: "NOIR & GOLD haute couture editorial garment",
  },
  {
    id: 2,
    kicker: "ATELIER COUTURE",
    titlePrefix: "Crafted With",
    titleEmphasis: "Pure Distinction",
    subtitle:
      "Heirloom zari embroidery, raw silks, and bespoke hand-tailored cuts engineered for discerning tastes.",
    ctaText: "Explore Collection",
    ctaHref: "/shop/women",
    imageSrc: "/images/campaign/editorial-atelier.jpg",
    imageAlt: "NOIR & GOLD artisanal embroidery and velvet craftsmanship",
  },
  {
    id: 3,
    kicker: "HERITAGE BESPOKE",
    titlePrefix: "Tailored For",
    titleEmphasis: "The Modern You",
    subtitle:
      "Imperial sherwanis, prince coats, and ceremonial menswear steeped in timeless South Asian elegance.",
    ctaText: "Discover Men",
    ctaHref: "/shop/men",
    imageSrc: "/images/campaign/collection-women.jpg",
    imageAlt: "NOIR & GOLD festive heirloom garments",
  },
];

export function HeroSection() {
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  const activeSlide = HERO_SLIDES[currentSlideIndex];

  const goToSlide = React.useCallback((newIndex: number) => {
    setIsTransitioning(true);
    setCurrentSlideIndex((newIndex + HERO_SLIDES.length) % HERO_SLIDES.length);
    const t = setTimeout(() => setIsTransitioning(false), 500);
    return () => clearTimeout(t);
  }, []);

  const handleNext = () => goToSlide(currentSlideIndex + 1);
  const handlePrev = () => goToSlide(currentSlideIndex - 1);

  // Gentle auto-rotation every 9 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      goToSlide(currentSlideIndex + 1);
    }, 9000);
    return () => clearInterval(timer);
  }, [currentSlideIndex, goToSlide]);

  return (
    <section
      aria-label="Atelier Hero Showcase"
      className="relative isolate overflow-hidden bg-gradient-to-b from-[#FAF7F2] via-[#F5EFE6] to-[#ECE4D8] border-b border-border-subtle"
    >
      {/* Background Architectural Subtle Arch & Ambient Radial Lighting */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[25%] left-1/2 h-[750px] w-[750px] -translate-x-1/2 rounded-full bg-gradient-to-b from-white/70 via-accent-gold/10 to-transparent blur-3xl sm:h-[950px] sm:w-[950px]" />
        <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-white/30 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[82svh] max-w-7xl flex-col justify-between px-5 py-8 sm:px-8 sm:py-12 lg:min-h-[88svh] lg:px-12">
        {/* Main Grid: Left Typography + Right 3D Visual Centerpiece */}
        <div className="grid flex-1 items-center gap-8 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Editorial Headline & Actions (5 cols) */}
          <div className="flex flex-col justify-center lg:col-span-6 xl:col-span-5 pt-4 sm:pt-0">
            {/* Kicker with Gold Divider */}
            <div className="flex items-center gap-3">
              <span className="h-px w-6 bg-accent-gold" />
              <span className="text-[11px] font-bold uppercase tracking-[0.26em] text-text-secondary sm:text-xs">
                {activeSlide.kicker}
              </span>
            </div>

            {/* Dynamic Headline */}
            <h1
              className={`mt-4 font-serif text-[42px] font-normal leading-[1.04] tracking-tight text-text-primary transition-all duration-500 sm:text-6xl md:text-7xl lg:text-[5.25rem] ${
                isTransitioning ? "opacity-40 translate-y-2" : "opacity-100 translate-y-0"
              }`}
            >
              {activeSlide.titlePrefix}
              <span className="block font-serif italic text-accent-gold font-normal">
                {activeSlide.titleEmphasis}
              </span>
            </h1>

            {/* Subtitle Description */}
            <p
              className={`mt-5 max-w-md text-sm leading-relaxed text-text-secondary transition-all duration-500 sm:text-base ${
                isTransitioning ? "opacity-40" : "opacity-100"
              }`}
            >
              {activeSlide.subtitle}
            </p>

            {/* CTA Button */}
            <div className="mt-8 flex items-center gap-4">
              <MagneticButton
                href={activeSlide.ctaHref}
                variant="primary"
                size="lg"
                showArrow
              >
                {activeSlide.ctaText}
              </MagneticButton>
            </div>

            {/* Slider Pager Indicator (01 —— 03 < >) */}
            <div className="mt-12 flex items-center gap-4 sm:mt-16">
              <div className="flex items-center gap-2 font-mono text-xs font-semibold tracking-wider text-text-muted">
                <span className="text-text-primary">
                  0{activeSlide.id}
                </span>
                <span className="h-px w-8 bg-text-primary/40" />
                <span>0{HERO_SLIDES.length}</span>
              </div>

              {/* Prev / Next Controls */}
              <div className="flex items-center gap-1.5 ml-4">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle bg-surface-white/80 text-text-primary transition-all hover:border-text-primary hover:bg-surface-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle bg-surface-white/80 text-text-primary transition-all hover:border-text-primary hover:bg-surface-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary"
                  aria-label="Next slide"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Signature 3D Ribbon & Couture Model (7 cols) */}
          <div className="relative flex items-center justify-center lg:col-span-6 xl:col-span-7">
            {/* The Outer Architectural Arch Container */}
            <div className="relative aspect-[4/5] sm:aspect-[4/4.8] w-full max-w-[540px] overflow-hidden rounded-t-[180px] rounded-b-3xl border border-border-subtle/70 bg-gradient-to-b from-[#F9F5EE] via-[#EFE7D8] to-[#E5DAC7] shadow-2xl">
              {/* Layer 1: Ambient Arch Backdrop Glow */}
              <div className="absolute inset-0 bg-radial from-white/70 via-transparent to-black/5 pointer-events-none" />

              {/* Layer 2: INTERACTIVE 3D WEBGL METALLIC CHAMPAGNE RIBBON SCENE */}
              <div className="absolute inset-0 z-10">
                <Hero3DWrapper className="h-full w-full" />
              </div>

              {/* Layer 3: High-Fashion Couture Model Photography */}
              <div
                className={`absolute inset-0 z-20 transition-all duration-700 ease-out ${
                  isTransitioning ? "opacity-60 scale-98" : "opacity-100 scale-100"
                }`}
              >
                <Image
                  src={activeSlide.imageSrc}
                  alt={activeSlide.imageAlt}
                  fill
                  priority
                  sizes="(max-width: 1024px) 90vw, 540px"
                  className="object-cover object-[center_top] mix-blend-multiply opacity-90 transition-transform duration-1000 ease-out hover:scale-103"
                />
                {/* Subtle soft bottom gradient to ground the model naturally */}
                <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-[#E5DAC7]/90 via-[#E5DAC7]/30 to-transparent pointer-events-none" />
              </div>

              {/* Layer 4: Re-overlaying 3D Ribbon foreground highlight */}
              <div className="pointer-events-none absolute inset-0 z-30 ring-1 ring-inset ring-white/40 rounded-t-[180px] rounded-b-3xl" />
            </div>

            {/* Vertical Branding Badge & Quick Carousel Trigger (Desktop only) */}
            <div className="absolute -right-4 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-6 xl:flex">
              <div className="flex flex-col items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-text-secondary select-none [writing-mode:vertical-lr]">
                <span>LUXURY FASHION</span>
                <span className="text-text-muted">FOR A MODERN YOU</span>
                <Sparkles className="mt-2 h-3.5 w-3.5 text-accent-gold rotate-90" />
              </div>

              <div className="flex flex-col gap-2 mt-4">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle bg-surface-white/90 text-text-primary shadow-xs transition-all hover:bg-text-primary hover:text-surface-white"
                  aria-label="Previous editorial slide"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle bg-surface-white/90 text-text-primary shadow-xs transition-all hover:bg-text-primary hover:text-surface-white"
                  aria-label="Next editorial slide"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
