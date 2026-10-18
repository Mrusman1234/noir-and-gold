import React, { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductListingView } from "@/components/products/ProductListingView";
import { CatalogLoadingSkeleton } from "@/components/products/CatalogLoadingSkeleton";

const VALID_CATEGORIES = ["women", "men"] as const;
type ValidCategory = (typeof VALID_CATEGORIES)[number];

function isValidCategory(category: string): category is ValidCategory {
  return VALID_CATEGORIES.includes(category as ValidCategory);
}

interface CategoryPageProps {
  params: Promise<{
    category: string;
  }>;
}

export function generateStaticParams() {
  return [
    { category: "women" },
    { category: "men" },
  ];
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;

  if (category === "women") {
    return {
      title: "Women's Prêt & Couture Collection",
      description:
        "Discover handcrafted women's luxury prêt, velvet anarkalis, raw silk suits, and couture ensembles by NOIR & GOLD in Pakistan.",
      openGraph: {
        title: "Women's Prêt & Couture Collection | NOIR & GOLD",
        description:
          "Discover handcrafted women's luxury prêt, velvet anarkalis, raw silk suits, and couture ensembles by NOIR & GOLD in Pakistan.",
      },
    };
  }

  if (category === "men") {
    return {
      title: "Men's Bespoke & Ceremonial Collection",
      description:
        "Explore bespoke men's sherwanis, prince coats, and luxury silk kurta ensembles tailored to royal perfection by NOIR & GOLD in Pakistan.",
      openGraph: {
        title: "Men's Bespoke & Ceremonial Collection | NOIR & GOLD",
        description:
          "Explore bespoke men's sherwanis, prince coats, and luxury silk kurta ensembles tailored to royal perfection by NOIR & GOLD in Pakistan.",
      },
    };
  }

  return {
    title: "Collection",
  };
}

import { readCatalogProducts } from "@/lib/catalog-read";

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;

  if (!isValidCategory(category)) {
    notFound();
  }

  const products = await readCatalogProducts({ audience: category });

  return (
    <Suspense fallback={<CatalogLoadingSkeleton category={category} />}>
      <ProductListingView initialCategory={category} initialProducts={products} />
    </Suspense>
  );
}
