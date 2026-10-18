import React from "react";
import { Container } from "@/components/layout/Container";
import { FREE_SHIPPING_THRESHOLD_PKR } from "@/lib/constants";
import { formatPKR } from "@/lib/utils";

export interface AnnouncementBarProps {
  message?: string;
  secondaryNotice?: string;
}

export function AnnouncementBar({
  message,
  secondaryNotice = "Cash on Delivery · Nationwide",
}: AnnouncementBarProps) {
  const defaultMessage = `Complimentary nationwide delivery above ${formatPKR(
    FREE_SHIPPING_THRESHOLD_PKR
  )}`;

  const activeMessage = message || defaultMessage;

  return (
    <aside
      aria-label="Promotional announcement"
      className="border-b border-border-subtle bg-surface-subtle py-2 text-text-primary"
    >
      <Container size="xl">
        <div className="flex items-center justify-center text-[10px] uppercase tracking-[0.18em] sm:justify-between sm:text-[11px]">
          <p className="truncate text-center font-medium sm:text-left">{activeMessage}</p>
          <span className="ml-4 hidden border-l border-border-subtle pl-4 text-text-secondary sm:inline-block">
            {secondaryNotice}
          </span>
        </div>
      </Container>
    </aside>
  );
}
