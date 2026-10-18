import React from "react";
import type { Metadata } from "next";
import { CheckoutPageView } from "@/components/checkout/CheckoutPageView";

export const metadata: Metadata = {
  title: "Checkout & Delivery",
  description:
    "Cash on Delivery checkout and customer shipping address entry for domestic Pakistani delivery.",
  openGraph: {
    title: "Checkout & Delivery | NOIR & GOLD Atelier",
    description:
      "Cash on Delivery checkout and customer shipping address entry for domestic Pakistani delivery.",
  },
};

export default function CheckoutPage() {
  return <CheckoutPageView />;
}
