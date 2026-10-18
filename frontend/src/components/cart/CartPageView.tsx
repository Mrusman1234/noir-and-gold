"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { OrderSummaryCard } from "@/components/cart/OrderSummaryCard";
import { FreeDeliveryMeter } from "@/components/cart/FreeDeliveryMeter";
import { ClearCartModal } from "@/components/cart/ClearCartModal";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/context/CartContext";

export function CartPageView() {
  const {
    items,
    totalCount,
    subtotalPkr,
    discountTotalPkr,
    estimatedShippingFeePkr,
    estimatedTotalPkr,
    freeShippingThresholdPkr,
    isFreeShippingEligible,
    amountNeededForFreeShipping,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  return (
    <div className="min-h-screen py-8 text-text-primary sm:py-12 bg-canvas-bg font-sans">
      <Container size="xl">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb navigation"
          className="flex items-center gap-2 text-xs text-text-secondary uppercase tracking-widest mb-6 sm:mb-8 font-sans"
        >
          <Link href="/" className="hover:text-text-primary transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-text-primary transition-colors">
            Shop
          </Link>
          <span>/</span>
          <span className="text-text-primary font-semibold">Shopping Bag</span>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 mb-8 border-b border-border-subtle gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-5xl font-normal leading-tight text-text-primary">
              Your Shopping Bag
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary font-sans mt-1">
              {totalCount > 0
                ? `You have selected ${totalCount} ${totalCount === 1 ? "atelier piece" : "atelier pieces"} for delivery.`
                : "Your bag is currently empty."}
            </p>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={() => setIsClearModalOpen(true)}
              className="text-xs font-sans uppercase tracking-wider text-text-secondary hover:text-rose-600 transition-colors self-start sm:self-auto cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500"
            >
              Clear Entire Bag
            </button>
          )}
        </div>

        {/* Main Content Area */}
        {items.length === 0 ? (
          /* Empty Bag State */
          <div className="max-w-2xl mx-auto py-16 sm:py-24 text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-surface-white border border-border-subtle flex items-center justify-center text-text-primary shadow-xs">
              <svg
                className="w-10 h-10 stroke-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25c-.669 0-1.188-.578-1.119-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                />
              </svg>
            </div>

            <div className="space-y-2">
              <h2 className="font-serif text-2xl sm:text-3xl font-medium text-text-primary">
                Your Shopping Bag is Currently Empty
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary font-sans max-w-md mx-auto leading-relaxed">
                You have not reserved any atelier garments yet. Explore our handcrafted bridal wear, bespoke sherwanis, and luxury prêt tailored for Pakistani elegance.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button href="/shop" variant="primary" size="lg" showArrow>
                Discover the Collection
              </Button>
            </div>

            {/* Quick Department Shortcuts */}
            <div className="pt-8 border-t border-border-subtle max-w-md mx-auto">
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-text-secondary block mb-3">
                Curated Collections
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Link
                  href="/shop/women"
                  className="px-3.5 py-1.5 rounded-full bg-surface-white border border-border-subtle text-xs text-text-secondary hover:text-text-primary hover:border-text-primary transition-colors shadow-xs"
                >
                  Women&apos;s Prêt &amp; Couture
                </Link>
                <Link
                  href="/shop/men"
                  className="px-3.5 py-1.5 rounded-full bg-surface-white border border-border-subtle text-xs text-text-secondary hover:text-text-primary hover:border-text-primary transition-colors shadow-xs"
                >
                  Men&apos;s Bespoke &amp; Formal
                </Link>
                <Link
                  href="/shop?q=velvet"
                  className="px-3.5 py-1.5 rounded-full bg-surface-white border border-border-subtle text-xs text-text-secondary hover:text-text-primary hover:border-text-primary transition-colors shadow-xs"
                >
                  Velvet Ensembles
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Active Cart 2-Column Grid Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-start">
            {/* Left Column: Free Delivery Meter & Line Items (lg:col-span-8) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Free Delivery Meter Banner */}
              <FreeDeliveryMeter
                subtotalPkr={subtotalPkr}
                thresholdPkr={freeShippingThresholdPkr}
                isEligible={isFreeShippingEligible}
                amountNeeded={amountNeededForFreeShipping}
              />

              {/* Line Items List */}
              <div className="space-y-4" role="list" aria-label="Shopping bag garments">
                {items.map((item) => (
                  <CartItemRow
                    key={item.id}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeItem}
                  />
                ))}
              </div>

              {/* Bottom Navigation / Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border-subtle">
                <Link
                  href="/shop"
                  className="text-xs uppercase tracking-wider text-text-primary hover:text-text-secondary transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary font-medium"
                >
                  <span>←</span>
                  <span>Continue Shopping For More Ensembles</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setIsClearModalOpen(true)}
                  className="text-xs text-text-secondary hover:text-rose-600 uppercase tracking-wider transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500"
                >
                  Clear Bag
                </button>
              </div>
            </div>

            {/* Right Column: Sticky Order Summary (lg:col-span-4) */}
            <div className="lg:col-span-4">
              <OrderSummaryCard
                subtotalPkr={subtotalPkr}
                discountTotalPkr={discountTotalPkr}
                estimatedShippingFeePkr={estimatedShippingFeePkr}
                estimatedTotalPkr={estimatedTotalPkr}
                isFreeShippingEligible={isFreeShippingEligible}
                totalCount={totalCount}
              />
            </div>
          </div>
        )}
      </Container>

      {/* Clear Cart Confirmation Modal */}
      <ClearCartModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={clearCart}
      />
    </div>
  );
}
