import React from "react";
import Image from "next/image";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { BRAND_NAME } from "@/lib/constants";

const CRAFT_METRICS = [
  { value: "180″", label: "Flared Anarkali Hemline" },
  { value: "100%", label: "Pure Handloom Raw Silk" },
  { value: "9000", label: "Micro-Velvet Density" },
  { value: "24–48h", label: "Major Metro Dispatch" },
];

export function BrandStorySection() {
  return (
    <section
      aria-label="Atelier Craftsmanship and Story"
      className="border-b border-border-subtle bg-surface-subtle py-18 sm:py-28"
    >
      <Container size="xl">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-16">
          {/* Editorial Photography */}
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-border-subtle bg-surface-white lg:col-span-6 lg:aspect-[5/6] shadow-md">
            <Image
              src="/images/campaign/editorial-atelier.jpg"
              alt="Artisanal handworked textile and tailoring in Pakistan"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>

          {/* Narrative Content */}
          <div className="lg:col-span-6 lg:pl-4">
            <p className="mb-3 text-[10.5px] uppercase font-bold tracking-[0.24em] text-text-primary">
              The Atelier Story
            </p>
            <h2 className="font-serif text-3xl font-medium leading-[1.1] tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
              Cut in silence.
              <span className="mt-1 block italic font-normal text-text-secondary">
                Finished with precision.
              </span>
            </h2>
            <p className="mt-5 max-w-xl text-xs leading-6 text-text-secondary sm:text-sm">
              {BRAND_NAME} is founded on architectural tailoring: high-density micro-velvets,
              pure raw silks, and hand-embellished zari crafted for weddings, evening
              occasions, and Pakistan&apos;s most considered contemporary wardrobes.
            </p>
            <p className="mt-3.5 max-w-xl text-xs leading-6 text-text-secondary sm:text-sm">
              Each piece is created with master craftsmanship by Lahore artisans, priced transparently
              in PKR, and delivered nationwide with trusted Cash on Delivery.
            </p>

            {/* Craftsmanship Metrics */}
            <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-4 border-y border-border-subtle py-6">
              {CRAFT_METRICS.map((metric) => (
                <div key={metric.label}>
                  <div className="font-serif text-2xl font-medium text-text-primary sm:text-3xl">
                    {metric.value}
                  </div>
                  <div className="mt-1 text-[9.5px] uppercase font-bold tracking-[0.16em] text-text-secondary">
                    {metric.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 sm:mt-10">
              <Button href="/shop" variant="secondary" size="md" showArrow>
                Read Seasonal Edit
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
