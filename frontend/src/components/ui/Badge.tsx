import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "gold" | "velvet" | "neutral" | "success" | "warning" | "error";
  children: React.ReactNode;
}

export function Badge({
  variant = "gold",
  className,
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    gold: "bg-[#FAF7F2] border border-accent-gold/50 text-[#8C7654]",
    velvet: "bg-surface-white border border-border-subtle text-text-secondary shadow-xs",
    neutral: "bg-surface-white border border-border-subtle text-text-secondary shadow-xs",
    success: "bg-status-success/10 border border-status-success/25 text-status-success",
    warning: "bg-status-warning/10 border border-status-warning/25 text-status-warning",
    error: "bg-status-error/10 border border-status-error/25 text-status-error",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] rounded-full",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
