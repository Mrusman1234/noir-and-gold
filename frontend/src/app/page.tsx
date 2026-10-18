import React from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { CategoryBar } from "@/components/home/CategoryBar";
import { FeaturedSection } from "@/components/home/FeaturedSection";
import { PromotionalBanner } from "@/components/home/PromotionalBanner";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { LookbookSection } from "@/components/home/LookbookSection";
import { BrandStorySection } from "@/components/home/BrandStorySection";
import { TrustFeaturesSection } from "@/components/home/TrustFeaturesSection";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { FinalCtaSection } from "@/components/home/FinalCtaSection";

export default function HomePage() {
  return (
    <div className="flex flex-col w-full bg-canvas-bg text-text-primary">
      {/* 1. Signature 3D Luxury Fashion Hero with Metallic Ribbon */}
      <HeroSection />

      {/* 2. 4-Department Quick Access Strip (Women, Men, Accessories, Couture) */}
      <CategoryBar />

      {/* 3. Featured Collection / Our Best Sellers Grid */}
      <FeaturedSection />

      {/* 4. Luxury Contrast Promotional Banner (Up to 40% Off) */}
      <PromotionalBanner />

      {/* 5. Comprehensive Department Showcase & Editorial Tiles */}
      <CategoryShowcase />

      {/* 6. Explore Women's & Men's Editorial Lookbook */}
      <LookbookSection />

      {/* 7. Atelier Heritage & Craftsmanship Story */}
      <BrandStorySection />

      {/* 8. Regional Trust, Nationwide COD & Fulfillment Guarantees */}
      <TrustFeaturesSection />

      {/* 9. Atelier Gazette Circle */}
      <NewsletterSection />

      {/* 10. Master Catalog Call to Action */}
      <FinalCtaSection />
    </div>
  );
}
