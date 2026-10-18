import React from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { EditorialMarquee } from "@/components/home/EditorialMarquee";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { FeaturedSection } from "@/components/home/FeaturedSection";
import { LookbookSection } from "@/components/home/LookbookSection";
import { BrandStorySection } from "@/components/home/BrandStorySection";
import { TrustFeaturesSection } from "@/components/home/TrustFeaturesSection";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { FinalCtaSection } from "@/components/home/FinalCtaSection";

export default function HomePage() {
  return (
    <div className="flex flex-col w-full bg-canvas-bg text-text-primary">
      {/* 1. High-Impact Editorial Fashion Hero */}
      <HeroSection />

      {/* 2. Artisanal atelier trust & craft marquee ribbon */}
      <EditorialMarquee />

      {/* 3. Men's and Women's Category Showcase */}
      <CategoryShowcase />

      {/* 4. Featured Collection & New Arrivals Grid */}
      <FeaturedSection />

      {/* 5. Explore Women's & Men's Edits */}
      <LookbookSection />

      {/* 4. Atelier Craftsmanship & Brand Story */}
      <BrandStorySection />

      {/* 5. Regional Trust, COD & Fulfillment Guarantees */}
      <TrustFeaturesSection />

      {/* 6. Atelier Gazette Newsletter Circle */}
      <NewsletterSection />

      {/* 7. Final Master Catalog Call to Action */}
      <FinalCtaSection />
    </div>
  );
}
