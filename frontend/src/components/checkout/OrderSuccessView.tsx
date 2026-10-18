"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { OrderRecord } from "@/types";
import { formatPKR } from "@/lib/utils";
import { PAYMENT_ACCOUNTS, OFFICIAL_PHONE, OFFICIAL_EMAIL } from "@/lib/constants";

interface OrderSuccessViewProps {
  orderReference: string;
}

export function OrderSuccessView({ orderReference }: OrderSuccessViewProps) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(token));
  const [fetchFailed, setFetchFailed] = useState<boolean>(false);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    async function fetchOrder() {
      try {
        const res = await fetch(
          `/api/v1/orders/${encodeURIComponent(orderReference)}?token=${encodeURIComponent(
            token
          )}`
        );
        const data = await res.json();

        if (!isMounted) return;

        if (res.ok && data.success && data.order) {
          setOrder(data.order);
        } else {
          setFetchFailed(true);
        }
      } catch {
        if (isMounted) setFetchFailed(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchOrder();

    return () => {
      isMounted = false;
    };
  }, [orderReference, token]);

  const isUnauthorized = !token || fetchFailed || (!isLoading && !order);

  if (isLoading) {
    return (
      <div className="bg-canvas-bg text-text-primary min-h-[75vh] flex items-center justify-center py-16">
        <div className="text-center space-y-4">
          <svg
            className="animate-spin h-8 w-8 text-text-primary mx-auto"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          <p className="text-xs uppercase tracking-widest text-text-secondary font-sans font-medium">
            Verifying Atelier Order Token...
          </p>
        </div>
      </div>
    );
  }

  if (isUnauthorized || !order) {
    return (
      <div className="bg-canvas-bg text-text-primary min-h-[75vh] flex items-center py-16">
        <Container size="sm" className="text-center">
          <div className="bg-surface-white border border-border-subtle rounded-2xl p-8 sm:p-10 shadow-xs max-w-lg mx-auto space-y-6">
            <div className="w-14 h-14 mx-auto rounded-full bg-surface-subtle border border-border-subtle flex items-center justify-center text-text-primary text-xl">
              <span>🔒</span>
            </div>

            <div className="space-y-2 font-sans">
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-accent-gold block">
                Security Verification Gate
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-text-primary">
                Order Access Protected
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary max-w-md mx-auto leading-relaxed">
                We could not authenticate ownership of order reference <strong>{orderReference}</strong>. To view sensitive customer and delivery details, please use the direct verification link issued upon checkout completion.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
              <Button href="/shop" variant="primary" size="lg" showArrow>
                Return to Catalog
              </Button>
              <Button href="/" variant="secondary" size="lg">
                Store Homepage
              </Button>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  const { customer, items, subtotalPkr, discountTotalPkr, deliveryFeePkr, totalPkr } = order;

  return (
    <div className="bg-canvas-bg text-text-primary min-h-screen py-10 sm:py-16">
      <Container size="md" className="space-y-8">
        {/* Celebration Header */}
        <div className="text-center space-y-3 pb-8 border-b border-border-subtle">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border-2 border-emerald-300 flex items-center justify-center text-emerald-600 shadow-xs">
            <svg
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>

          <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-accent-gold block font-sans">
            Atelier Order Confirmed
          </span>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary tracking-tight">
            Thank You for Your Order
          </h1>

          <p className="text-xs sm:text-sm text-text-secondary font-sans max-w-lg mx-auto leading-relaxed">
            Your pieces have been reserved. Our packaging team is preparing your package for express domestic dispatch.
          </p>

          <div className="pt-2 inline-flex items-center gap-2 px-4 py-1.5 bg-surface-white border border-border-subtle rounded-full font-mono text-xs sm:text-sm text-text-primary shadow-xs">
            <span className="text-text-secondary uppercase text-[10px] font-sans font-medium">Reference:</span>
            <strong className="tracking-wider text-text-primary font-semibold">{order.orderReference}</strong>
          </div>
        </div>

        {/* Payment Method Notice & Instructions Banner */}
        <div className="p-5 sm:p-6 bg-surface-white border border-border-subtle rounded-2xl shadow-xs space-y-3 font-sans">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">
                {order.paymentMethod === "BANK_TRANSFER"
                  ? "🏦"
                  : order.paymentMethod === "JAZZCASH" || order.paymentMethod === "EASYPAISA"
                  ? "📱"
                  : "🇵🇰"}
              </span>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-text-primary">
                {order.paymentMethod === "JAZZCASH"
                  ? "JazzCash Mobile Transfer"
                  : order.paymentMethod === "EASYPAISA"
                  ? "EasyPaisa Mobile Transfer"
                  : order.paymentMethod === "BANK_TRANSFER"
                  ? "Direct Bank Transfer (IBFT)"
                  : "Payment on Delivery (COD)"}
              </h2>
            </div>
            <span
              className={`text-xs font-semibold uppercase tracking-wider px-3 py-1 border rounded-full ${
                order.paymentStatus === "PAID"
                  ? "text-emerald-800 bg-emerald-50 border-emerald-200"
                  : "text-amber-800 bg-amber-50 border-amber-200/80"
              }`}
            >
              Status: {order.paymentStatus === "PAID" ? "Payment Confirmed" : "Payment Verification Pending"}
            </span>
          </div>

          {order.paymentMethod === "CASH_ON_DELIVERY" ? (
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Please keep <strong className="text-text-primary font-bold">{formatPKR(totalPkr)}</strong> in cash ready at the time of delivery. The courier representative will collect payment and hand over your sealed package.
            </p>
          ) : order.paymentMethod === "BANK_TRANSFER" ? (
            <div className="space-y-2 text-xs sm:text-sm text-text-secondary leading-relaxed">
              <p>
                Total settlement: <strong className="text-text-primary font-bold">{formatPKR(totalPkr)}</strong>. Transferred to{" "}
                <strong className="text-text-primary">{PAYMENT_ACCOUNTS.BANK_TRANSFER.bankName}</strong> (IBAN:{" "}
                <span className="font-mono font-bold text-text-primary">{PAYMENT_ACCOUNTS.BANK_TRANSFER.iban}</span>).
              </p>
              <p className="text-[11px] text-text-secondary">
                Our accounts team will verify the bank clearance against your reference and dispatch the parcel promptly.
              </p>
            </div>
          ) : (
            <div className="space-y-2 text-xs sm:text-sm text-text-secondary leading-relaxed">
              <p>
                Total settlement: <strong className="text-text-primary font-bold">{formatPKR(totalPkr)}</strong> initiated via{" "}
                <strong className="text-text-primary">
                  {order.paymentMethod === "JAZZCASH" ? "JazzCash" : "EasyPaisa"}
                </strong>
                .
              </p>
              <p className="text-[11px] text-text-secondary">
                Our verification desk is reconciling your transaction ID with our merchant statement. Once verified, dispatch tracking will be sent via SMS.
              </p>
            </div>
          )}

          <p className="text-[11px] text-text-secondary bg-surface-subtle/60 px-3 py-1.5 rounded-lg inline-block border border-border-subtle/60">
            • Need help? Contact concierge at <span className="font-medium text-text-primary">{OFFICIAL_PHONE}</span> or <span className="font-medium text-text-primary">{OFFICIAL_EMAIL}</span>.
          </p>
        </div>

        {/* 2-Column Details: Shipping Destination & Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
          {/* Shipping Details */}
          <div className="p-5 sm:p-6 bg-surface-white border border-border-subtle rounded-2xl shadow-xs space-y-3">
            <h3 className="font-serif text-base font-bold text-text-primary border-b border-border-subtle pb-2">
              Delivery Destination
            </h3>

            <div className="text-xs text-text-secondary space-y-1.5 leading-relaxed">
              <p className="font-semibold text-text-primary text-sm">{customer.fullName}</p>
              <p className="font-mono text-text-primary font-medium">{customer.phone}</p>
              {customer.email && <p className="text-text-secondary">{customer.email}</p>}
              <p className="pt-1 text-text-primary">{customer.streetAddress}</p>
              <p className="text-text-primary">{customer.area}, {customer.city}</p>
              <p className="text-text-primary">{customer.province} {customer.postalCode ? `(${customer.postalCode})` : ""}</p>
              {customer.landmark && (
                <p className="text-text-secondary text-[11px] pt-1 bg-surface-subtle/50 p-2 rounded-lg border border-border-subtle/50">
                  <strong className="text-text-primary">Landmark:</strong> {customer.landmark}
                </p>
              )}
              {customer.instructions && (
                <p className="text-text-secondary text-[11px] bg-surface-subtle/50 p-2 rounded-lg border border-border-subtle/50">
                  <strong className="text-text-primary">Instructions:</strong> {customer.instructions}
                </p>
              )}
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="p-5 sm:p-6 bg-surface-white border border-border-subtle rounded-2xl shadow-xs space-y-3">
            <h3 className="font-serif text-base font-bold text-text-primary border-b border-border-subtle pb-2">
              Order Settlement Summary
            </h3>

            <div className="text-xs text-text-secondary space-y-2">
              <div className="flex justify-between">
                <span>Subtotal ({items.length} items)</span>
                <span className="font-semibold text-text-primary">{formatPKR(subtotalPkr)}</span>
              </div>

              {discountTotalPkr > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Promotional Savings</span>
                  <span>−{formatPKR(discountTotalPkr)}</span>
                </div>
              )}

              <div className="flex justify-between items-baseline">
                <span>Delivery Charge</span>
                <span className="font-semibold">
                  {deliveryFeePkr === 0 ? (
                    <span className="text-emerald-600 uppercase text-[11px] font-bold">
                      Complimentary
                    </span>
                  ) : (
                    <span className="text-text-primary">{formatPKR(deliveryFeePkr)}</span>
                  )}
                </span>
              </div>

              <div className="pt-3 border-t border-border-subtle flex items-baseline justify-between text-sm">
                <span className="font-serif font-bold text-text-primary">Final Payable Amount</span>
                <span className="font-serif text-xl sm:text-2xl font-bold text-text-primary">
                  {formatPKR(totalPkr)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Itemized Garment List */}
        <div className="p-5 sm:p-6 bg-surface-white border border-border-subtle rounded-2xl shadow-xs space-y-4 font-sans">
          <h3 className="font-serif text-base font-bold text-text-primary border-b border-border-subtle pb-2">
            Reserved Items
          </h3>

          <div className="divide-y divide-border-subtle">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.size}-${item.color}`}
                className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative w-14 h-18 flex-shrink-0 bg-surface-subtle border border-border-subtle rounded-lg overflow-hidden">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-serif text-sm font-semibold text-text-primary truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-text-secondary">
                      {item.categoryName} • SKU: {item.sku}
                    </p>
                    <p className="text-xs text-text-secondary pt-0.5">
                      Size: <strong className="text-text-primary">{item.size}</strong> • Color: <strong className="text-text-primary">{item.color}</strong> • Qty: <strong className="text-text-primary">{item.quantity}</strong>
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="font-serif text-sm sm:text-base font-bold text-text-primary">
                    {formatPKR(item.lineTotalPkr)}
                  </p>
                  <p className="text-[10px] text-text-secondary">
                    {formatPKR(item.unitPricePkr)} each
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
          <Button href="/shop" variant="primary" size="lg" showArrow>
            Continue Shopping
          </Button>
          <Button href="/" variant="secondary" size="lg">
            Return to Homepage
          </Button>
        </div>
      </Container>
    </div>
  );
}
