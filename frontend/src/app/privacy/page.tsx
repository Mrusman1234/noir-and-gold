import React from "react";
import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { BRAND_NAME, COPYRIGHT_YEAR } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Privacy & Data Protection | ${BRAND_NAME}`,
  description:
    "Learn how NOIR & GOLD protects customer delivery addresses, contact information, and order confidentiality in Pakistan.",
};

export default function PrivacyPage() {
  return (
    <div className="bg-canvas-bg min-h-screen py-12 sm:py-20 text-text-primary">
      <Container size="md" className="space-y-10">
        <div className="text-center space-y-3 pb-6 border-b border-border-subtle">
          <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-accent-gold block font-sans">
            Client Confidentiality
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-text-primary">
            Privacy Policy
          </h1>
          <p className="text-xs text-text-secondary">
            Last Updated: October {COPYRIGHT_YEAR} · Secure Domestic Operations
          </p>
        </div>

        <div className="bg-surface-white border border-border-subtle rounded-2xl p-6 sm:p-10 shadow-xs space-y-8 text-xs sm:text-sm text-text-secondary leading-relaxed font-sans">
          <section className="space-y-2">
            <h2 className="font-serif text-base sm:text-lg font-bold text-text-primary">
              1. Information We Collect
            </h2>
            <p>
              When you place an order with {BRAND_NAME}, we collect solely the information essential to fulfill your purchase: your full name, recipient delivery address in Pakistan, mobile phone number for courier coordination and SMS tracking, and optional email address.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-base sm:text-lg font-bold text-text-primary">
              2. How Your Data Is Utilized
            </h2>
            <p>
              Your contact details are used exclusively for:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Order reservation and atelier preparation</li>
              <li>SMS verification and real-time delivery notifications</li>
              <li>Domestic courier dispatch and doorstep Cash on Delivery collection</li>
              <li>Customer care and exchange coordination via WhatsApp or email</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-base sm:text-lg font-bold text-text-primary">
              3. Courier Data Sharing
            </h2>
            <p>
              We share your delivery coordinates only with verified domestic courier partners (such as TCS, Leopards, or Call Courier) to complete physical package transport. We strictly never sell, rent, or monetize customer data to third-party marketing networks.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-base sm:text-lg font-bold text-text-primary">
              4. Security &amp; Order Tokens
            </h2>
            <p>
              Order lookups and sensitive invoice details are secured using cryptographic HMAC tokens. No unauthorized third party can view your delivery coordinates without your unique private order token.
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
}
