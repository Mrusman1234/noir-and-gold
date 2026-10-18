import React from "react";
import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { FaqAccordion } from "@/components/faq/FaqAccordion";
import { BRAND_NAME, OFFICIAL_WHATSAPP_LINK } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Frequently Asked Questions | ${BRAND_NAME}`,
  description:
    "Find answers regarding Cash on Delivery (COD), express shipping timelines, sizing guides, and 7-day doorstep exchanges across Pakistan.",
};

export default function FaqPage() {
  return (
    <div className="bg-canvas-bg min-h-screen py-12 sm:py-20 text-text-primary">
      <Container size="lg" className="space-y-12">
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-accent-gold block font-sans">
            Client Guidance
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-text-primary">
            Frequently Asked Questions
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
            Everything you need to know regarding ordering, Cash on Delivery, nationwide express dispatch, and doorstep fit guarantees.
          </p>
        </div>

        {/* Faq Accordion Component */}
        <FaqAccordion />

        {/* Still Have Questions Banner */}
        <div className="bg-surface-white border border-border-subtle rounded-2xl p-8 max-w-3xl mx-auto text-center space-y-4 shadow-xs">
          <h3 className="font-serif text-xl font-bold text-text-primary">
            Have a Specific Question?
          </h3>
          <p className="text-xs text-text-secondary max-w-md mx-auto">
            Our atelier client concierge is available Monday to Saturday to assist with bespoke orders, styling consultations, and custom requests.
          </p>
          <a
            href={OFFICIAL_WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-text-primary text-surface-white text-xs font-semibold tracking-wider hover:opacity-90 transition-opacity"
          >
            <span>Ask Concierge on WhatsApp</span>
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </Container>
    </div>
  );
}
