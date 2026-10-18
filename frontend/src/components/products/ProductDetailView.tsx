"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductGallery } from "@/components/products/ProductGallery";
import { SizeGuideModal } from "@/components/products/SizeGuideModal";
import { ProductAccordion } from "@/components/products/ProductAccordion";
import { MobileStickyBuyBar } from "@/components/products/MobileStickyBuyBar";
import { ProductDetail, ProductSummary } from "@/types";
import { formatPKR } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/Button";

interface ProductDetailViewProps {
  product: ProductDetail;
  relatedProducts: ProductSummary[];
}

export function ProductDetailView({
  product,
  relatedProducts,
}: ProductDetailViewProps) {
  const router = useRouter();
  const { addItem } = useCart();

  // State management
  const [selectedColor, setSelectedColor] = useState<string>(
    product.availableColors?.[0] || product.variants[0]?.colorName || "Obsidian Black"
  );
  const [selectedSize, setSelectedSize] = useState<string>(
    product.availableSizes[0] || product.variants[0]?.size || "M"
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState<boolean>(false);
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [justAdded, setJustAdded] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Find active variant based on selected size and color
  const activeVariant = useMemo(() => {
    return (
      product.variants.find(
        (v) => v.size === selectedSize && v.colorName === selectedColor
      ) ||
      product.variants.find((v) => v.colorName === selectedColor) ||
      product.variants[0]
    );
  }, [product.variants, selectedSize, selectedColor]);

  // Stock availability for currently selected variant
  const currentStock = activeVariant ? activeVariant.stock : 0;
  const isAvailable = currentStock > 0;

  // Calculate discount percentage if original price is given
  const discountPercent = useMemo(() => {
    if (product.salePricePkr && product.salePricePkr > product.pricePkr) {
      return Math.round(
        ((product.salePricePkr - product.pricePkr) / product.salePricePkr) * 100
      );
    }
    return null;
  }, [product.pricePkr, product.salePricePkr]);

  // Color options mapped with hex codes
  const colorOptions = useMemo(() => {
    const map = new Map<string, string>();
    product.variants.forEach((v) => {
      if (!map.has(v.colorName)) {
        map.set(v.colorName, v.colorHex);
      }
    });

    if (map.size === 0 && product.availableColors) {
      product.availableColors.forEach((c) => {
        map.set(c, c.toLowerCase().includes("black") ? "#0B0A0F" : "#2E1036");
      });
    }

    return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }));
  }, [product.variants, product.availableColors]);

  // Check stock for a size in the currently active color
  const getSizeStock = (size: string): number => {
    const match = product.variants.find(
      (v) => v.size === size && v.colorName === selectedColor
    );
    return match ? match.stock : 0;
  };

  // Quantity controllers
  const handleDecrementQty = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleIncrementQty = () => {
    if (quantity < currentStock) {
      setQuantity((prev) => prev + 1);
    }
  };

  // Switch color swatch and check if current size is valid
  const handleColorChange = (colorName: string) => {
    setSelectedColor(colorName);
    // If current size is sold out in new color, switch to first available size
    const matchingVariant = product.variants.find(
      (v) => v.colorName === colorName && v.size === selectedSize
    );
    if (!matchingVariant || matchingVariant.stock === 0) {
      const firstAvailable = product.variants.find(
        (v) => v.colorName === colorName && v.stock > 0
      );
      if (firstAvailable) {
        setSelectedSize(firstAvailable.size);
      }
    }
    setQuantity(1);
  };

  // Add to Shopping Bag
  const handleAddToCart = () => {
    if (!isAvailable || isAdding) return;

    setIsAdding(true);

    const result = addItem({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      categoryName: product.categoryName,
      pricePkr: product.pricePkr,
      originalPricePkr: product.salePricePkr,
      imageUrl: product.primaryImageUrl,
      size: selectedSize,
      color: selectedColor,
      quantity,
      maxStock: currentStock,
    });

    setTimeout(() => {
      setIsAdding(false);
      setJustAdded(true);
      setFeedbackMessage(result.message);

      setTimeout(() => {
        setJustAdded(false);
        setFeedbackMessage(null);
      }, 4000);
    }, 300);
  };

  // Buy Now direct flow
  const handleBuyNow = () => {
    if (!isAvailable) return;
    addItem({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      categoryName: product.categoryName,
      pricePkr: product.pricePkr,
      originalPricePkr: product.salePricePkr,
      imageUrl: product.primaryImageUrl,
      size: selectedSize,
      color: selectedColor,
      quantity,
      maxStock: currentStock,
    });
    router.push("/checkout");
  };

  return (
    <div className="min-h-screen py-7 text-text-primary sm:py-10 bg-canvas-bg">
      <Container size="xl">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumbs"
          className="flex items-center gap-2 text-xs text-text-secondary uppercase tracking-widest mb-6 sm:mb-8 font-sans overflow-x-auto whitespace-nowrap pb-1"
        >
          <Link href="/" className="hover:text-text-primary transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-text-primary transition-colors">
            Shop
          </Link>
          <span>/</span>
          {product.audience && (
            <>
              <Link
                href={`/shop/${product.audience}`}
                className="hover:text-text-primary transition-colors"
              >
                {product.audience === "women"
                  ? "Women"
                  : product.audience === "men"
                  ? "Men"
                  : "Unisex"}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-text-primary font-semibold truncate max-w-[200px] sm:max-w-none">
            {product.title}
          </span>
        </nav>

        {/* Global Feedback Banner on Add to Cart */}
        {feedbackMessage && (
          <div
            role="status"
            aria-live="polite"
            className="mb-6 p-3 sm:p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-sans flex items-center justify-between gap-4 rounded-xl animate-fade-in shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                ✓
              </span>
              <span>
                <strong>{product.title}</strong> ({selectedSize} • {selectedColor}) added to your shopping bag.
              </span>
            </div>
            <Link
              href="/cart"
              className="text-xs font-semibold uppercase tracking-wider text-text-primary hover:underline flex-shrink-0"
            >
              View Bag →
            </Link>
          </div>
        )}

        {/* 2-Column Responsive Layout: Gallery (Left 52%) + Details (Right 48%) */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 xl:gap-14">
          {/* Column 1: Sticky Image Gallery (Desktop 52% -> lg:col-span-7) */}
          <div className="lg:col-span-7 lg:sticky lg:top-24">
            <ProductGallery
              images={product.images}
              title={product.title}
              isNew={product.isNew}
              isLimited={product.isLimited}
              discountPercent={discountPercent}
            />
          </div>

          {/* Column 2: Purchasing & Garment Details (lg:col-span-5) */}
          <div className="flex flex-col space-y-6 lg:col-span-5 lg:sticky lg:top-28">
            {/* Brand Overline & Category */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.25em] text-text-secondary">
                  NOIR &amp; GOLD Atelier
                </span>
                <span className="text-[11px] font-mono text-text-secondary">
                  {product.sku}
                </span>
              </div>

              {/* Product Title */}
              <h1 className="mb-2 font-serif text-3xl font-normal leading-[1.08] text-text-primary sm:text-4xl lg:text-5xl">
                {product.title}
              </h1>

              {/* Category Subtitle */}
              <p className="text-xs sm:text-sm text-text-secondary font-sans leading-relaxed">
                {product.categoryName}
              </p>

              {/* Star Rating & Review Count */}
              <div className="flex items-center gap-2 mt-2 text-xs font-sans">
                <div className="flex items-center text-amber-500" aria-label={`Rating: ${product.rating || 4.9} out of 5 stars`}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className="w-3.5 h-3.5 fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-text-primary font-medium text-[11px]">
                  {product.rating || 4.9}
                </span>
                <span className="text-text-secondary text-[11px]">
                  ({product.reviewCount || 128} verified reviews)
                </span>
              </div>
            </div>

            {/* Price Display */}
            <div className="flex items-baseline gap-3 pb-4 border-b border-border-subtle">
              <span className="font-sans text-2xl font-bold tabular-nums text-text-primary sm:text-3xl">
                {formatPKR(product.pricePkr)}
              </span>
              {product.salePricePkr && (
                <span className="text-sm sm:text-base text-text-secondary line-through">
                  {formatPKR(product.salePricePkr)}
                </span>
              )}
              {discountPercent && (
                <span className="px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider bg-surface-subtle border border-border-subtle text-text-primary rounded-full">
                  Save {discountPercent}%
                </span>
              )}
            </div>

            {/* Editorial Description */}
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-sans">
              {product.description}
            </p>

            {/* Variant Stock Status Badge */}
            <div className="flex items-center gap-2 text-xs font-sans">
              {currentStock > 3 ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-700 font-medium">
                    In Stock — Ready to dispatch within 24 hours
                  </span>
                </>
              ) : currentStock > 0 ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-amber-800 font-medium">
                    Only {currentStock} pieces remaining in this variant
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-rose-700 font-medium">
                    Sold Out in {selectedSize} / {selectedColor}
                  </span>
                </>
              )}
            </div>

            {/* Color Swatch Selection */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-sans">
                <span className="text-text-secondary uppercase tracking-wider text-[11px]">
                  Color Palette:
                </span>
                <span className="text-text-primary font-semibold text-xs">
                  {selectedColor}
                </span>
              </div>

              <div className="flex items-center gap-3" role="radiogroup" aria-label="Garment color selection">
                {colorOptions.map((c) => {
                  const isSelected = selectedColor === c.name;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => handleColorChange(c.name)}
                      aria-label={`Select color ${c.name}`}
                      style={{ backgroundColor: c.hex }}
                      className={`relative h-10 w-10 rounded-full border transition-all duration-200 cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary ${
                        isSelected
                          ? "ring-2 ring-offset-2 ring-text-primary border-transparent scale-105"
                          : "border-border-subtle hover:scale-105"
                      }`}
                    >
                      {/* Checkmark on selected swatch */}
                      {isSelected && (
                        <svg
                          className="w-4 h-4 text-white drop-shadow-md"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="3"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size Selection Chips */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-sans">
                <span className="text-text-secondary uppercase tracking-wider text-[11px]">
                  Select Size:
                </span>
                <button
                  type="button"
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="text-text-secondary hover:text-text-primary underline text-[11px] font-sans transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary"
                >
                  Sizing Guide (IN / CM) ?
                </button>
              </div>

              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Garment size selection">
                {product.availableSizes.map((size) => {
                  const isSelected = selectedSize === size;
                  const sizeStock = getSizeStock(size);
                  const isSizeAvailable = sizeStock > 0;

                  return (
                    <button
                      key={size}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      disabled={!isSizeAvailable}
                      onClick={() => {
                        setSelectedSize(size);
                        setQuantity(1);
                      }}
                      className={`flex h-10 min-w-12 items-center justify-center rounded-full border px-4 text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary ${
                        !isSizeAvailable
                          ? "cursor-not-allowed border-border-subtle/50 bg-surface-subtle text-text-secondary/40 line-through"
                          : isSelected
                          ? "cursor-pointer border-text-primary bg-text-primary font-semibold text-white"
                          : "cursor-pointer border-border-subtle bg-surface-white text-text-primary hover:border-text-primary"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-2">
              <span className="text-text-secondary uppercase tracking-wider text-[11px] font-sans block">
                Quantity:
              </span>
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center overflow-hidden rounded-full border border-border-subtle bg-surface-white shadow-xs">
                  <button
                    type="button"
                    onClick={handleDecrementQty}
                    disabled={quantity <= 1 || !isAvailable}
                    aria-label="Decrease quantity"
                    className="h-10 w-10 flex items-center justify-center text-text-primary hover:bg-surface-subtle disabled:text-text-secondary/40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary cursor-pointer"
                  >
                    −
                  </button>
                  <span className="w-12 text-center text-xs font-sans font-semibold text-text-primary">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={handleIncrementQty}
                    disabled={quantity >= currentStock || !isAvailable}
                    aria-label="Increase quantity"
                    className="h-10 w-10 flex items-center justify-center text-text-primary hover:bg-surface-subtle disabled:text-text-secondary/40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <span className="text-[11px] text-text-secondary font-sans">
                  {isAvailable ? `Max available: ${currentStock}` : "No stock available"}
                </span>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!isAvailable || isAdding}
                  isLoading={isAdding}
                  showArrow={!justAdded && isAvailable}
                  variant="primary"
                  size="lg"
                  className={`flex-1 ${justAdded ? "bg-status-success border-status-success text-white" : ""}`}
                >
                  {justAdded
                    ? "Added to Bag"
                    : !isAvailable
                      ? "Sold Out"
                      : "Add to Bag"}
                </Button>

                {/* Wishlist Heart Button */}
                <button
                  type="button"
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  className={`flex h-12 w-12 flex-shrink-0 cursor-pointer items-center justify-center rounded-full border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary ${
                    isWishlisted
                      ? "border-rose-300 bg-rose-50 text-rose-600"
                      : "border-border-subtle bg-surface-white text-text-secondary hover:border-text-primary hover:text-text-primary shadow-xs"
                  }`}
                >
                  <svg
                    className={`w-5 h-5 ${isWishlisted ? "fill-rose-600 text-rose-600" : "fill-none"}`}
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                    />
                  </svg>
                </button>
              </div>

              {/* Buy Now Direct Button */}
              {isAvailable && (
                <Button
                  type="button"
                  onClick={handleBuyNow}
                  variant="secondary"
                  size="lg"
                  className="w-full"
                >
                  Buy Now · Cash on Delivery
                </Button>
              )}
            </div>

            {/* Pakistan Shipping & Trust Advisory Box */}
            <div className="rounded-xl border border-border-subtle bg-surface-white p-4 space-y-2 text-xs font-sans shadow-xs">
              <div className="flex items-center gap-2 text-text-primary font-medium">
                <span>🇵🇰</span>
                <span>Domestic Express Delivery &amp; COD Available</span>
              </div>
              <p className="text-text-secondary text-[11px] leading-relaxed">
                Local delivery across Karachi (1–2 days), Lahore, Islamabad (2–3 days), and all Pakistani cities. Complimentary delivery on orders over PKR 7,500.
              </p>
            </div>

            {/* Accordion Details */}
            <ProductAccordion
              fabric={product.fabric}
              details={product.details}
              careInstructions={product.careInstructions}
            />
          </div>
        </div>

        {/* Related Atelier Products Section */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 sm:mt-24 pt-12 border-t border-border-subtle">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-text-secondary block mb-1">
                  Coordinated Ensemble
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-normal text-text-primary">
                  Related Atelier Pieces
                </h2>
              </div>
              <Link
                href="/shop"
                className="text-xs uppercase tracking-widest text-text-secondary hover:text-text-primary hover:underline transition-colors"
              >
                View Full Catalog →
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((relProduct) => (
                <ProductCard key={relProduct.id} product={relProduct} />
              ))}
            </div>
          </section>
        )}
      </Container>

      {/* Sizing & Measurement Guide Modal */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        initialAudience={product.audience}
      />

      {/* Mobile Sticky Buy Bar (When scrolling down on small screens) */}
      <MobileStickyBuyBar
        title={product.title}
        imageUrl={product.primaryImageUrl}
        pricePkr={product.pricePkr}
        selectedSize={selectedSize}
        selectedColor={selectedColor}
        isAvailable={isAvailable}
        onAddToCart={handleAddToCart}
        isAdding={isAdding}
        justAdded={justAdded}
      />
    </div>
  );
}
