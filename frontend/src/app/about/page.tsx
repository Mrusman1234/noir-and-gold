import React from "react";
import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { BRAND_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `About the Atelier | ${BRAND_NAME}`,
  description:
    "Discover the heritage, textile craftsmanship, and quiet luxury philosophy behind NOIR & GOLD couture and prêt-à-porter in Pakistan.",
};

export default function AboutPage() {
  return (
    <div className="bg-canvas-bg min-h-screen py-12 sm:py-20 text-text-primary">
      <Container size="lg" className="space-y-16 sm:space-y-24">
        {/* Hero Section */}
        <section className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-accent-gold block font-sans">
            The Atelier &amp; Heritage
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary leading-[1.15]">
            A Study in Subtlety, Drape &amp; Pakistani Craftsmanship
          </h1>
          <p className="text-sm sm:text-base text-text-secondary font-sans leading-relaxed pt-2">
            Founded with an uncompromising commitment to pure indigenous textiles, {BRAND_NAME} creates modern heirloom silhouettes designed for the discerning wardrobe.
          </p>
        </section>

        {/* Brand Philosophy Pull Quote */}
        <section className="bg-surface-white border border-border-subtle rounded-3xl p-8 sm:p-14 shadow-xs text-center space-y-6">
          <span className="text-3xl text-accent-gold font-serif">“</span>
          <blockquote className="font-serif text-xl sm:text-3xl font-medium text-text-primary max-w-2xl mx-auto leading-relaxed">
            We do not chase transient seasons. We craft quiet, architectural garments in fabrics that breathe, soften with age, and outlive the moment.
          </blockquote>
          <div className="pt-2">
            <span className="text-xs uppercase tracking-[0.2em] font-semibold text-text-primary block font-sans">
              Atelier Creative Direction
            </span>
            <span className="text-[11px] text-text-secondary uppercase tracking-widest font-sans">
              Karachi · Lahore · Islamabad
            </span>
          </div>
        </section>

        {/* 3 Pillars Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-surface-white border border-border-subtle rounded-2xl p-7 shadow-xs space-y-4">
            <span className="text-[11px] font-mono text-accent-gold font-semibold uppercase tracking-wider block">
              01 / Heritage Textiles
            </span>
            <h3 className="font-serif text-xl font-bold text-text-primary">
              Pure Natural Fibers
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Every yard of raw silk, handspun chanderi cotton, and winter pashmina is ethically sourced directly from heritage weaving clusters across Multan, Bahawalpur, and northern Pakistan.
            </p>
          </div>

          <div className="bg-surface-white border border-border-subtle rounded-2xl p-7 shadow-xs space-y-4">
            <span className="text-[11px] font-mono text-accent-gold font-semibold uppercase tracking-wider block">
              02 / Master Tailoring
            </span>
            <h3 className="font-serif text-xl font-bold text-text-primary">
              Single-Needle Precision
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Our master cutters bring decades of Savile Row and subcontinental couture discipline. Ensembles feature hand-rolled French seams, hidden plackets, and natural mother-of-pearl closures.
            </p>
          </div>

          <div className="bg-surface-white border border-border-subtle rounded-2xl p-7 shadow-xs space-y-4">
            <span className="text-[11px] font-mono text-accent-gold font-semibold uppercase tracking-wider block">
              03 / Conscious Small Batches
            </span>
            <h3 className="font-serif text-xl font-bold text-text-primary">
              Zero Waste Surplus
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              We reject industrial fast-fashion surplus. Each edition is produced in limited series of 50 to 100 pieces, safeguarding artisan dignity and guaranteeing wardrobe uniqueness.
            </p>
          </div>
        </section>

        {/* The Atelier Studios */}
        <section className="bg-surface-subtle/50 border border-border-subtle rounded-3xl p-8 sm:p-12 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-accent-gold block font-sans">
              Physical Salons &amp; Studios
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-text-primary">
              Visit Our Private Salons
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary max-w-lg mx-auto">
              Experience the weight, drape, and tactile richness of our garments in person by private appointment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center sm:text-left">
            <div className="bg-surface-white border border-border-subtle rounded-2xl p-6 shadow-xs space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-text-primary block">
                Karachi Atelier &amp; Studio
              </span>
              <p className="text-xs text-text-secondary leading-relaxed">
                Plot 12-C, 7th Commercial Lane, Block 4, Clifton, Karachi
              </p>
              <p className="text-[11px] font-mono text-accent-gold pt-1">
                Mon – Sat: 11:00 AM – 8:00 PM PKT
              </p>
            </div>

            <div className="bg-surface-white border border-border-subtle rounded-2xl p-6 shadow-xs space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-text-primary block">
                Lahore Private Salon
              </span>
              <p className="text-xs text-text-secondary leading-relaxed">
                M.M. Alam Road, Gulberg III, Lahore
              </p>
              <p className="text-[11px] font-mono text-accent-gold pt-1">
                Mon – Sat: 11:30 AM – 8:30 PM PKT
              </p>
            </div>

            <div className="bg-surface-white border border-border-subtle rounded-2xl p-6 shadow-xs space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-text-primary block">
                Islamabad Concierge Studio
              </span>
              <p className="text-xs text-text-secondary leading-relaxed">
                College Road, Sector F-7/2, Islamabad
              </p>
              <p className="text-[11px] font-mono text-accent-gold pt-1">
                Mon – Sat: 11:00 AM – 7:30 PM PKT
              </p>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="text-center space-y-6 pt-6">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-text-primary">
            Explore the Current Seasonal Edit
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button href="/shop" variant="primary" size="lg" showArrow>
              Shop All Ensembles
            </Button>
            <Button href="/contact" variant="secondary" size="lg">
              Contact Concierge
            </Button>
          </div>
        </section>
      </Container>
    </div>
  );
}
