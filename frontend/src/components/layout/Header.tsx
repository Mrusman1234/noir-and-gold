"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { BRAND_NAME, OFFICIAL_WHATSAPP_LINK } from "@/lib/constants";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/shop/women", label: "Women" },
  { href: "/shop/men", label: "Men" },
  { href: "/shop?sort=newest", label: "Collections" },
  { href: "/about", label: "About" },
];

export function Header() {
  const pathname = usePathname();
  const { totalCount } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
        setIsMegaMenuOpen(false);
      }
    },
    []
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const closeMenu = () => {
    setIsMobileMenuOpen(false);
    setIsMegaMenuOpen(false);
  };

  const isActive = (href: string) => {
    if (href === "/shop") return pathname === "/shop";
    if (href.includes("?")) {
      return false;
    }
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface-white/95 backdrop-blur-md transition-colors duration-200">
      <Container size="xl">
        <div className="flex h-16 items-center justify-between sm:h-20">
          {/* Mobile Menu Trigger */}
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-text-primary transition-colors hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary"
              aria-controls="mobile-navigation-menu"
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {isMobileMenuOpen ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>

          {/* Left: Brand Identity */}
          <div className="flex items-center">
            <Link
              href="/"
              onClick={closeMenu}
              className="group flex flex-col items-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary"
            >
              <span className="font-serif text-lg font-medium tracking-[0.14em] text-text-primary sm:text-2xl">
                {BRAND_NAME}
              </span>
              <span className="text-[8px] uppercase tracking-[0.24em] text-text-secondary sm:text-[9px]">
                Atelier · Pakistan
              </span>
            </Link>
          </div>

          {/* Center: Desktop Navigation & Mega Menu */}
          <nav aria-label="Primary navigation" className="hidden items-center gap-7 lg:flex">
            {NAV.map((item) => (
              <div
                key={item.href}
                className="relative"
                onMouseEnter={() => item.label === "Collections" && setIsMegaMenuOpen(true)}
                onMouseLeave={() => item.label === "Collections" && setIsMegaMenuOpen(false)}
              >
                <Link
                  href={item.href}
                  data-active={isActive(item.href)}
                  className={cn(
                    "editorial-link py-1 text-[11px] uppercase tracking-[0.16em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary",
                    isActive(item.href)
                      ? "text-text-primary font-semibold"
                      : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  {item.label}
                </Link>

                {item.label === "Collections" && isMegaMenuOpen && (
                  <div className="absolute left-1/2 top-full -translate-x-1/2 pt-3 w-80">
                    <div className="rounded-lg border border-border-subtle bg-surface-white p-5 shadow-lg">
                      <div className="grid grid-cols-2 gap-4 text-left">
                        <div>
                          <p className="text-[10px] uppercase font-bold tracking-[0.18em] text-text-primary mb-2">
                            Women
                          </p>
                          <ul className="space-y-1.5 text-xs text-text-secondary">
                            <li>
                              <Link href="/shop/women" onClick={closeMenu} className="hover:text-text-primary">
                                Luxury Prêt
                              </Link>
                            </li>
                            <li>
                              <Link href="/shop/women" onClick={closeMenu} className="hover:text-text-primary">
                                Formal Couture
                              </Link>
                            </li>
                            <li>
                              <Link href="/shop/women" onClick={closeMenu} className="hover:text-text-primary">
                                Velvet Anarkalis
                              </Link>
                            </li>
                          </ul>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold tracking-[0.18em] text-text-primary mb-2">
                            Men
                          </p>
                          <ul className="space-y-1.5 text-xs text-text-secondary">
                            <li>
                              <Link href="/shop/men" onClick={closeMenu} className="hover:text-text-primary">
                                Bespoke Sherwanis
                              </Link>
                            </li>
                            <li>
                              <Link href="/shop/men" onClick={closeMenu} className="hover:text-text-primary">
                                Prince Coats
                              </Link>
                            </li>
                            <li>
                              <Link href="/shop/men" onClick={closeMenu} className="hover:text-text-primary">
                                Luxury Kurtas
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-border-subtle">
                        <Link
                          href="/shop"
                          onClick={closeMenu}
                          className="editorial-link text-[10px] uppercase tracking-[0.16em] text-text-primary font-medium"
                        >
                          View Full Seasonal Edit →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Right: Actions (Search, WhatsApp Concierge, Shopping Bag) */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/shop"
              aria-label="Search catalog"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center p-2 text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </Link>

            <a
              href={OFFICIAL_WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp Concierge"
              className="hidden sm:flex min-h-[44px] items-center gap-1.5 px-3 text-[11px] uppercase tracking-[0.12em] text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary"
            >
              <span>Concierge</span>
              <span className="text-[10px]">↗</span>
            </a>

            <Link
              href="/account"
              aria-label="Order Tracking & Client Care"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center p-2 text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </Link>

            <Link
              href="/shop"
              aria-label="Wishlist saved pieces"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center p-2 text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary"
            >
              <Heart className="h-5 w-5 stroke-[1.5]" />
            </Link>

            <Link
              href="/cart"
              aria-label={totalCount > 0 ? `Shopping bag (${totalCount} items)` : "Shopping bag"}
              className="relative flex min-h-[44px] min-w-[44px] items-center justify-center p-2 text-text-primary transition-colors hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25c-.669 0-1.188-.578-1.119-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              {totalCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-text-primary px-1 text-[9px] font-bold text-surface-white">
                  {totalCount > 99 ? "99+" : totalCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </Container>

      {/* Accessible Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div
          id="mobile-navigation-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
          className="fixed inset-x-0 bottom-0 top-[calc(56px+37px)] z-50 overflow-y-auto border-t border-border-subtle bg-surface-white sm:top-[calc(64px+37px)] lg:hidden"
        >
          <div className="flex min-h-full flex-col px-6 py-8">
            <div className="mb-6">
              <Link
                href="/shop"
                onClick={closeMenu}
                className="flex items-center gap-2 rounded-full border border-border-subtle bg-surface-subtle px-4 py-2.5 text-xs text-text-secondary"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <span>Search collection...</span>
              </Link>
            </div>

            <p className="mb-4 text-[10px] uppercase font-bold tracking-[0.24em] text-text-secondary">
              Collections
            </p>
            <div className="space-y-1">
              <Link
                href="/shop/women"
                onClick={closeMenu}
                className="flex items-center justify-between py-3.5 font-serif text-2xl text-text-primary border-b border-border-subtle/50"
              >
                <span>Women</span>
                <span className="text-sm text-text-secondary">→</span>
              </Link>
              <Link
                href="/shop/men"
                onClick={closeMenu}
                className="flex items-center justify-between py-3.5 font-serif text-2xl text-text-primary border-b border-border-subtle/50"
              >
                <span>Men</span>
                <span className="text-sm text-text-secondary">→</span>
              </Link>
              <Link
                href="/shop?sort=newest"
                onClick={closeMenu}
                className="flex items-center justify-between py-3.5 font-serif text-2xl text-text-primary border-b border-border-subtle/50"
              >
                <span>New Arrivals</span>
                <span className="text-sm text-text-secondary">→</span>
              </Link>
              <Link
                href="/shop"
                onClick={closeMenu}
                className="flex items-center justify-between py-3.5 font-serif text-2xl text-text-primary border-b border-border-subtle/50"
              >
                <span>All Catalog</span>
                <span className="text-sm text-text-secondary">→</span>
              </Link>
            </div>

            <div className="mt-8 space-y-2 border-t border-border-subtle pt-6 text-sm text-text-secondary">
              <Link
                href="/track-order"
                onClick={closeMenu}
                className="flex items-center justify-between py-2 text-text-primary font-medium hover:text-text-primary"
              >
                <span>Track Your Order</span>
                <span className="text-xs">→</span>
              </Link>
              <Link
                href="/about"
                onClick={closeMenu}
                className="flex items-center justify-between py-2 hover:text-text-primary"
              >
                <span>Heritage &amp; Atelier Story</span>
                <span className="text-xs">→</span>
              </Link>
              <Link
                href="/contact"
                onClick={closeMenu}
                className="flex items-center justify-between py-2 hover:text-text-primary"
              >
                <span>Client Concierge &amp; Salons</span>
                <span className="text-xs">→</span>
              </Link>
              <Link
                href="/shipping-policy"
                onClick={closeMenu}
                className="flex items-center justify-between py-2 hover:text-text-primary"
              >
                <span>Nationwide Shipping &amp; COD</span>
                <span className="text-xs">→</span>
              </Link>
              <Link
                href="/returns"
                onClick={closeMenu}
                className="flex items-center justify-between py-2 hover:text-text-primary"
              >
                <span>7-Day Doorstep Exchange</span>
                <span className="text-xs">→</span>
              </Link>
              <Link
                href="/faq"
                onClick={closeMenu}
                className="flex items-center justify-between py-2 hover:text-text-primary"
              >
                <span>Frequently Asked Questions</span>
                <span className="text-xs">→</span>
              </Link>
              <a
                href={OFFICIAL_WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between py-2 text-text-primary font-medium hover:text-text-primary pt-2 border-t border-border-subtle/50"
              >
                <span>WhatsApp Concierge</span>
                <span className="text-xs">↗</span>
              </a>
              <Link
                href="/admin"
                onClick={closeMenu}
                className="flex items-center justify-between py-2 text-xs uppercase tracking-[0.14em] text-text-secondary hover:text-text-primary"
              >
                <span>Operations Portal</span>
                <span className="text-xs">→</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
