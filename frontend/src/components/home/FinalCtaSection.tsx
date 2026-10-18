import React from "react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";

export function FinalCtaSection() {
  return (
    <section aria-label="Catalog Invitation" className="bg-canvas-bg py-16 sm:py-24 border-t border-border-subtle">
      <Container size="xl">
        <div className="relative overflow-hidden rounded-2xl border border-border-subtle bg-surface-white px-6 py-16 sm:px-12 sm:py-20 text-center shadow-xs">
          <div className="mx-auto max-w-2xl">
            <p className="mb-3 text-[10.5px] uppercase font-bold tracking-[0.24em] text-text-secondary">
              Ready-to-Wear &amp; Bespoke Ceremony
            </p>
            <h2 className="font-serif text-3xl font-medium leading-[1.08] tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
              Enter the atelier.
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-xs leading-6 text-text-secondary sm:text-sm">
              Curated women&apos;s prêt, structured ceremonial menswear, and embroidered velvets
              — transparently priced in PKR, delivered across Pakistan with Cash on Delivery.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row sm:mt-10">
              <Button href="/shop" variant="primary" size="lg" showArrow>
                Explore All Garments
              </Button>
              <Button href="/shop/men" variant="secondary" size="lg" showArrow>
                Shop Men&apos;s Edit
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
