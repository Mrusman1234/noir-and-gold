"use client";

import React from "react";
import { formatPKR } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface OrderSummaryCardProps {
  subtotalPkr: number;
  discountTotalPkr: number;
  estimatedShippingFeePkr: number;
  estimatedTotalPkr: number;
  isFreeShippingEligible: boolean;
  totalCount: number;
}

export function OrderSummaryCard({
  subtotalPkr,
  discountTotalPkr,
  estimatedShippingFeePkr,
  estimatedTotalPkr,
  isFreeShippingEligible,
  totalCount,
}: OrderSummaryCardProps) {
  return (
    <aside
      aria-label="Order summary"
      className="rounded-2xl border border-border-subtle bg-surface-white p-6 shadow-xs lg:sticky lg:top-24 space-y-6 font-sans text-text-primary"
    >
      <div className="border-b border-border-subtle pb-4">
        <h2 className="font-serif text-xl sm:text-2xl font-normal text-text-primary">
          Order Summary
        </h2>
        <p className="text-xs text-text-secondary font-sans mt-1">
          {totalCount} {totalCount === 1 ? "garment" : "garments"} in your bag
        </p>
      </div>

      {/* Line Item Financial Breakdown */}
      <div className="space-y-3 text-xs sm:text-sm font-sans">
        {/* Subtotal */}
        <div className="flex items-center justify-between text-text-secondary">
          <span>Bag Subtotal</span>
          <span className="font-semibold text-text-primary">
            {formatPKR(subtotalPkr)}
          </span>
        </div>

        {/* Promotional Savings */}
        {discountTotalPkr > 0 && (
          <div className="flex items-center justify-between text-emerald-700">
            <span>Promotional Savings</span>
            <span className="font-semibold">
              −{formatPKR(discountTotalPkr)}
            </span>
          </div>
        )}

        {/* Estimated Delivery */}
        <div className="flex items-start justify-between text-text-secondary pt-1">
          <div className="space-y-0.5">
            <span>Estimated Delivery</span>
            <span className="block text-[10px] text-text-secondary/80">
              Final zone rates calculated at checkout
            </span>
          </div>
          <span className="font-semibold text-right">
            {isFreeShippingEligible ? (
              <span className="text-emerald-700 uppercase text-xs tracking-wider font-bold">
                Complimentary
              </span>
            ) : (
              <span className="text-text-primary">
                {formatPKR(estimatedShippingFeePkr)}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Estimated Total */}
      <div className="pt-4 border-t border-border-subtle flex items-baseline justify-between">
        <div>
          <span className="font-serif text-base sm:text-lg font-medium text-text-primary block">
            Estimated Total
          </span>
          <span className="text-[10px] text-text-secondary font-sans">
            Including all applicable local taxes
          </span>
        </div>
        <div className="text-right">
          <span className="font-sans text-2xl font-bold tabular-nums text-text-primary sm:text-3xl">
            {formatPKR(estimatedTotalPkr)}
          </span>
        </div>
      </div>

      {/* Payment Assurance Badge */}
      <div className="p-3 bg-surface-subtle border border-border-subtle rounded-xl text-[11px] font-sans text-text-secondary flex items-center gap-2.5">
        <span className="text-base">🇵🇰</span>
        <div>
          <p className="text-text-primary font-semibold">Payment on Delivery (COD)</p>
          <p className="text-[10px] text-text-secondary">
            Pay safely in Pakistani Rupees upon receiving your package.
          </p>
        </div>
      </div>

      {/* Call to Action Buttons */}
      <div className="space-y-3 pt-2">
        <Button
          href="/checkout"
          variant="primary"
          size="lg"
          showArrow
          className="w-full"
        >
          Proceed to Checkout
        </Button>

        <Button
          href="/shop"
          variant="secondary"
          size="md"
          className="w-full"
        >
          Continue Shopping
        </Button>
      </div>

      {/* Atelier Trust Bullet Points */}
      <div className="pt-4 border-t border-border-subtle space-y-2 text-[11px] font-sans text-text-secondary">
        <div className="flex items-center gap-2">
          <span className="text-text-primary">✦</span>
          <span>100% Authentic Handcrafted Couture</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-text-primary">✦</span>
          <span>7-Day Doorstep Inspection &amp; Size Exchange</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-text-primary">✦</span>
          <span>Tamper-Proof Luxury Garment Packaging</span>
        </div>
      </div>
    </aside>
  );
}
