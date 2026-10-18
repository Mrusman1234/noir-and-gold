"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Hero3DWrapper } from "@/components/3d/Hero3DWrapper";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

interface HeroSlide {
  id: number;
  kicker: string;
  line1: string;
  line2: string;
  italicEmphasis: string;
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
    line1: "Luxury",
    line2: "Redefined",
    italicEmphasis: "for You",
    subtitle:
      "Premium fashion for modern souls. Crafted with elegance, designed for your everyday luxury.",
    ctaText: "Shop Now",
    ctaHref: "/shop",
    imageSrc: "/images/campaign/hero-crop-full.jpg",
    imageAlt: "NOIR & GOLD luxury embroidered champagne gown with bespoke zari work",
  },
  {
    id: 2,
    kicker: "ATELIER COUTURE",
    line1: "Artisanal",
    line2: "Elegance",
    italicEmphasis: "in Bloom",
    subtitle:
      "Heirloom handloom silks, delicate threadwork, and bespoke silhouettes engineered for discerning tastes.",
    ctaText: "Explore Women",
    ctaHref: "/shop/women",
    imageSrc: "/images/campaign/editorial-atelier.jpg",
    imageAlt: "NOIR & GOLD haute couture velvet and embroidery craftsmanship",
  },
  {
    id: 3,
    kicker: "HERITAGE BESPOKE",
    line1: "Tailored For",
    line2: "The Modern",
    italicEmphasis: "Gentleman",
    subtitle:
      "Imperial sherwanis, prince coats, and ceremonial menswear steeped in timeless South Asian royalty.",
    ctaText: "Discover Men",
    ctaHref: "/shop/men",
    imageSrc: "/images/campaign/collection-men.jpg",
    imageAlt: "NOIR & GOLD bespoke menswear tailored prince coat and sherwani",
  },
];

