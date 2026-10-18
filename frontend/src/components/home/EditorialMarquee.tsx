import React from "react";
import { Container } from "@/components/layout/Container";

const MARQUEE_ITEMS = [
  "Bespoke Couture",
  "Pure Handloom Silks",
  "Lahore Master Tailoring",
  "Cash on Delivery Nationwide",
  "7-Day Doorstep Exchange",
  "Artisanal Zari & Velvet",
];

export function EditorialMarquee() {
  return (
    <aside
      aria-label="Atelier Commitments"
      className="border-b border-border-subtle bg-surface-subtle/80 py-3.5 text-text-primary overflow-hidden"
    >
      <Container size="xl">
        <div className="flex items-center justify-between gap-6 text-[10px] sm:text-[11px] uppercase font-bold tracking-[0.22em] text-text-primary">
          {MARQUEE_ITEMS.map((item, index) => (
            <div key={item} className="flex items-center gap-6 whitespace-nowrap">
              <span>{item}</span>
              {index < MARQUEE_ITEMS.length - 1 && (
                <span className="text-accent-gold text-[8px]" aria-hidden="true">
                  ◆
                </span>
              )}
            </div>
          ))}
        </div>
      </Container>
    </aside>
  );
}
