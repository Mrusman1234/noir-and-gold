"use client";

import React from "react";
import { formatPKR } from "@/lib/utils";

interface FreeDeliveryMeterProps {
  subtotalPkr: number;
  thresholdPkr: number;
  isEligible: boolean;
  amountNeeded: number;
}

export function FreeDeliveryMeter({
  subtotalPkr,
  thresholdPkr,
  isEligible,
  amountNeeded,
}: FreeDeliveryMeterProps) {
  const percentage = Math.min(100, Math.round((subtotalPkr / thresholdPkr) * 100));

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-white p-4 space-y-2.5 font-sans shadow-xs">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-primary font-medium flex items-center gap-1.5">
          <span>🇵🇰</span>
          <span>Complimentary Delivery across Pakistan</span>
        </span>
        <span className={`font-semibold text-xs ${isEligible ? "text-emerald-700" : "text-text-primary"}`}>
          {isEligible ? "Unlocked ✓" : `${percentage}%`}
        </span>
      </div>

      {/* Progress Bar Track */}
      <div
        className="w-full h-2 rounded-full bg-surface-subtle overflow-hidden"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Free delivery progress"
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            isEligible ? "bg-emerald-600" : "bg-text-primary"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Notification Text */}
      <p className="text-[11px] leading-relaxed">
        {isEligible ? (
          <span className="text-emerald-700 font-medium">
            Congratulations! Your order qualifies for <strong>Complimentary Express Delivery</strong> nationwide.
          </span>
        ) : (
          <span className="text-text-secondary">
            Add <strong className="text-text-primary font-semibold">{formatPKR(amountNeeded)}</strong> more to unlock Free Delivery across Pakistan (Orders over {formatPKR(thresholdPkr)}).
          </span>
        )}
      </p>
    </div>
  );
}