export function HeroSection() {
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  const activeSlide = HERO_SLIDES[currentSlideIndex];

  const goToSlide = useCallback((newIndex: number) => {
    setIsTransitioning(true);
    setCurrentSlideIndex((newIndex + HERO_SLIDES.length) % HERO_SLIDES.length);
    const t = setTimeout(() => setIsTransitioning(false), 450);
    return () => clearTimeout(t);
  }, []);

  const handleNext = () => goToSlide(currentSlideIndex + 1);
  const handlePrev = () => goToSlide(currentSlideIndex - 1);

  // Auto-rotation every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      goToSlide(currentSlideIndex + 1);
    }, 10000);
    return () => clearInterval(timer);
  }, [currentSlideIndex, goToSlide]);

  return (
    <section
      aria-label="Atelier Hero Showcase"
      className="relative isolate overflow-hidden bg-gradient-to-b from-[#FAF7F1] via-[#F4EDE2] to-[#ECE3D5] border-b border-border-subtle"
    >
      {/* Background Architectural Atmosphere & Soft Botanical Lighting */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        {/* Soft overhead radial glow */}
        <div className="absolute -top-[20%] right-[15%] h-[850px] w-[850px] rounded-full bg-gradient-to-b from-white/80 via-accent-gold/10 to-transparent blur-3xl" />
        
        {/* Left wall soft architectural shadow */}
        <div className="absolute left-0 top-0 h-full w-[40%] bg-gradient-to-r from-[#ECE4D8]/60 via-[#F4EDE2]/20 to-transparent" />

        {/* Botanical leaf shadow silhouette for editorial ambiance */}
        <div className="absolute -left-12 top-6 h-96 w-96 opacity-[0.06] blur-xs select-none">
          <svg viewBox="0 0 200 200" fill="currentColor" className="h-full w-full text-black">
            <path d="M42.7,-68.8C54.8,-60.2,63.6,-47.9,70.5,-34.5C77.4,-21.1,82.4,-6.6,80.7,7.1C79,20.8,70.6,33.7,60.8,44.8C51,55.9,39.8,65.2,26.9,70.2C14,75.2,-0.6,75.9,-14.8,72.6C-29,69.3,-42.8,62,-54.2,51.4C-65.6,40.8,-74.6,26.9,-78.2,11.5C-81.8,-3.9,-80,-20.8,-72.4,-34.2C-64.8,-47.6,-51.4,-57.5,-37.5,-65.4C-23.6,-73.3,-9.2,-79.2,3.4,-84.1C16,-89,28.2,-92.9,42.7,-68.8Z" transform="translate(100 100)" />
          </svg>
        </div>
      </div>

      <div className="relative z-10 mx-auto flex min-h-[84svh] max-w-7xl flex-col justify-between px-5 py-8 sm:px-8 sm:py-12 lg:min-h-[90svh] lg:px-12">
        {/* Main Grid: Left Typography + Right 3D Visual Centerpiece */}
        <div className="grid flex-1 items-center gap-6 lg:grid-cols-12 lg:gap-8">
          
          {/* Left Column: Editorial Headline & Actions (5 cols) */}
          <div className="flex flex-col justify-center lg:col-span-5 pt-4 sm:pt-0 z-30">
            {/* Kicker with Gold Dash */}
            <div className="flex items-center gap-3">
              <span className="h-px w-5 bg-accent-gold" />
              <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-text-secondary sm:text-xs font-sans">
                {activeSlide.kicker}
              </span>
            </div>

            {/* Editorial Serif Headline */}
            <h1
              className={`mt-4 font-serif text-[44px] font-normal leading-[1.02] tracking-tight text-text-primary transition-all duration-500 sm:text-6xl md:text-7xl lg:text-[5.4rem] ${
                isTransitioning ? "opacity-40 translate-y-2" : "opacity-100 translate-y-0"
              }`}
            >
              <span className="block">{activeSlide.line1}</span>
              <span className="block">{activeSlide.line2}</span>
              <span className="block font-serif italic text-accent-gold font-normal mt-1 sm:mt-2">
                {activeSlide.italicEmphasis}
              </span>
            </h1>

            {/* Subtitle Description */}
            <p
              className={`mt-6 max-w-md text-sm leading-relaxed text-text-secondary transition-all duration-500 sm:text-base ${
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

            {/* Slider Pager Indicator (01 ─── 02 ─── 03 < >) */}
            <div className="mt-12 flex items-center gap-4 sm:mt-16">
              <div className="flex items-center gap-2.5 font-mono text-xs font-semibold tracking-wider text-text-muted">
                {HERO_SLIDES.map((slide, idx) => (
                  <React.Fragment key={slide.id}>
                    <button
                      type="button"
                      onClick={() => goToSlide(idx)}
                      className={`transition-colors cursor-pointer ${
                        currentSlideIndex === idx
                          ? "text-text-primary font-bold"
                          : "text-text-muted hover:text-text-secondary"
                      }`}
                      aria-label={`Go to slide ${slide.id}`}
                    >
                      0{slide.id}
                    </button>
                    {idx < HERO_SLIDES.length - 1 && (
                      <span className="h-px w-6 sm:w-8 bg-text-primary/20" />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Prev / Next Slider Arrows */}
              <div className="flex items-center gap-1.5 ml-4">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle bg-surface-white/80 text-text-primary transition-all hover:border-text-primary hover:bg-surface-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary cursor-pointer"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle bg-surface-white/80 text-text-primary transition-all hover:border-text-primary hover:bg-surface-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary cursor-pointer"
                  aria-label="Next slide"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Signature 3D Ribbon & Couture Model (7 cols) */}
          <div className="relative flex items-center justify-center lg:col-span-7 h-[420px] sm:h-[520px] lg:h-[620px] w-full">
            
            {/* Layer 1: INTERACTIVE 3D WEBGL METALLIC CHAMPAGNE RIBBON SCENE */}
            <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
              <Hero3DWrapper className="h-full w-full" />
            </div>

            {/* Layer 2: High-Fashion Couture Model Photography */}
            <div
              className={`relative z-20 h-full w-full flex items-center justify-center transition-all duration-700 ease-out ${
                isTransitioning ? "opacity-60 scale-98" : "opacity-100 scale-100"
              }`}
            >
              <div className="relative h-full w-full max-w-[560px]">
                <Image
                  src={activeSlide.imageSrc}
                  alt={activeSlide.imageAlt}
                  fill
                  priority
                  sizes="(max-width: 1024px) 95vw, 600px"
                  className="object-contain object-bottom sm:object-center drop-shadow-2xl transition-transform duration-1000 ease-out hover:scale-[1.02]"
                />
                
                {/* Soft ground gradient to blend model base into the warm ivory floor */}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#ECE3D5] via-[#ECE3D5]/40 to-transparent pointer-events-none" />
              </div>
            </div>

            {/* Vertical Branding Badge & Side Carousel Controls (Desktop only) */}
            <div className="absolute right-0 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-6 xl:flex z-30">
              <div className="flex flex-col items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-text-secondary select-none [writing-mode:vertical-lr]">
                <span>LUXURY FASHION</span>
                <span className="text-text-muted">FOR A MODERN YOU</span>
                <Sparkles className="mt-2 h-3.5 w-3.5 text-accent-gold rotate-90" />
              </div>

              <div className="flex flex-col gap-2 mt-4">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle bg-surface-white/90 text-text-primary shadow-xs transition-all hover:bg-text-primary hover:text-surface-white cursor-pointer"
                  aria-label="Previous editorial slide"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle bg-surface-white/90 text-text-primary shadow-xs transition-all hover:bg-text-primary hover:text-surface-white cursor-pointer"
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
