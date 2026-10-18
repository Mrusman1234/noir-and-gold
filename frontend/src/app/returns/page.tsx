import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import {
  BRAND_NAME,
  OFFICIAL_WHATSAPP_LINK,
  OFFICIAL_EMAIL,
} from "@/lib/constants";

export const metadata: Metadata = {
  title: `7-Day Doorstep Exchange Policy | ${BRAND_NAME}`,
  description:
    "Experience seamless size and fit exchanges across Pakistan with our signature 7-day doorstep replacement service.",
};

export default function ReturnsPage() {
  return (
    <div className="bg-canvas-bg min-h-screen py-12 sm:py-20 text-text-primary">
      <Container size="md" className="space-y-12">
        {/* Header */}
        <div className="text-center space-y-3 pb-6 border-b border-border-subtle">
          <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-accent-gold block font-sans">
            Fit Assurance &amp; Satisfaction
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-text-primary">
            7-Day Doorstep Exchange Policy
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-lg mx-auto">
            We want your {BRAND_NAME} ensembles to fit immaculately. If a garment requires an adjustment in size, we make exchanging effortless.
          </p>
        </div>

        {/* 3 Step Process */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-white border border-border-subtle rounded-2xl p-6 shadow-xs space-y-2">
            <span className="text-xs font-mono font-bold text-accent-gold block">
              STEP 01
            </span>
            <h3 className="font-serif text-base font-bold text-text-primary">
              Notify Concierge
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Message us on WhatsApp or email (<a href={`mailto:${OFFICIAL_EMAIL}`} className="text-text-primary underline font-medium">{OFFICIAL_EMAIL}</a>) within 7 days of receiving your order with your order reference and desired size.
            </p>
          </div>

          <div className="bg-surface-white border border-border-subtle rounded-2xl p-6 shadow-xs space-y-2">
            <span className="text-xs font-mono font-bold text-accent-gold block">
              STEP 02
            </span>
            <h3 className="font-serif text-base font-bold text-text-primary">
              Atelier Reservation
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Our atelier reserves your new size immediately and packages it in an express exchange shipment.
            </p>
          </div>

          <div className="bg-surface-white border border-border-subtle rounded-2xl p-6 shadow-xs space-y-2">
            <span className="text-xs font-mono font-bold text-accent-gold block">
              STEP 03
            </span>
            <h3 className="font-serif text-base font-bold text-text-primary">
              Doorstep Swap
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Our courier rider hands you the replacement piece and collects the original unworn garment at your door.
            </p>
          </div>
        </div>

        {/* Eligibility Guidelines */}
        <div className="bg-surface-white border border-border-subtle rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
          <h2 className="font-serif text-xl font-bold text-text-primary border-b border-border-subtle pb-3">
            Garment Eligibility Guidelines
          </h2>
          <div className="text-xs sm:text-sm text-text-secondary space-y-3 leading-relaxed">
            <p>
              • <strong className="text-text-primary">Tags Intact:</strong> Garments must have all original atelier hangtags, security ribbons, and packaging intact.
            </p>
            <p>
              • <strong className="text-text-primary">Unworn &amp; Unaltered:</strong> Items must be completely unwashed, free from perfume, makeup marks, deodorant stains, and alterations.
            </p>
            <p>
              • <strong className="text-text-primary">Timeline:</strong> The exchange request must be initiated within 7 calendar days from the date of confirmed delivery.
            </p>
            <p>
              • <strong className="text-text-primary">Bespoke Couture:</strong> Custom bridal orders, personalized embroideries, and custom-tailored alterations are handcrafted to individual specifications and are not eligible for standard size swap.
            </p>
          </div>
        </div>

        {/* Action Banner */}
        <div className="bg-surface-white border border-border-subtle rounded-2xl p-8 text-center space-y-4 shadow-xs">
          <h3 className="font-serif text-xl font-bold text-text-primary">
            Ready to Request an Exchange?
          </h3>
          <p className="text-xs text-text-secondary max-w-md mx-auto">
            Our client concierge team will facilitate your exchange within minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <a
              href={`${OFFICIAL_WHATSAPP_LINK}?text=${encodeURIComponent(
                "Hello, I would like to request an exchange for my NOIR & GOLD order."
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-text-primary text-surface-white text-xs font-semibold tracking-wider hover:opacity-90 transition-opacity"
            >
              <span>Initiate Exchange via WhatsApp</span>
              <span aria-hidden="true">↗</span>
            </a>
            <Link
              href="/track-order"
              className="text-xs text-text-secondary hover:text-text-primary font-medium underline"
            >
              Check Order Details First
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
