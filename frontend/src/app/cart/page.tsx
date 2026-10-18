import React from "react";
import type { Metadata } from "next";
import { CartPageView } from "@/components/cart/CartPageView";

export const metadata: Metadata = {
  title: "Shopping Bag",
  description:
    "Review and manage your selected luxury garments in your NOIR & GOLD shopping bag before proceeding to Cash on Delivery checkout.",
  openGraph: {
    title: "Shopping Bag | NOIR & GOLD Atelier",
    description:
      "Review and manage your selected luxury garments in your NOIR & GOLD shopping bag before proceeding to Cash on Delivery checkout.",
  },
};

export default function CartPage() {
  return <CartPageView />;
}
