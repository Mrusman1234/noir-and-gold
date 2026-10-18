import React from "react";
import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { ContactForm } from "@/components/contact/ContactForm";
import {
  BRAND_NAME,
  OFFICIAL_WHATSAPP_LINK,
  OFFICIAL_EMAIL,
  OFFICIAL_PHONE,
} from "@/lib/constants";

export const metadata: Metadata = {
  title: `Client Care & Concierge | ${BRAND_NAME}`,
  description:
    "Connect with our fashion advisors and client concierge for order inquiries, bespoke appointments, and domestic Cash on Delivery assistance in Pakistan.",
};

export default function ContactPage() {
  return (
    <div className="bg-canvas-bg min-h-screen py-12 sm:py-20 text-text-primary">
      <Container size="lg" className="space-y-12 sm:space-y-16">
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-accent-gold block font-sans">
            Client Relations
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-text-primary">
            Connect with the Atelier
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
            Whether inquiring about order status, personal styling, or booking a private salon consultation, our client concierge is at your service.
          </p>
        </div>

        {/* 2-Column: Direct Channels & Interactive Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Direct Concierge Channels */}
          <div className="lg:col-span-5 space-y-6">
            {/* Instant WhatsApp Card */}
            <div className="bg-surface-white border border-border-subtle rounded-2xl p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💬</span>
                <div>
                  <h3 className="font-serif text-base font-bold text-text-primary">
                    Instant WhatsApp Concierge
                  </h3>
                  <p className="text-[11px] text-text-secondary">
                    Average response: under 15 minutes
                  </p>
                </div>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Chat directly with our styling team for size guidance, live fabric videos, and instant delivery updates.
              </p>
              <a
                href={OFFICIAL_WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-full bg-text-primary text-surface-white text-xs font-semibold tracking-wider hover:opacity-90 transition-opacity"
              >
                <span>Open WhatsApp Chat</span>
                <span aria-hidden="true">↗</span>
              </a>
            </div>

            {/* Direct Contact Details */}
            <div className="bg-surface-white border border-border-subtle rounded-2xl p-6 shadow-xs space-y-4 text-xs font-sans">
              <h3 className="font-serif text-base font-bold text-text-primary border-b border-border-subtle pb-2">
                Direct Atelier Channels
              </h3>

              <div className="space-y-3">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-text-secondary tracking-wider block">
                    Electronic Mail
                  </span>
                  <a
                    href={`mailto:${OFFICIAL_EMAIL}`}
                    className="text-text-primary font-medium hover:underline text-sm"
                  >
                    {OFFICIAL_EMAIL}
                  </a>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-text-secondary tracking-wider block">
                    Phone Concierge
                  </span>
                  <a
                    href={`tel:${OFFICIAL_PHONE.replace(/\s+/g, "")}`}
                    className="text-text-primary font-medium hover:underline text-sm"
                  >
                    {OFFICIAL_PHONE}
                  </a>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-text-secondary tracking-wider block">
                    Operating Hours
                  </span>
                  <p className="text-text-secondary leading-relaxed">
                    Monday to Saturday: 10:00 AM – 7:00 PM PKT<br />
                    Sunday: Digital inquiries via WhatsApp only
                  </p>
                </div>
              </div>
            </div>

            {/* Flagship Salon Addresses */}
            <div className="bg-surface-white border border-border-subtle rounded-2xl p-6 shadow-xs space-y-3 text-xs font-sans">
              <h3 className="font-serif text-base font-bold text-text-primary border-b border-border-subtle pb-2">
                Flagship Studio Addresses
              </h3>
              <div className="space-y-2 text-text-secondary">
                <p>
                  <strong className="text-text-primary">Karachi:</strong> Plot 12-C, 7th Commercial Lane, Block 4, Clifton
                </p>
                <p>
                  <strong className="text-text-primary">Lahore:</strong> M.M. Alam Road, Gulberg III
                </p>
                <p>
                  <strong className="text-text-primary">Islamabad:</strong> College Road, Sector F-7/2
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Inquiry Form */}
          <div className="lg:col-span-7">
            <ContactForm />
          </div>
        </div>
      </Container>
    </div>
  );
}
