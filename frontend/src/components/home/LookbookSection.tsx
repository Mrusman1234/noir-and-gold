import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";

interface CampaignCard {
  id: string;
  kicker: string;
  title: string;
  description: string;
  ctaText: string;
  href: string;
  imageUrl: string;
  imageAlt: string;
}

const CAMPAIGNS: CampaignCard[] = [
  {
    id: "campaign-women",
    kicker: "Editorial Campaign · Women",
    title: "Explore Women's Edits",
    description:
      "The Evening Line — Sculptural silhouettes, antique zardozi, and pure micro-velvet tailored for celebration.",
    ctaText: "Shop Women's Edit",
    href: "/shop/women",
    imageUrl: "/images/campaign/explore-women.jpg",
    imageAlt: "High fashion model in handcrafted velvet and silk evening ensemble",
  },
  {
    id: "campaign-men",
    kicker: "Editorial Campaign · Men",
    title: "Explore Men's Edits",
    description:
      "The Ceremonial Cut — Architectural sherwanis, structured prince coats, and pure handloom raw silks.",
    ctaText: "Shop Men's Edit",
    href: "/shop/men",
    imageUrl: "/images/campaign/explore-men.jpg",
    imageAlt: "Bespoke tailored groom in architectural ceremonial coat",
  },
];

export function LookbookSection() {
  return (
    <section
      aria-label="Editorial Campaigns"
      className="py-16 sm:py-24 bg-canvas-bg border-t border-border-subtle"
    >
      <Container size="xl">
        {/* Section Header */}
        <div className="mb-10 text-center sm:mb-14">
          <p className="mb-2 text-[10.5px] uppercase font-bold tracking-[0.24em] text-text-primary">
            Season 2026 Lookbook
          </p>
          <h2 className="font-serif text-3xl font-medium text-text-primary sm:text-5xl tracking-tight">
            Two distinct perspectives. One atelier standard.
          </h2>
        </div>

        {/* 2-Column Perfectly Balanced Cards in Container XL */}
        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2">
          {CAMPAIGNS.map((campaign) => (
            <article
              key={campaign.id}
              className="group relative flex flex-col justify-end overflow-hidden rounded-xl border border-border-subtle bg-surface-white min-h-[540px] sm:min-h-[600px] lg:min-h-[660px] transition-all duration-500 hover:shadow-xl hover:border-border-hover"
            >
              {/* Full Background Fashion Photography */}
              <div className="absolute inset-0 z-0">
                <Image
                  src={campaign.imageUrl}
                  alt={campaign.imageAlt}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-104"
                />
                {/* Refined gradient scrim: covers ONLY bottom 55% so face and upper styling remain completely bright */}
                <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-500 group-hover:from-black/95 pointer-events-none" />
              </div>

              {/* Aligned Editorial Content Overlay */}
              <div className="relative z-10 flex flex-col items-start p-7 sm:p-10 lg:p-14">
                <span className="text-[10px] uppercase font-bold tracking-[0.24em] text-[#FFFFFF] drop-shadow-xs">
                  {campaign.kicker}
                </span>

                <h3 className="mt-2.5 font-serif text-3xl font-medium leading-tight text-surface-white sm:text-4xl lg:text-5xl tracking-tight drop-shadow-xs">
                  <Link
                    href={campaign.href}
                    className="focus-visible:outline-none focus-visible:underline"
                  >
                    {campaign.title}
                  </Link>
                </h3>

                <p className="mt-3.5 max-w-md text-xs leading-6 text-[#FAF7F2] font-normal sm:text-sm drop-shadow-xs">
                  {campaign.description}
                </p>

                <div className="mt-7">
                  <Button
                    href={campaign.href}
                    variant="secondary"
                    size="md"
                    showArrow
                    className="bg-surface-white text-text-primary hover:bg-[#F3EFEA] border-0 shadow-md font-bold px-6 py-3 rounded-full text-xs uppercase tracking-wider"
                  >
                    {campaign.ctaText}
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
