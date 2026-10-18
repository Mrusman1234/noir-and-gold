import React, { Suspense } from "react";
import type { Metadata } from "next";
import { ProductListingView } from "@/components/products/ProductListingView";
import { CatalogLoadingSkeleton } from "@/components/products/CatalogLoadingSkeleton";

import { readCatalogProducts } from "@/lib/catalog-read";

export const metadata: Metadata = {
  title: "Master Apparel Collection",
  description:
    "Explore the master prêt and ceremonial collection from NOIR & GOLD. Featuring bespoke silhouettes, hand-embroidery, pure velvets, and raw silks across Pakistan.",
  openGraph: {
    title: "Master Apparel Collection | NOIR & GOLD",
    description:
      "Explore the master prêt and ceremonial collection from NOIR & GOLD. Featuring bespoke silhouettes, hand-embroidery, pure velvets, and raw silks across Pakistan.",
  },
};

export default async function ShopPage() {
  const products = await readCatalogProducts();

  return (
    <Suspense fallback={<CatalogLoadingSkeleton />}>
      <ProductListingView initialProducts={products} />
    </Suspense>
  );
}
