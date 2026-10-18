"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CartItem, PaymentMethod } from "@/types";
import { formatPKR } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { PAYMENT_ACCOUNTS } from "@/lib/constants";

interface CheckoutSummaryProps {
  items: CartItem[];
  subtotalPkr: number;
  discountTotalPkr: number;
  deliveryFeePkr: number;
  totalPkr: number;
  isSubmitting: boolean;
  onSubmit: () => void;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  paymentReference: string;
  onPaymentReferenceChange: (ref: string) => void;
  paymentReferenceError?: string;
}

export function CheckoutSummary({
  items,
  subtotalPkr,
  discountTotalPkr,
  deliveryFeePkr,
  totalPkr,
  isSubmitting,
  onSubmit,
  paymentMethod,
  onPaymentMethodChange,
  paymentReference,
  onPaymentReferenceChange,
  paymentReferenceError,
}: CheckoutSummaryProps) {
  const isFreeDelivery = deliveryFeePkr === 0;
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    if (typeof window !== "undefined" && navigator?.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2500);
      });
    }
  };

  const currentAccount = PAYMENT_ACCOUNTS[paymentMethod];

  const getCtaText = () => {
    switch (paymentMethod) {
      case "JAZZCASH":
        return "Place Order with JazzCash";
      case "EASYPAISA":
        return "Place Order with EasyPaisa";
      case "BANK_TRANSFER":
        return "Place Order with Bank Transfer";
      case "CASH_ON_DELIVERY":
      default:
        return "Place Order with Cash on Delivery";
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Section 3: Payment Method Selection */}
      <div className="rounded-2xl border border-border-subtle bg-surface-white p-5 space-y-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <span className="text-text-secondary text-sm font-serif font-medium">03</span>
            <h2 className="font-serif text-lg sm:text-xl font-medium text-text-primary">
              Payment Method
            </h2>
          </div>
          <span className="text-[11px] font-medium text-text-secondary">
            PKR Currency
          </span>
        </div>

        {/* 4 Method Selectable Cards */}
        <div className="space-y-3">
          {/* Option 1: Cash on Delivery */}
          <div
            onClick={() => onPaymentMethodChange("CASH_ON_DELIVERY")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onPaymentMethodChange("CASH_ON_DELIVERY")}
            className={`p-3.5 sm:p-4 rounded-xl cursor-pointer transition-all ${
              paymentMethod === "CASH_ON_DELIVERY"
                ? "bg-surface-subtle border-2 border-text-primary shadow-xs"
                : "bg-surface-white border border-border-subtle hover:border-text-primary/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${
                    paymentMethod === "CASH_ON_DELIVERY"
                      ? "bg-text-primary text-white"
                      : "border border-border-subtle text-transparent"
                  }`}
                >
                  ✓
                </span>
                <div>
                  <span className="font-serif text-sm sm:text-base font-medium text-text-primary block">
                    Cash on Delivery (COD)
                  </span>
                  <span className="text-[11px] text-text-secondary">
                    Pay upon parcel delivery at your doorstep
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-primary bg-surface-white px-2 py-0.5 rounded-full border border-border-subtle">
                Nationwide
              </span>
            </div>
          </div>

          {/* Option 2: JazzCash */}
          <div
            onClick={() => onPaymentMethodChange("JAZZCASH")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onPaymentMethodChange("JAZZCASH")}
            className={`p-3.5 sm:p-4 rounded-xl cursor-pointer transition-all ${
              paymentMethod === "JAZZCASH"
                ? "bg-surface-subtle border-2 border-text-primary shadow-xs"
                : "bg-surface-white border border-border-subtle hover:border-text-primary/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${
                    paymentMethod === "JAZZCASH"
                      ? "bg-text-primary text-white"
                      : "border border-border-subtle text-transparent"
                  }`}
                >
                  ✓
                </span>
                <div>
                  <span className="font-serif text-sm sm:text-base font-medium text-text-primary block">
                    JazzCash
                  </span>
                  <span className="text-[11px] text-text-secondary">
                    Mobile Account / Till (Instant Transfer)
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/80">
                Wallet / Till
              </span>
            </div>
          </div>

          {/* Option 3: EasyPaisa */}
          <div
            onClick={() => onPaymentMethodChange("EASYPAISA")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onPaymentMethodChange("EASYPAISA")}
            className={`p-3.5 sm:p-4 rounded-xl cursor-pointer transition-all ${
              paymentMethod === "EASYPAISA"
                ? "bg-surface-subtle border-2 border-text-primary shadow-xs"
                : "bg-surface-white border border-border-subtle hover:border-text-primary/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${
                    paymentMethod === "EASYPAISA"
                      ? "bg-text-primary text-white"
                      : "border border-border-subtle text-transparent"
                  }`}
                >
                  ✓
                </span>
                <div>
                  <span className="font-serif text-sm sm:text-base font-medium text-text-primary block">
                    EasyPaisa
                  </span>
                  <span className="text-[11px] text-text-secondary">
                    Mobile Account / USSD (*786#)
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                Wallet
              </span>
            </div>
          </div>

          {/* Option 4: Direct Bank Transfer */}
          <div
            onClick={() => onPaymentMethodChange("BANK_TRANSFER")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onPaymentMethodChange("BANK_TRANSFER")}
            className={`p-3.5 sm:p-4 rounded-xl cursor-pointer transition-all ${
              paymentMethod === "BANK_TRANSFER"
                ? "bg-surface-subtle border-2 border-text-primary shadow-xs"
                : "bg-surface-white border border-border-subtle hover:border-text-primary/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${
                    paymentMethod === "BANK_TRANSFER"
                      ? "bg-text-primary text-white"
                      : "border border-border-subtle text-transparent"
                  }`}
                >
                  ✓
                </span>
                <div>
                  <span className="font-serif text-sm sm:text-base font-medium text-text-primary block">
                    Direct Bank Transfer (IBFT / Raast)
                  </span>
                  <span className="text-[11px] text-text-secondary">
                    Meezan Bank Ltd • Nationwide Pakistani Banks
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/80">
                IBFT / Raast
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Payment Details & Reference Input for Non-COD */}
        {paymentMethod !== "CASH_ON_DELIVERY" && (
          <div className="mt-4 p-4 rounded-xl bg-surface-subtle/80 border border-border-subtle space-y-4 text-xs animate-fade-in">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <span className="font-serif font-semibold text-text-primary text-sm">
                Official {currentAccount.name} Details
              </span>
              <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Verified Atelier Account
              </span>
            </div>

            {/* Account Information Card */}
            <div className="space-y-2 bg-surface-white p-3 rounded-lg border border-border-subtle font-sans">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Account Title:</span>
                <span className="font-semibold text-text-primary font-serif">
                  {"accountTitle" in currentAccount ? currentAccount.accountTitle : "NOIR & GOLD ATELIER"}
                </span>
              </div>

              {"bankName" in currentAccount && (
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Bank:</span>
                  <span className="font-medium text-text-primary">{currentAccount.bankName}</span>
                </div>
              )}

              {"accountNumber" in currentAccount && (
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Account No:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-text-primary">{currentAccount.accountNumber}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(currentAccount.accountNumber, "acc")}
                      className="text-[10px] underline text-accent-gold hover:text-text-primary transition-colors cursor-pointer"
                    >
                      {copiedKey === "acc" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              )}

              {"iban" in currentAccount && (
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">IBAN:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-text-primary text-[11px]">{currentAccount.iban}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(currentAccount.iban, "iban")}
                      className="text-[10px] underline text-accent-gold hover:text-text-primary transition-colors cursor-pointer"
                    >
                      {copiedKey === "iban" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              )}

              {"tillNumber" in currentAccount && currentAccount.tillNumber !== currentAccount.accountNumber && (
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Till No:</span>
                  <span className="font-mono font-bold text-text-primary">{currentAccount.tillNumber}</span>
                </div>
              )}
            </div>

            {/* Instruction Checklist */}
            <div className="space-y-1 text-[11px] text-text-secondary">
              {currentAccount.details.map((detail, idx) => (
                <p key={idx} className="leading-relaxed">
                  • {detail}
                </p>
              ))}
            </div>

            {/* Transaction Reference Input */}
            <div className="pt-2 border-t border-border-subtle space-y-1.5">
              <label
                htmlFor="checkout-payment-reference"
                className="block text-xs font-semibold text-text-primary"
              >
                {"referenceLabel" in currentAccount ? currentAccount.referenceLabel : "Transaction ID / Reference"}
                <span className="text-rose-600 ml-1">*</span>
              </label>
              <input
                id="checkout-payment-reference"
                type="text"
                value={paymentReference}
                onChange={(e) => onPaymentReferenceChange(e.target.value)}
                placeholder={"referencePlaceholder" in currentAccount ? currentAccount.referencePlaceholder : "Enter reference number"}
                className={`w-full px-3 py-2 text-xs rounded-lg border bg-surface-white text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-1 focus:ring-text-primary ${
                  paymentReferenceError ? "border-rose-400 bg-rose-50/30" : "border-border-subtle"
                }`}
              />
              {paymentReferenceError && (
                <p className="text-[11px] text-rose-600 font-medium">
                  {paymentReferenceError}
                </p>
              )}
              <p className="text-[10px] text-text-secondary">
                Our verification desk confirms the transaction against your reference before shipping.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Section 4: Itemized Order Summary */}
      <div className="rounded-2xl border border-border-subtle bg-surface-white space-y-5 p-5 sm:p-6 shadow-xs lg:sticky lg:top-24">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <h2 className="font-serif text-lg sm:text-xl font-medium text-text-primary">
            Order Review
          </h2>
          <Link
            href="/cart"
            className="text-xs text-text-secondary hover:text-text-primary transition-colors underline"
          >
            Edit Bag ({items.length})
          </Link>
        </div>

        {/* Cart Line Items Preview */}
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1 divide-y divide-border-subtle">
          {items.map((item) => (
            <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative w-10 h-13 flex-shrink-0 bg-surface-subtle border border-border-subtle rounded-md overflow-hidden">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-text-primary font-serif truncate font-medium">
                    {item.title}
                  </p>
                  <p className="text-[10px] text-text-secondary">
                    {item.size} • {item.color} • Qty: {item.quantity}
                  </p>
                </div>
              </div>
              <span className="font-sans text-xs font-semibold text-text-primary flex-shrink-0">
                {formatPKR(item.pricePkr * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        {/* Financial Subtotals */}
        <div className="pt-3 border-t border-border-subtle space-y-2 text-xs text-text-secondary">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-semibold text-text-primary">{formatPKR(subtotalPkr)}</span>
          </div>

          {discountTotalPkr > 0 && (
            <div className="flex justify-between text-emerald-700 font-medium">
              <span>Promotional Savings</span>
              <span>−{formatPKR(discountTotalPkr)}</span>
            </div>
          )}

          <div className="flex justify-between items-baseline">
            <div>
              <span>Domestic Delivery</span>
              <span className="block text-[10px] text-text-secondary/80">
                {isFreeDelivery ? "Complimentary Threshold" : "Standard Express"}
              </span>
            </div>
            <span className="font-semibold">
              {isFreeDelivery ? (
                <span className="text-emerald-700 font-bold uppercase text-[11px]">
                  Complimentary
                </span>
              ) : (
                <span className="text-text-primary">{formatPKR(deliveryFeePkr)}</span>
              )}
            </span>
          </div>
        </div>

        {/* Final Total */}
        <div className="pt-4 border-t border-border-subtle flex items-baseline justify-between">
          <div>
            <span className="font-serif text-base font-medium text-text-primary block">
              {paymentMethod === "CASH_ON_DELIVERY" ? "Payable Upon Delivery" : "Total Order Amount"}
            </span>
            <span className="text-[10px] text-text-secondary">
              {currentAccount.shortName} • PKR
            </span>
          </div>
          <span className="font-sans text-2xl font-bold tabular-nums text-text-primary sm:text-3xl">
            {formatPKR(totalPkr)}
          </span>
        </div>

        {/* Order Placement CTA */}
        <div className="space-y-3 pt-2">
          <Button
            type="button"
            onClick={onSubmit}
            disabled={items.length === 0}
            isLoading={isSubmitting}
            loadingText="Confirming Order..."
            variant="primary"
            size="lg"
            showArrow={!isSubmitting}
            className="w-full"
          >
            {getCtaText()}
          </Button>

          <p className="text-[10px] text-center text-text-secondary leading-relaxed">
            By confirming your order, you agree to our 7-day doorstep inspection &amp; exchange terms.
          </p>
        </div>
      </div>
    </div>
  );
}
