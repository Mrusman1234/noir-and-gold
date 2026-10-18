import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes with clsx and twMerge to safely resolve conflicts.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats a monetary number into standard Pakistani Rupee (PKR) representation.
 * Example: formatPKR(24500) -> "PKR 24,500"
 */
export function formatPKR(amount: number): string {
  const formatted = new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);

  return `PKR ${formatted}`;
}
