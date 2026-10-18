import React from "react";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import {
  BRAND_NAME,
  BRAND_TAGLINE,
  BRAND_DESCRIPTION,
  COPYRIGHT_YEAR,
  OFFICIAL_EMAIL,
  OFFICIAL_WHATSAPP_LINK,
} from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-surface-subtle text-text-secondary">
      <div className="py-14 sm:py-20">
        <Container size="xl">
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1fr] lg:gap-16">
            {/* Brand Statement */}
            <div className="col-span-2 border-b border-border-subtle pb-8 sm:col-span-2 lg:col-span-1 lg:border-0 lg:pb-0">
              <span className="block font-serif text-xl uppercase tracking-[0.18em] text-text-primary sm:text-2xl">
                {BRAND_NAME}
              </span>
              <span className="mt-2 block text-[10px] uppercase tracking-[0.24em] text-text-secondary">
                {BRAND_TAGLINE}
              </span>
              <p className="mt-4 max-w-sm text-xs leading-6 text-text-secondary">
                {BRAND_DESCRIPTION}
              </p>
              <a
                href={OFFICIAL_WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="editorial-link mt-5 text-xs text-text-primary font-medium"
              >
                WhatsApp Concierge
                <span aria-hidden="true">↗</span>
              </a>
            </div>

            {/* Navigation Columns */}
            <div>
              <h3 className="mb-4 text-[11px] uppercase font-bold tracking-[0.18em] text-text-primary">
                Collections
              </h3>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <Link href="/shop/women" className="hover:text-text-primary transition-colors">
                    Women&apos;s Prêt &amp; Couture
                  </Link>
                </li>
                <li>
                  <Link href="/shop/men" className="hover:text-text-primary transition-colors">
                    Men&apos;s Bespoke &amp; Formal
                  </Link>
                </li>
                <li>
                  <Link href="/shop?sort=newest" className="hover:text-text-primary transition-colors">
                    New Arrivals
                  </Link>
                </li>
                <li>
                  <Link href="/shop" className="hover:text-text-primary transition-colors">
                    Complete Seasonal Edit
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-[11px] uppercase font-bold tracking-[0.18em] text-text-primary">
                Client Care
              </h3>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <Link href="/track-order" className="hover:text-text-primary transition-colors">
                    Track Your Order
                  </Link>
                </li>
                <li>
                  <Link href="/shipping-policy" className="hover:text-text-primary transition-colors">
                    Nationwide Shipping &amp; COD
                  </Link>
                </li>
                <li>
                  <Link href="/returns" className="hover:text-text-primary transition-colors">
                    7-Day Doorstep Exchange
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-text-primary transition-colors">
                    Frequently Asked Questions
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-[11px] uppercase font-bold tracking-[0.18em] text-text-primary">
                The Atelier
              </h3>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <Link href="/about" className="hover:text-text-primary transition-colors">
                    Heritage &amp; Craftsmanship
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-text-primary transition-colors">
                    Salons &amp; Inquiries
                  </Link>
                </li>
                <li>
                  <a
                    href={`mailto:${OFFICIAL_EMAIL}`}
                    className="hover:text-text-primary transition-colors font-medium text-text-primary"
                  >
                    {OFFICIAL_EMAIL}
                  </a>
                </li>
                <li className="pt-2">
                  <Link
                    href="/admin"
                    className="text-[10px] uppercase tracking-[0.16em] text-text-secondary hover:text-text-primary"
                  >
                    Operations Management Portal →
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </div>

      <div className="border-t border-border-subtle py-5 bg-surface-white">
        <Container size="lg">
          <div className="flex flex-col items-center justify-between gap-3 text-[11px] tracking-[0.12em] text-text-secondary sm:flex-row">
            <p>
              © {COPYRIGHT_YEAR} {BRAND_NAME}. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-[10px] uppercase tracking-wider">
              <Link href="/privacy" className="hover:text-text-primary transition-colors">
                Privacy Policy
              </Link>
              <span>·</span>
              <Link href="/terms" className="hover:text-text-primary transition-colors">
                Terms of Service
              </Link>
              <span>·</span>
              <span className="font-medium text-text-primary">Cash on Delivery (PKR)</span>
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
}
