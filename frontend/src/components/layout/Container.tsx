import React from "react";
import { cn } from "@/lib/utils";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: "div" | "section" | "main" | "header" | "footer" | "article";
  size?: "sm" | "md" | "lg" | "xl" | "full";
  children: React.ReactNode;
}

export function Container({
  as: Component = "div",
  size = "xl",
  className,
  children,
  ...props
}: ContainerProps) {
  const sizeClasses = {
    sm: "max-w-3xl",        /* 768px - focused reading & legal policy pages */
    md: "max-w-5xl",        /* 1024px - forms, account management, compact tables */
    lg: "max-w-7xl",        /* 1280px - standard editorial text spreads */
    xl: "max-w-[1536px]",   /* 1536px - expansive international fashion grids & campaigns (92-95% viewport) */
    full: "max-w-full",     /* 100% full-width */
  };

  return (
    <Component
      className={cn(
        "mx-auto w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
