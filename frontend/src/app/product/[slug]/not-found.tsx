import React from "react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";

export default function ProductNotFound() {
  return (
    <div className="bg-obsidian text-pearl min-h-[70vh] flex items-center py-16 sm:py-24">
      <Container size="sm" className="text-center space-y-6">
        <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gold-champagne block">
          Atelier Archive Notice
        </span>

        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-pearl tracking-tight">
          Garment Not Found
        </h1>

        <p className="text-xs sm:text-sm text-platinum leading-relaxed max-w-md mx-auto font-sans">
          The requested couture or prêt ensemble could not be located in our active boutique. It may have sold out, been moved to our seasonal archives, or is undergoing private atelier curation.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
          <Button href="/shop" variant="primary" size="lg" showArrow>
            Explore Active Catalog
          </Button>
          <Button href="/" variant="secondary" size="lg">
            Return to Homepage
          </Button>
        </div>
      </Container>
    </div>
  );
}
