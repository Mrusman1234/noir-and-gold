import React, { Suspense } from "react";
import type { Metadata } from "next";
import { AccountOrderLookupView } from "@/components/account/AccountOrderLookupView";
import { Container } from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "Client Care & Order Lookup | NOIR & GOLD",
  description:
    "Look up and track your Cash on Delivery orders, view delivery progress, and access client concierge support.",
};

export default function AccountPage() {
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
