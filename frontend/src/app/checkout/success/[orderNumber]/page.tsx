import React, { Suspense } from "react";
import type { Metadata } from "next";
import { OrderSuccessView } from "@/components/checkout/OrderSuccessView";
import { OrderSuccessSkeleton } from "@/components/checkout/OrderSuccessSkeleton";

interface Props {
  params: Promise<{
    orderNumber: string;
  }>;
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { orderNumber } = await params;
  return {
    title: `Order Confirmed: ${orderNumber}`,
    description: `Order confirmation and delivery invoice for order ${orderNumber}.`,
  };
}

async function CheckoutSuccessContent({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  return <OrderSuccessView orderReference={orderNumber} />;
}

export default function CheckoutSuccessPage({ params }: Props) {
  return (
    <Suspense fallback={<OrderSuccessSkeleton />}>
      <CheckoutSuccessContent params={params} />
    </Suspense>
  );
}
