import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "capsule" | "secondary" | "outline" | "editorial" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  loadingText?: string;
  showArrow?: boolean;
  href?: string;
}

const variantStyles = {
  primary:
    "rounded-full bg-text-primary text-surface-white font-medium tracking-[0.08em] hover:bg-[#383733] hover:shadow-[0_4px_16px_rgba(37,37,34,0.12)] active:translate-y-px border border-text-primary",
  secondary:
    "rounded-full bg-surface-white/90 border border-border-hover text-text-primary tracking-[0.08em] font-medium hover:border-text-primary hover:bg-surface-subtle active:translate-y-px shadow-xs",
  ghost:
    "bg-transparent text-text-primary hover:text-text-secondary tracking-[0.08em] font-medium editorial-link p-0 h-auto rounded-none border-0",
  destructive:
    "rounded-full bg-status-error/10 border border-status-error/30 text-status-error hover:bg-status-error/20 tracking-[0.08em] font-medium",
} as const;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      loadingText = "Processing...",
      showArrow = false,
      href,
      disabled,
      className,
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    const resolvedVariant =
      variant === "capsule"
        ? "primary"
        : variant === "outline"
          ? "secondary"
          : variant === "editorial"
            ? "ghost"
            : variant;

    const sizeStyles = {
      sm: resolvedVariant === "ghost" ? "min-h-8 text-[11px] uppercase" : "h-10 px-5 text-[11px] uppercase",
      md: resolvedVariant === "ghost" ? "min-h-9 text-xs uppercase" : "h-12 px-7 text-xs uppercase",
      lg: resolvedVariant === "ghost" ? "min-h-10 text-xs uppercase" : "h-[3.25rem] px-8 sm:px-9 text-xs sm:text-[13px] uppercase",
    };

    const classes = cn(
      "group inline-flex items-center justify-center gap-2.5 transition-all duration-200 select-none cursor-pointer",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas-bg",
      "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
      variantStyles[resolvedVariant],
      sizeStyles[size],
      className
    );

    const content = isLoading ? (
      <span className="inline-flex items-center gap-2">
        <svg
          className="animate-spin h-3.5 w-3.5 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
        <span>{loadingText}</span>
      </span>
    ) : (
      <>
        <span className="relative z-1">{children}</span>
        {showArrow && (
          <span
            aria-hidden="true"
            className="relative z-1 inline-block transition-transform duration-200 ease-out group-hover:translate-x-1"
          >
            →
          </span>
        )}
      </>
    );

    if (href) {
      return (
        <Link
          href={href}
          className={classes}
          aria-disabled={disabled || isLoading}
          tabIndex={disabled || isLoading ? -1 : undefined}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={classes}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = "Button";
