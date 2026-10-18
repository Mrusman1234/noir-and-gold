import React from "react";
import { Container } from "@/components/layout/Container";
import { OFFICIAL_WHATSAPP_LINK } from "@/lib/constants";

const trustFeatures = [
  {
    title: "Cash on Delivery",
    description: "Pay conveniently in PKR when your parcel arrives at your doorstep nationwide.",
  },
  {
    title: "Metropolitan Dispatch",
    description: "Priority 24–48 hour fulfillment for Karachi, Lahore, and Islamabad.",
  },
  {
    title: "Seven-Day Exchange",
    description: "Straightforward size and fit exchange after doorstep delivery.",
  },
  {
    title: "Atelier Concierge",
    description: "Direct WhatsApp support for sizing, tailoring guidance, and styling notes.",
    link: OFFICIAL_WHATSAPP_LINK,
  },
];

export function TrustFeaturesSection() {
  return (
    <section aria-label="Customer Care & Delivery Guarantees" className="bg-surface-white py-14 sm:py-20 border-b border-border-subtle">
      <Container size="xl">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          {trustFeatures.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col justify-between rounded-lg border border-border-subtle/80 bg-surface-subtle/50 p-6 transition-colors hover:border-border-hover hover:bg-surface-subtle"
            >
              <div>
                <p className="text-[11px] uppercase font-bold tracking-[0.18em] text-text-primary">
                  {feature.title}
                </p>
                <p className="mt-2.5 text-xs leading-5 text-text-secondary">
                  {feature.description}
                </p>
              </div>
              {feature.link && (
                <div className="mt-4 pt-3 border-t border-border-subtle/60">
                  <a
                    href={feature.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="editorial-link text-[11px] uppercase tracking-[0.14em] text-text-primary font-medium"
                  >
                    WhatsApp Concierge
                    <span aria-hidden="true">↗</span>
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
