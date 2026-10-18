import React, { Suspense } from "react";
import type { Metadata } from "next";
import { AccountOrderLookupView } from "@/components/account/AccountOrderLookupView";
import { Container } from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "Track Your Order | NOIR & GOLD Atelier",
  description:
    "Real-time domestic Cash on Delivery order tracking and dispatch status across Pakistan.",
};

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-canvas-bg min-h-screen py-16">
          <Container size="md">
            <div className="h-48 bg-surface-white border border-border-subtle rounded-2xl animate-pulse" />
          </Container>
        </div>
      }
    >
      <AccountOrderLookupView />
    </Suspense>
  );
}
