import React, { Suspense } from "react";
import type { Metadata } from "next";
import { OrderSuccessView } from "@/components/checkout/OrderSuccessView";
import { OrderSuccessSkeleton } from "@/components/checkout/OrderSuccessSkeleton";

interface PageProps {
  params: Promise<{
    orderReference: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { orderReference } = await params;
  return {
    title: `Order Confirmed: ${orderReference}`,
    description: `Order confirmation and delivery invoice for order ${orderReference}.`,
  };
}

async function OrderSuccessContent({
  params,
}: {
  params: Promise<{ orderReference: string }>;
}) {
  const { orderReference } = await params;
  return <OrderSuccessView orderReference={orderReference} />;
}

export default function OrderSuccessPage({ params }: PageProps) {
  return (
    <Suspense fallback={<OrderSuccessSkeleton />}>
      <OrderSuccessContent params={params} />
    </Suspense>
  );
}
