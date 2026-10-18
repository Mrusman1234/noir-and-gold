"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatPKR } from "@/lib/utils";
import {
  OFFICIAL_WHATSAPP_LINK,
  OFFICIAL_EMAIL,
} from "@/lib/constants";
import { OrderRecord } from "@/types";

interface StoredOrderRef {
  orderReference: string;
  verificationToken: string;
  placedAt: string;
}

const RECENT_ORDERS_KEY = "noir_gold_recent_orders";

export function AccountOrderLookupView() {
  const searchParams = useSearchParams();
  const queryRef = searchParams.get("ref") || searchParams.get("order") || "";
  const queryToken = searchParams.get("token") || "";

  const [orderReference, setOrderReference] = useState(queryRef);
  const [verificationToken, setVerificationToken] = useState(queryToken);
  const [recentOrders, setRecentOrders] = useState<StoredOrderRef[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(RECENT_ORDERS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage read failures
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(queryRef && queryToken));
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-fetch if both ref and token are present in query params
  useEffect(() => {
    if (!queryRef || !queryToken) return;

    let isMounted = true;
    const cleanRef = queryRef.trim().toUpperCase();
    const cleanToken = queryToken.trim();

    async function fetchQueryOrder() {
      try {
        const res = await fetch(
          `/api/v1/orders/${encodeURIComponent(cleanRef)}?token=${encodeURIComponent(cleanToken)}`
        );
        const data = await res.json();
        if (!isMounted) return;

        if (res.ok && data.success && data.order) {
          setOrder(data.order);
        } else {
          setErrorMessage(
            data.error?.message ||
              "Order not found or verification token is invalid. Please check your details and try again."
          );
        }
      } catch {
        if (isMounted) {
          setErrorMessage(
            "Unable to reach the atelier server. Please check your connection and try again."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void fetchQueryOrder();

    return () => {
      isMounted = false;
    };
  }, [queryRef, queryToken]);

  const handleLookup = useCallback(
    async (ref: string, token: string) => {
      const cleanRef = ref.trim().toUpperCase();
      const cleanToken = token.trim();

      if (!cleanRef) {
        setErrorMessage("Please enter your Order Reference (e.g. NG-20261016-XXXX).");
        return;
      }
      if (!cleanToken) {
        setErrorMessage(
          "Please enter your Verification Token (found in your order confirmation link or SMS)."
        );
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);
      setOrder(null);

      try {
        const res = await fetch(
          `/api/v1/orders/${encodeURIComponent(cleanRef)}?token=${encodeURIComponent(
            cleanToken
          )}`
        );
        const data = await res.json();

        if (res.ok && data.success && data.order) {
          setOrder(data.order);

          // Save to recent orders in localStorage
          try {
            const current = recentOrders.filter(
              (o) => o.orderReference !== cleanRef
            );
            const updated = [
              {
                orderReference: cleanRef,
                verificationToken: cleanToken,
                placedAt: new Date().toISOString(),
              },
              ...current,
            ].slice(0, 5);
            localStorage.setItem(RECENT_ORDERS_KEY, JSON.stringify(updated));
            setRecentOrders(updated);
          } catch {
            // Ignore storage write failures
          }
        } else {
          setErrorMessage(
            data.error?.message ||
              "Order not found or verification token is invalid. Please check your details and try again."
          );
        }
      } catch {
        setErrorMessage(
          "Unable to reach the atelier server. Please check your connection and try again."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [recentOrders]
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return <Badge variant="success">Confirmed &amp; Reserved</Badge>;
      case "PROCESSING":
        return <Badge variant="warning">Handcrafted in Atelier</Badge>;
      case "DISPATCHED":
        return <Badge variant="gold">Dispatched with Courier</Badge>;
      case "DELIVERED":
        return <Badge variant="success">Successfully Delivered</Badge>;
      case "CANCELLED":
        return <Badge variant="error">Order Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="bg-canvas-bg min-h-screen py-10 sm:py-16 text-text-primary">
      <Container size="md" className="space-y-10">
        {/* Header */}
        <div className="text-center space-y-3 pb-6 border-b border-border-subtle">
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-accent-gold block font-sans">
            Client Order Concierge
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-text-primary">
            Track Your Order
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary font-sans max-w-md mx-auto leading-relaxed">
            Enter your order reference and security verification token to view real-time atelier progress, delivery destination, and payment status.
          </p>
        </div>

        {/* Lookup Card */}
        <div className="bg-surface-white border border-border-subtle rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookup(orderReference, verificationToken);
            }}
            className="space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="orderReferenceInput"
                  className="block text-xs font-semibold uppercase tracking-wider text-text-primary"
                >
                  Order Reference <span className="text-rose-500">*</span>
                </label>
                <input
                  id="orderReferenceInput"
                  type="text"
                  placeholder="e.g. NG-20261016-A1B2"
                  value={orderReference}
                  onChange={(e) => setOrderReference(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 text-sm bg-surface-white border border-border-subtle rounded-full text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:ring-1 focus:ring-text-primary uppercase font-mono tracking-wider transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="tokenInput"
                  className="block text-xs font-semibold uppercase tracking-wider text-text-primary"
                >
                  Verification Token <span className="text-rose-500">*</span>
                </label>
                <input
                  id="tokenInput"
                  type="text"
                  placeholder="e.g. 64-character token"
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-surface-white border border-border-subtle rounded-full text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:ring-1 focus:ring-text-primary font-mono text-xs transition-colors"
                  required
                />
              </div>
            </div>

            <p className="text-[11px] text-text-secondary leading-relaxed">
              💡 Your verification token was issued when your order was placed and is included in your confirmation page URL and SMS dispatch notification.
            </p>

            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
                <svg className="w-4 h-4 flex-shrink-0 text-rose-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? "Searching Atelier..." : "Track Order Status"}
              </Button>

              <a
                href={OFFICIAL_WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5"
              >
                <span>Need help? WhatsApp Concierge</span>
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </form>

          {/* Recent Orders Stored Locally */}
          {recentOrders.length > 0 && !order && (
            <div className="pt-6 border-t border-border-subtle space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary block">
                Recent Orders on this Device
              </span>
              <div className="flex flex-wrap gap-2">
                {recentOrders.map((ro) => (
                  <button
                    key={ro.orderReference}
                    type="button"
                    onClick={() => {
                      setOrderReference(ro.orderReference);
                      setVerificationToken(ro.verificationToken);
                      handleLookup(ro.orderReference, ro.verificationToken);
                    }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border-subtle bg-surface-subtle text-xs font-mono text-text-primary hover:bg-surface-white hover:border-text-primary transition-all cursor-pointer"
                  >
                    <span>{ro.orderReference}</span>
                    <span className="text-[10px] text-accent-gold">→</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Order Details Display */}
        {order && (
          <div className="space-y-6 animate-fadeIn">
            {/* Order Status Banner */}
            <div className="bg-surface-white border border-border-subtle rounded-2xl p-6 shadow-xs space-y-4 font-sans">
              <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-border-subtle">
                <div>
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-text-secondary block">
                    Order Reference
                  </span>
                  <span className="font-mono text-lg font-bold text-text-primary">
                    {order.orderReference}
                  </span>
                </div>
                <div>{getStatusBadge(order.orderStatus)}</div>
              </div>

              {/* Step Progress Bar */}
              <div className="py-2">
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="space-y-1">
                    <div className="h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                      1. Placed
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div
                      className={`h-1.5 rounded-full ${
                        ["PROCESSING", "DISPATCHED", "DELIVERED"].includes(
                          order.orderStatus
                        )
                          ? "bg-emerald-500"
                          : "bg-surface-subtle"
                      }`}
                    />
                    <span
                      className={`text-[10px] uppercase font-medium block ${
                        ["PROCESSING", "DISPATCHED", "DELIVERED"].includes(
                          order.orderStatus
                        )
                          ? "text-emerald-700 font-bold"
                          : "text-text-secondary"
                      }`}
                    >
                      2. Atelier
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div
                      className={`h-1.5 rounded-full ${
                        ["DISPATCHED", "DELIVERED"].includes(order.orderStatus)
                          ? "bg-emerald-500"
                          : "bg-surface-subtle"
                      }`}
                    />
                    <span
                      className={`text-[10px] uppercase font-medium block ${
                        ["DISPATCHED", "DELIVERED"].includes(order.orderStatus)
                          ? "text-emerald-700 font-bold"
                          : "text-text-secondary"
                      }`}
                    >
                      3. In Transit
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div
                      className={`h-1.5 rounded-full ${
                        order.orderStatus === "DELIVERED"
                          ? "bg-emerald-500"
                          : "bg-surface-subtle"
                      }`}
                    />
                    <span
                      className={`text-[10px] uppercase font-medium block ${
                        order.orderStatus === "DELIVERED"
                          ? "text-emerald-700 font-bold"
                          : "text-text-secondary"
                      }`}
                    >
                      4. Delivered
                    </span>
                  </div>
                </div>
              </div>

              {/* Courier Info if dispatched */}
              {order.courierInfo && (
                <div className="p-4 rounded-xl bg-surface-subtle border border-border-subtle text-xs space-y-1 font-sans">
                  <p className="font-semibold text-text-primary">
                    Courier: {order.courierInfo.courierName}
                  </p>
                  {order.courierInfo.trackingNumber && (
                    <p className="font-mono text-text-secondary">
                      Tracking ID: {order.courierInfo.trackingNumber}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 2-Column Details: Shipping & Financial */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
              {/* Shipping Address */}
              <div className="bg-surface-white border border-border-subtle rounded-2xl p-6 shadow-xs space-y-3">
                <h3 className="font-serif text-base font-bold text-text-primary border-b border-border-subtle pb-2">
                  Delivery Destination
                </h3>
                <div className="text-xs text-text-secondary space-y-1.5 leading-relaxed">
                  <p className="font-semibold text-text-primary text-sm">
                    {order.customer.fullName}
                  </p>
                  <p className="font-mono text-text-primary">{order.customer.phone}</p>
                  {order.customer.email && <p>{order.customer.email}</p>}
                  <p className="pt-1 text-text-primary">{order.customer.streetAddress}</p>
                  <p className="text-text-primary">
                    {order.customer.area}, {order.customer.city}
                  </p>
                  <p className="text-text-primary">
                    {order.customer.province}{" "}
                    {order.customer.postalCode ? `(${order.customer.postalCode})` : ""}
                  </p>
                </div>
              </div>

              {/* Settlement Summary */}
              <div className="bg-surface-white border border-border-subtle rounded-2xl p-6 shadow-xs space-y-3">
                <h3 className="font-serif text-base font-bold text-text-primary border-b border-border-subtle pb-2 flex items-center justify-between">
                  <span>
                    {order.paymentMethod === "JAZZCASH"
                      ? "JazzCash Mobile Transfer"
                      : order.paymentMethod === "EASYPAISA"
                      ? "EasyPaisa Mobile Transfer"
                      : order.paymentMethod === "BANK_TRANSFER"
                      ? "Direct Bank Transfer (IBFT)"
                      : "Cash on Delivery (COD)"}
                  </span>
                  <span className={`text-[10px] font-sans font-semibold uppercase px-2 py-0.5 rounded-full border ${
                    order.paymentStatus === "PAID"
                      ? "text-emerald-800 bg-emerald-50 border-emerald-200"
                      : "text-amber-800 bg-amber-50 border-amber-200/80"
                  }`}>
                    {order.paymentStatus === "PAID" ? "Paid" : "Verification Pending"}
                  </span>
                </h3>
                <div className="text-xs text-text-secondary space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-text-primary">
                      {formatPKR(order.subtotalPkr)}
                    </span>
                  </div>
                  {order.discountTotalPkr > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Discount</span>
                      <span>−{formatPKR(order.discountTotalPkr)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Delivery Charge</span>
                    <span className="font-semibold text-text-primary">
                      {order.deliveryFeePkr === 0
                        ? "Complimentary"
                        : formatPKR(order.deliveryFeePkr)}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-border-subtle flex justify-between items-baseline text-sm">
                    <span className="font-serif font-bold text-text-primary">
                      {order.paymentMethod === "CASH_ON_DELIVERY" ? "Payable at Doorstep" : "Total Order Settlement"}
                    </span>
                    <span className="font-serif text-xl font-bold text-text-primary">
                      {formatPKR(order.totalPkr)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Ordered */}
            <div className="bg-surface-white border border-border-subtle rounded-2xl p-6 shadow-xs space-y-4 font-sans">
              <h3 className="font-serif text-base font-bold text-text-primary border-b border-border-subtle pb-2">
                Ordered Items ({order.items.length})
              </h3>
              <div className="divide-y divide-border-subtle">
                {order.items.map((item) => (
                  <div
                    key={`${item.productId}-${item.size}-${item.color}`}
                    className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative w-12 h-16 flex-shrink-0 bg-surface-subtle border border-border-subtle rounded-lg overflow-hidden">
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-serif text-sm font-semibold text-text-primary truncate">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-text-secondary">
                          Size: <strong className="text-text-primary">{item.size}</strong> • Color:{" "}
                          <strong className="text-text-primary">{item.color}</strong> • Qty:{" "}
                          <strong className="text-text-primary">{item.quantity}</strong>
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-serif text-sm font-bold text-text-primary">
                        {formatPKR(item.lineTotalPkr)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Support Actions */}
            <div className="p-5 bg-surface-white border border-border-subtle rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
              <div className="space-y-0.5 text-center sm:text-left">
                <p className="font-serif text-sm font-bold text-text-primary">
                  Need an exchange or update on this order?
                </p>
                <p className="text-xs text-text-secondary">
                  Our client concierge responds swiftly via WhatsApp.
                </p>
              </div>
              <a
                href={`${OFFICIAL_WHATSAPP_LINK}?text=${encodeURIComponent(
                  `Hello, I would like to inquire about my order reference ${order.orderReference}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-text-primary text-surface-white text-xs font-semibold tracking-wider hover:opacity-90 transition-opacity"
              >
                <span>Chat on WhatsApp</span>
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        )}

        {/* Client Care Channels */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-center">
          <div className="p-5 rounded-2xl bg-surface-white border border-border-subtle space-y-1 shadow-xs">
            <span className="text-xl">💬</span>
            <h4 className="font-serif text-sm font-bold text-text-primary">WhatsApp</h4>
            <p className="text-xs text-text-secondary">Instant Assistance</p>
            <a
              href={OFFICIAL_WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-text-primary font-medium underline pt-1 block"
            >
              Open Concierge
            </a>
          </div>

          <div className="p-5 rounded-2xl bg-surface-white border border-border-subtle space-y-1 shadow-xs">
            <span className="text-xl">✉️</span>
            <h4 className="font-serif text-sm font-bold text-text-primary">Email</h4>
            <p className="text-xs text-text-secondary">Direct Inquiries</p>
            <a
              href={`mailto:${OFFICIAL_EMAIL}`}
              className="text-xs text-text-primary font-medium underline pt-1 block"
            >
              {OFFICIAL_EMAIL}
            </a>
          </div>

          <div className="p-5 rounded-2xl bg-surface-white border border-border-subtle space-y-1 shadow-xs">
            <span className="text-xl">🇵🇰</span>
            <h4 className="font-serif text-sm font-bold text-text-primary">Exchange</h4>
            <p className="text-xs text-text-secondary">7-Day Doorstep Swap</p>
            <Link
              href="/returns"
              className="text-xs text-text-primary font-medium underline pt-1 block"
            >
              Exchange Policy
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
