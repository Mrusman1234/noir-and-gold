import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailView } from "@/components/products/ProductDetailView";
import {
  readCatalogProduct,
  readCatalogSlugs,
  readRelatedCatalogProducts,
} from "@/lib/catalog-read";

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const slugs = await readCatalogSlugs();
  return slugs.map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await readCatalogProduct(slug);

  if (!product) {
    return {
      title: "Garment Not Found",
      description: "The requested atelier garment could not be found.",
    };
  }

  return {
    title: product.title,
    description: product.description,
    openGraph: {
      title: `${product.title} | NOIR & GOLD Atelier`,
      description: product.description,
      images: [
        {
          url: product.primaryImageUrl,
          alt: product.title,
        },
      ],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await readCatalogProduct(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = await readRelatedCatalogProducts(product.id, product.audience);

  return (
    <ProductDetailView
      product={product}
      relatedProducts={relatedProducts}
    />
  );
}
