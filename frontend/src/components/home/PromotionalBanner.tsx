"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/layout/Container";

export function PromotionalBanner() {
  return (
    <section
      aria-label="Limited Time Offer Banner"
      className="py-12 sm:py-16 bg-canvas-bg"
    >
      <Container size="xl">
        <div className="relative overflow-hidden rounded-2xl bg-text-primary text-surface-white shadow-xl">
          {/* Subtle Background Photography Texture with dark overlay */}
          <div className="absolute inset-0 z-0 opacity-25">
            <Image
              src="/images/campaign/editorial-atelier.jpg"
              alt="Artisanal embroidery detail"
              fill
              sizes="100vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#181614] via-[#181614]/85 to-transparent" />
          </div>

          {/* Banner Content */}
          <div className="relative z-10 flex flex-col justify-between gap-6 px-6 py-10 sm:px-12 sm:py-14 md:flex-row md:items-center">
            <div className="max-w-xl">
              <span className="inline-block text-[10.5px] uppercase font-semibold tracking-[0.24em] text-accent-gold sm:text-xs">
                Limited Time Offer
              </span>
              <h2 className="mt-2 font-serif text-3xl font-medium tracking-tight sm:text-4xl lg:text-5xl text-surface-white">
                Up to 40% Off
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-surface-white/75 leading-relaxed font-sans max-w-md">
                Experience heritage luxury craftsmanship at exceptional value.
                Complimentary nationwide courier dispatch on all orders.
              </p>
            </div>

            {/* Circular Arrow Action */}
            <div className="flex items-center gap-4">
              <Link
                href="/shop?sort=discount"
                className="group flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-surface-white/20 bg-surface-white/10 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-accent-gold hover:bg-accent-gold hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold"
                aria-label="Explore Limited Time Offers"
              >
                <span
                  className="text-lg transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden="true"
                >
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
