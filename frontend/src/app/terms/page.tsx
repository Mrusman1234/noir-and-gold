import React from "react";
import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { BRAND_NAME, COPYRIGHT_YEAR } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Terms of Service | ${BRAND_NAME}`,
  description:
    "Official terms and conditions governing online shopping, Cash on Delivery orders, and intellectual property for NOIR & GOLD.",
};

export default function TermsPage() {
  return (
    <div className="bg-canvas-bg min-h-screen py-12 sm:py-20 text-text-primary">
      <Container size="md" className="space-y-10">
        <div className="text-center space-y-3 pb-6 border-b border-border-subtle">
          <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-accent-gold block font-sans">
            Legal &amp; Governance
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-text-primary">
            Terms of Service
          </h1>
          <p className="text-xs text-text-secondary">
            Last Updated: October {COPYRIGHT_YEAR} · Operating under the laws of Pakistan
          </p>
        </div>

        <div className="bg-surface-white border border-border-subtle rounded-2xl p-6 sm:p-10 shadow-xs space-y-8 text-xs sm:text-sm text-text-secondary leading-relaxed font-sans">
          <section className="space-y-2">
            <h2 className="font-serif text-base sm:text-lg font-bold text-text-primary">
              1. General Principles
            </h2>
            <p>
              By accessing or purchasing from {BRAND_NAME}, you agree to be bound by these Terms of Service. These terms apply to all visitors, shoppers, and clients placing Cash on Delivery or bespoke inquiries.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-base sm:text-lg font-bold text-text-primary">
              2. Product Descriptions &amp; Handcraft Variations
            </h2>
            <p>
              Our garments are produced using natural raw fibers, handloom chanderi, and manual artisan finishes. Slight variations in fabric weave texture, yarn slub, or natural dye saturation are celebrated signatures of artisanal integrity rather than manufacturing defects.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-base sm:text-lg font-bold text-text-primary">
              3. Cash on Delivery (COD) Commitments
            </h2>
            <p>
              When placing a Cash on Delivery order, you agree to receive the parcel at the designated shipping address and settle the exact payable PKR total upon courier presentation. Malicious or fraudulent repeated order refusals may lead to address suspension across domestic courier networks.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-base sm:text-lg font-bold text-text-primary">
              4. Pricing &amp; Currency
            </h2>
            <p>
              All listed prices are denominated in Pakistani Rupees (PKR) and include all domestic manufacturing taxes. Shipping fees are computed and itemized at checkout prior to order submission.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-base sm:text-lg font-bold text-text-primary">
              5. Intellectual Property
            </h2>
            <p>
              All editorial imagery, garment pattern silhouettes, typography, and brand marks associated with {BRAND_NAME} are protected under copyright and trademark legislation in the Islamic Republic of Pakistan.
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
}
