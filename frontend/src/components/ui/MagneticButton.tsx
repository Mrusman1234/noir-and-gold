"use client";

import React, { useRef, useState, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface MagneticButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "secondary" | "gold" | "outline";
  size?: "sm" | "md" | "lg";
  showArrow?: boolean;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  ariaLabel?: string;
}

export function MagneticButton({
  children,
  href,
  onClick,
  className,
  variant = "primary",
  size = "md",
  showArrow = false,
  type = "button",
  disabled = false,
  ariaLabel,
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement | HTMLAnchorElement | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Small, bounded magnetic movement (max 6px)
    const distanceX = (e.clientX - centerX) * 0.18;
    const distanceY = (e.clientY - centerY) * 0.18;

    setPosition({
      x: Math.max(-6, Math.min(6, distanceX)),
      y: Math.max(-6, Math.min(6, distanceY)),
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setPosition({ x: 0, y: 0 });
  }, []);

  const baseStyles =
    "group relative inline-flex items-center justify-center font-sans tracking-[0.14em] uppercase font-semibold transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary active:scale-[0.98] select-none";

  const sizeStyles = {
    sm: "px-5 py-2.5 text-[11px] rounded-full gap-2",
    md: "px-7 py-3.5 text-xs rounded-full gap-2.5",
    lg: "px-9 py-4 text-xs sm:text-[13px] rounded-full gap-3",
  };

  const variantStyles = {
    primary:
      "bg-text-primary text-surface-white hover:bg-black hover:shadow-lg hover:shadow-black/10 border border-transparent",
    secondary:
      "bg-surface-white text-text-primary border border-border-subtle hover:border-text-primary hover:bg-surface-subtle",
    gold: "bg-accent-gold text-surface-white hover:bg-[#8f7547] border border-transparent shadow-sm",
    outline:
      "bg-transparent text-text-primary border border-text-primary/30 hover:border-text-primary hover:bg-surface-white/60",
  };

  const content = (
    <>
      <span className="relative z-10 flex items-center gap-2">
        {children}
        {showArrow && (
          <span
            className="inline-block transition-transform duration-300 group-hover:translate-x-1"
            aria-hidden="true"
          >
            →
          </span>
        )}
      </span>
      {/* Subtle luxury sheen highlight on hover */}
      <span
        className="pointer-events-none absolute inset-0 -z-0 rounded-full bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden="true"
      />
    </>
  );

  const style = {
    transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
  };

  if (href) {
    return (
      <Link
        href={href}
        ref={buttonRef as React.Ref<HTMLAnchorElement>}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={style}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        aria-label={ariaLabel}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      ref={buttonRef as React.Ref<HTMLButtonElement>}
      onClick={onClick}
      disabled={disabled}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={style}
      className={cn(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      aria-label={ariaLabel}
    >
      {content}
    </button>
  );
}
