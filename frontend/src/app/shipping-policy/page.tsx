import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { formatPKR } from "@/lib/utils";
import {
  BRAND_NAME,
  FREE_SHIPPING_THRESHOLD_PKR,
  ESTIMATED_FLAT_SHIPPING_PKR,
  OFFICIAL_WHATSAPP_LINK,
} from "@/lib/constants";

export const metadata: Metadata = {
  title: `Nationwide Shipping Policy | ${BRAND_NAME}`,
  description:
    "Review our transparent domestic shipping timelines, Cash on Delivery procedures, and courier partners across Pakistan.",
};

export default function ShippingPolicyPage() {
  return (
    <div className="bg-canvas-bg min-h-screen py-12 sm:py-20 text-text-primary">
      <Container size="md" className="space-y-12">
        {/* Header */}
        <div className="text-center space-y-3 pb-6 border-b border-border-subtle">
          <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-accent-gold block font-sans">
            Domestic Logistics
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-text-primary">
            Nationwide Shipping Policy
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-lg mx-auto">
            Reliable, insured delivery across every postal zone in Pakistan via top domestic courier partners.
          </p>
        </div>

        {/* Timelines Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-white border border-border-subtle rounded-2xl p-6 shadow-xs space-y-2 text-center">
            <span className="text-2xl">⚡</span>
            <h3 className="font-serif text-base font-bold text-text-primary">
              Karachi Metro
            </h3>
            <p className="font-mono text-sm font-semibold text-text-primary">
              24 – 48 Hours
            </p>
            <p className="text-xs text-text-secondary">
              Direct dispatch from our Clifton atelier
            </p>
          </div>

          <div className="bg-surface-white border border-border-subtle rounded-2xl p-6 shadow-xs space-y-2 text-center">
            <span className="text-2xl">🏛️</span>
            <h3 className="font-serif text-base font-bold text-text-primary">
              Major Metros
            </h3>
            <p className="font-mono text-sm font-semibold text-text-primary">
              2 – 3 Business Days
            </p>
            <p className="text-xs text-text-secondary">
              Lahore, Islamabad, Rawalpindi, Faisalabad
            </p>
          </div>

          <div className="bg-surface-white border border-border-subtle rounded-2xl p-6 shadow-xs space-y-2 text-center">
            <span className="text-2xl">🇵🇰</span>
            <h3 className="font-serif text-base font-bold text-text-primary">
              All Other Districts
            </h3>
            <p className="font-mono text-sm font-semibold text-text-primary">
              3 – 5 Business Days
            </p>
            <p className="text-xs text-text-secondary">
              Full nationwide coverage via express air transit
            </p>
          </div>
        </div>

        {/* Delivery Rates & Threshold */}
        <div className="bg-surface-white border border-border-subtle rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
          <h2 className="font-serif text-xl font-bold text-text-primary border-b border-border-subtle pb-3">
            Shipping Charges &amp; Complimentary Threshold
          </h2>
          <div className="text-xs sm:text-sm text-text-secondary space-y-3 leading-relaxed">
            <p>
              • <strong className="text-text-primary">Complimentary Express Shipping:</strong> Available on all orders reaching or exceeding <strong>{formatPKR(FREE_SHIPPING_THRESHOLD_PKR)}</strong>. This is automatically calculated at bag and checkout.
            </p>
            <p>
              • <strong className="text-text-primary">Standard Shipping Fee:</strong> For orders below {formatPKR(FREE_SHIPPING_THRESHOLD_PKR)}, a flat fee of <strong>{formatPKR(ESTIMATED_FLAT_SHIPPING_PKR)}</strong> applies nationwide regardless of parcel weight.
            </p>
            <p>
              • <strong className="text-text-primary">Insured Transit:</strong> All packages are sealed with tamper-evident security tape and insured against transit damage or loss.
            </p>
          </div>
        </div>

        {/* Cash on Delivery Procedures */}
        <div className="bg-surface-white border border-border-subtle rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
          <h2 className="font-serif text-xl font-bold text-text-primary border-b border-border-subtle pb-3">
            Cash on Delivery (COD) Protocol
          </h2>
          <div className="text-xs sm:text-sm text-text-secondary space-y-3 leading-relaxed">
            <p>
              1. <strong>Verification:</strong> Upon placing your order, an automated SMS confirmation with your unique order reference and tracking token will be sent to your mobile phone.
            </p>
            <p>
              2. <strong>Dispatch Notification:</strong> When the parcel is handed over to our courier partner (TCS, Leopards, or Call Courier), you will receive a tracking link via SMS.
            </p>
            <p>
              3. <strong>Doorstep Payment:</strong> Please have the exact invoice amount ready in Pakistani Rupees (PKR). Courier riders do not always carry large amounts of cash change.
            </p>
            <p>
              4. <strong>Delivery Attempts:</strong> The courier will make up to two delivery attempts. If you are unavailable, they will leave a notice and coordinate a re-delivery time.
            </p>
          </div>
        </div>

        {/* Action Link to Track Order */}
        <div className="bg-surface-subtle border border-border-subtle rounded-2xl p-6 text-center space-y-3">
          <p className="font-serif text-base font-bold text-text-primary">
            Already have an active order in transit?
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/track-order"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-text-primary text-surface-white text-xs font-semibold tracking-wider hover:opacity-90 transition-opacity"
            >
              <span>Track Your Order Now</span>
              <span aria-hidden="true">→</span>
            </Link>
            <a
              href={OFFICIAL_WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-text-secondary hover:text-text-primary font-medium underline"
            >
              Contact Concierge via WhatsApp
            </a>
          </div>
        </div>
      </Container>
    </div>
  );
}
