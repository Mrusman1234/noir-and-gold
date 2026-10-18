import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

export function HeroSection() {
  return (
    <section
      aria-label="Campaign Hero"
      className="relative isolate min-h-[62svh] overflow-hidden bg-surface-subtle lg:min-h-[72svh]"
    >
      {/* Background Editorial Visual with Zero Muddy Smoke */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/campaign/hero-editorial.jpg"
          alt="NOIR & GOLD modern editorial fashion campaign"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[68%_20%] sm:object-[72%_22%] animate-image-reveal animate-ken-burns"
        />
        {/* Minimal soft side scrim — leaves the fashion imagery crisp, bright, and vibrant */}
        <div className="absolute inset-y-0 left-0 w-full sm:w-[42%] bg-gradient-to-r from-canvas-bg/60 via-canvas-bg/15 to-transparent pointer-events-none" />
      </div>

      {/* Editorial Content Overlay */}
      <div className="relative z-10 mx-auto flex min-h-[62svh] w-full max-w-7xl flex-col justify-center px-5 py-12 sm:px-8 lg:min-h-[72svh] lg:px-12">
        <div className="max-w-lg lg:max-w-xl">
          <p className="animate-fade-up mb-4 inline-flex items-center gap-3 text-[10.5px] uppercase tracking-[0.24em] font-semibold text-text-secondary sm:text-xs">
            <span className="h-px w-6 bg-border-hover" />
            Seasonal Atelier Collection · 2026
          </p>

          <h1 className="animate-fade-up-delay-1 font-serif text-5xl font-medium leading-[0.96] text-text-primary sm:text-7xl lg:text-[5.25rem] tracking-tight">
            STYLE THAT
            <span className="mt-1 block italic font-normal text-text-secondary">SPEAKS.</span>
          </h1>

          <p className="animate-fade-up-delay-2 mt-5 max-w-md text-sm leading-6 text-text-secondary sm:text-base">
            Discover considered essentials and contemporary styles made for every day.
            Tailored in Pakistan with Cash on Delivery nationwide.
          </p>

          <div className="animate-fade-up-delay-3 mt-8 flex flex-col items-start gap-3.5 sm:flex-row sm:items-center sm:gap-4">
            <Button href="/shop/women" variant="primary" size="lg" showArrow>
              Shop Women
            </Button>
            <Button href="/shop/men" variant="secondary" size="lg" showArrow>
              Shop Men
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
