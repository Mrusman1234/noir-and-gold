"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { ProductCard } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/Button";
import { ProductSortOption, ProductSummary } from "@/types";
import { formatPKR } from "@/lib/utils";

interface ProductListingViewProps {
  initialCategory?: string; // "women" | "men" | undefined
  initialProducts?: ProductSummary[];
}

export function ProductListingView({ initialCategory, initialProducts }: ProductListingViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // The catalog is always supplied by the server component (persistent database).
  // This client view never fabricates a fallback product list.
  const products = useMemo<ProductSummary[]>(() => initialProducts ?? [], [initialProducts]);

  // Mobile filter drawer state
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Extract filter parameters from URL
  const querySearch = searchParams.get("q") || "";
  const queryCategory = searchParams.get("category") || "";
  const queryAudience =
    searchParams.get("audience") ||
    (initialCategory === "women" ? "women" : initialCategory === "men" ? "men" : "");
  const querySize = searchParams.get("size") || "";
  const queryColor = searchParams.get("color") || "";
  const queryMinPrice = searchParams.get("minPrice") || "";
  const queryMaxPrice = searchParams.get("maxPrice") || "";
  const querySort = (searchParams.get("sort") as ProductSortOption) || "featured";

  // Local state for search input to allow smooth typing
  const [searchTerm, setSearchTerm] = useState(querySearch);
  const [prevQuerySearch, setPrevQuerySearch] = useState(querySearch);

  // Synchronize local search term with URL search param during render
  if (querySearch !== prevQuerySearch) {
    setPrevQuerySearch(querySearch);
    setSearchTerm(querySearch);
  }

  // Helper to update search params cleanly
  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      const queryString = params.toString();
      const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(targetUrl, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  // Handle live search submission or typing debounce
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ q: searchTerm.trim() || null });
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    updateParams({ q: null });
  };

  const handleClearAllFilters = () => {
    setSearchTerm("");
    const cleared: Record<string, string | null> = {
      q: null,
      category: null,
      size: null,
      color: null,
      minPrice: null,
      maxPrice: null,
      sort: null,
    };
    // If we're on a dedicated category landing page (e.g. /shop/women), preserve that audience
    if (!initialCategory) {
      cleared.audience = null;
    }
    updateParams(cleared);
  };

  // Keyboard accessibility: Close mobile drawer on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileFilterOpen) {
        setIsMobileFilterOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileFilterOpen]);

  // Lock body scroll when mobile filter is open
  useEffect(() => {
    if (isMobileFilterOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileFilterOpen]);

  // Extract unique filter options from the dataset
  const { allCategories, allSizes, allColors, datasetMinPrice, datasetMaxPrice } =
    useMemo(() => {
      const catSet = new Set<string>();
      const sizeSet = new Set<string>();
      const colorSet = new Set<string>();
      let minP = Infinity;
      let maxP = -Infinity;

      products.forEach((p) => {
        catSet.add(p.categoryName);
        p.availableSizes.forEach((s) => sizeSet.add(s));
        p.availableColors?.forEach((c) => colorSet.add(c));
        if (p.pricePkr < minP) minP = p.pricePkr;
        if (p.pricePkr > maxP) maxP = p.pricePkr;
      });

      return {
        allCategories: Array.from(catSet).sort(),
        allSizes: Array.from(sizeSet),
        allColors: Array.from(colorSet).sort(),
        datasetMinPrice: minP === Infinity ? 0 : minP,
        datasetMaxPrice: maxP === -Infinity ? 50000 : maxP,
      };
    }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // 1. Text Search: Title, categoryName, or audience
      if (querySearch.trim()) {
        const query = querySearch.toLowerCase().trim();
        const matchesTitle = product.title.toLowerCase().includes(query);
        const matchesCategory = product.categoryName.toLowerCase().includes(query);
        const matchesAudience = product.audience?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesCategory && !matchesAudience) {
          return false;
        }
      }

      // 2. Audience filter
      if (queryAudience) {
        if (queryAudience === "women" && product.audience !== "women" && product.audience !== "unisex") {
          return false;
        }
        if (queryAudience === "men" && product.audience !== "men" && product.audience !== "unisex") {
          return false;
        }
      }

      // 3. Category filter
      if (queryCategory && product.categoryName !== queryCategory) {
        return false;
      }

      // 4. Size filter
      if (querySize && !product.availableSizes.includes(querySize)) {
        return false;
      }

      // 5. Color filter
      if (queryColor && !product.availableColors?.includes(queryColor)) {
        return false;
      }

      // 6. Price range
      const min = queryMinPrice ? parseFloat(queryMinPrice) : null;
      const max = queryMaxPrice ? parseFloat(queryMaxPrice) : null;
      if (min !== null && !isNaN(min) && product.pricePkr < min) {
        return false;
      }
      if (max !== null && !isNaN(max) && product.pricePkr > max) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      switch (querySort) {
        case "price-asc":
          return a.pricePkr - b.pricePkr;
        case "price-desc":
          return b.pricePkr - a.pricePkr;
        case "name-asc":
          return a.title.localeCompare(b.title);
        case "newest":
          return (
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
          );
        case "featured":
        default:
          return 0; // Natural dataset order
      }
    });
  }, [
    products,
    querySearch,
    queryAudience,
    queryCategory,
    querySize,
    queryColor,
    queryMinPrice,
    queryMaxPrice,
    querySort,
  ]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (querySearch) count++;
    if (queryAudience && !initialCategory) count++;
    if (queryCategory) count++;
    if (querySize) count++;
    if (queryColor) count++;
    if (queryMinPrice || queryMaxPrice) count++;
    return count;
  }, [
    querySearch,
    queryAudience,
    initialCategory,
    queryCategory,
    querySize,
    queryColor,
    queryMinPrice,
    queryMaxPrice,
  ]);

  // Page Header Details
  const pageMeta = useMemo(() => {
    if (initialCategory === "women" || queryAudience === "women") {
      return {
        title: "Women's Prêt & Couture",
        description:
          "Hand-embroidered pure micro-velvets, raw silk kurtas, and bespoke anarkalis designed for ceremonial elegance.",
        breadcrumb: "Women",
      };
    }
    if (initialCategory === "men" || queryAudience === "men") {
      return {
        title: "Men's Bespoke & Formal",
        description:
          "Tailored royal sherwanis, prince coats, and ceremonial silk kurta ensembles crafted to exacting standards.",
        breadcrumb: "Men",
      };
    }
    return {
      title: "Master Apparel Catalog",
      description:
        "Explore our complete collection of bespoke couture, luxury prêt-à-porter, and artisanal festive ensembles in Pakistan.",
      breadcrumb: "Catalog",
    };
  }, [initialCategory, queryAudience]);

  return (
    <div className="min-h-screen py-9 text-text-primary sm:py-12 bg-canvas-bg">
      <Container size="xl">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb navigation"
          className="flex items-center gap-2 text-xs text-text-secondary uppercase tracking-widest mb-6 font-sans"
        >
          <Link
            href="/"
            className="hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary"
          >
            Home
          </Link>
          <span>/</span>
          {initialCategory ? (
            <>
              <Link
                href="/shop"
                className="hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary"
              >
                Shop
              </Link>
              <span>/</span>
              <span className="text-text-primary font-semibold">
                {pageMeta.breadcrumb}
              </span>
            </>
          ) : (
            <span className="text-text-primary font-semibold">Shop</span>
          )}
        </nav>

        {/* Page Header */}
        <div className="border-b border-border-subtle pb-8 mb-8 sm:mb-10">
          {initialCategory && (
            <div className="relative mb-10 h-48 overflow-hidden rounded-xl sm:h-72 lg:h-80 border border-border-subtle">
              <Image
                src={
                  initialCategory === "men"
                    ? "/images/campaign/collection-men.jpg"
                    : "/images/campaign/collection-women.jpg"
                }
                alt=""
                fill
                sizes="(max-width: 1280px) 100vw, 1280px"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
            </div>
          )}
          <div className="max-w-3xl">
            <h1 className="mb-4 font-serif text-4xl font-normal leading-[1.05] text-text-primary sm:text-5xl">
              {pageMeta.title}
            </h1>
            <p className="text-text-secondary text-xs sm:text-sm leading-relaxed max-w-2xl font-sans">
              {pageMeta.description}
            </p>
          </div>

          {/* Search Input Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-6 flex items-center gap-2 max-w-xl"
            role="search"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, fabric, or style..."
                className="luxury-input pl-10 pr-10"
                aria-label="Search garments"
              />
              <svg
                className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  aria-label="Clear search query"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-secondary hover:text-text-primary transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
            <Button type="submit" variant="primary" size="md">
              Search
            </Button>
          </form>
        </div>

        {/* Toolbar: Results Count, Mobile Filter Button & Sorting */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-5 font-sans text-xs">
          <div className="flex items-center gap-3">
            <span className="text-text-secondary uppercase tracking-wider">
              Showing{" "}
              <strong className="text-text-primary font-semibold">
                {filteredProducts.length}
              </strong>{" "}
              of {products.length} garments
            </span>

            {/* Mobile Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden inline-flex items-center gap-2 min-h-[44px] rounded-full border border-border-subtle bg-surface-white px-4 py-2 text-text-primary hover:border-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary shadow-xs"
              aria-label="Open filter options"
            >
              <svg
                className="w-4 h-4 text-text-secondary"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
                />
              </svg>
              <span>Filters {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="sort-selector"
              className="text-text-secondary uppercase tracking-wider hidden sm:inline"
            >
              Sort by:
            </label>
            <select
              id="sort-selector"
              value={querySort}
              onChange={(e) => updateParams({ sort: e.target.value })}
              className="h-10 w-auto min-w-[170px] cursor-pointer rounded-full border border-border-subtle bg-surface-white px-4 text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary shadow-xs"
              aria-label="Sort product order"
            >
              <option value="featured">Featured Order</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="newest">Newest Releases</option>
            </select>
          </div>
        </div>

        {/* Active Filter Pills Bar */}
        {activeFilterCount > 0 && (
          <div
            aria-label="Active filters"
            className="flex flex-wrap items-center gap-2 mb-8 p-3.5 bg-surface-white border border-border-subtle rounded-xl text-xs font-sans shadow-xs"
          >
            <span className="text-text-secondary text-[11px] uppercase tracking-wider mr-1">
              Active Filters:
            </span>

            {querySearch && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-subtle border border-border-subtle text-text-primary rounded-full text-[11px]">
                Search: &ldquo;{querySearch}&rdquo;
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="hover:text-status-error ml-1 font-bold"
                  aria-label="Remove search filter"
                >
                  ×
                </button>
              </span>
            )}

            {queryAudience && !initialCategory && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-subtle border border-border-subtle text-text-primary rounded-full text-[11px] capitalize">
                Audience: {queryAudience}
                <button
                  type="button"
                  onClick={() => updateParams({ audience: null })}
                  className="hover:text-status-error ml-1 font-bold"
                  aria-label="Remove audience filter"
                >
                  ×
                </button>
              </span>
            )}

            {queryCategory && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-subtle border border-border-subtle text-text-primary rounded-full text-[11px]">
                Category: {queryCategory}
                <button
                  type="button"
                  onClick={() => updateParams({ category: null })}
                  className="hover:text-status-error ml-1 font-bold"
                  aria-label="Remove category filter"
                >
                  ×
                </button>
              </span>
            )}

            {querySize && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-subtle border border-border-subtle text-text-primary rounded-full text-[11px]">
                Size: {querySize}
                <button
                  type="button"
                  onClick={() => updateParams({ size: null })}
                  className="hover:text-status-error ml-1 font-bold"
                  aria-label="Remove size filter"
                >
                  ×
                </button>
              </span>
            )}

            {queryColor && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-subtle border border-border-subtle text-text-primary rounded-full text-[11px]">
                Color: {queryColor}
                <button
                  type="button"
                  onClick={() => updateParams({ color: null })}
                  className="hover:text-status-error ml-1 font-bold"
                  aria-label="Remove color filter"
                >
                  ×
                </button>
              </span>
            )}

            {(queryMinPrice || queryMaxPrice) && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-subtle border border-border-subtle text-text-primary rounded-full text-[11px]">
                Price: {queryMinPrice ? formatPKR(parseFloat(queryMinPrice)) : "Min"} –{" "}
                {queryMaxPrice ? formatPKR(parseFloat(queryMaxPrice)) : "Max"}
                <button
                  type="button"
                  onClick={() => updateParams({ minPrice: null, maxPrice: null })}
                  className="hover:text-status-error ml-1 font-bold"
                  aria-label="Remove price range filter"
                >
                  ×
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={handleClearAllFilters}
              className="text-xs text-text-secondary hover:text-text-primary hover:underline ml-auto font-medium"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Main Content Layout: Sidebar + Product Grid */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          {/* Desktop Filter Sidebar (280px Sticky) */}
          <aside
            aria-label="Catalog filter sidebar"
            className="hidden lg:sticky lg:top-28 lg:block lg:w-64 xl:w-72 flex-shrink-0 space-y-7 rounded-xl border border-border-subtle bg-surface-white p-6 font-sans shadow-xs"
          >
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h2 className="font-serif text-lg font-medium text-text-primary tracking-tight">
                Filters
              </h2>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="text-xs text-text-secondary hover:text-text-primary hover:underline"
                >
                  Reset All
                </button>
              )}
            </div>

            {/* Audience / Gender Filter (if on all /shop) */}
            {!initialCategory && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-primary mb-3">
                  Department
                </h3>
                <div className="flex flex-col gap-2.5 text-xs">
                  {[
                    { label: "All Departments", val: "" },
                    { label: "Women's Collection", val: "women" },
                    { label: "Men's Collection", val: "men" },
                  ].map((aud) => (
                    <label
                      key={aud.val}
                      className="flex items-center gap-2.5 text-text-secondary hover:text-text-primary cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="audience"
                        checked={queryAudience === aud.val}
                        onChange={() => updateParams({ audience: aud.val || null })}
                        className="accent-[#252522]"
                      />
                      <span>{aud.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Category Filter */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-primary mb-3">
                Categories
              </h3>
              <div className="flex flex-col gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => updateParams({ category: null })}
                  className={`text-left transition-colors ${
                    !queryCategory
                      ? "text-text-primary font-semibold"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  All Categories
                </button>
                {allCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() =>
                      updateParams({ category: queryCategory === cat ? null : cat })
                    }
                    className={`text-left transition-colors truncate ${
                      queryCategory === cat
                        ? "text-text-primary font-semibold"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Filter */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-primary mb-3">
                Size
              </h3>
              <div className="flex flex-wrap gap-2">
                {allSizes.map((size) => {
                  const isSelected = querySize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() =>
                        updateParams({ size: isSelected ? null : size })
                      }
                      className={`flex h-9 min-w-[36px] items-center justify-center rounded-full border px-3 text-xs uppercase transition-colors cursor-pointer ${
                        isSelected
                          ? "border-text-primary bg-text-primary font-semibold text-white"
                          : "border-border-subtle bg-surface-white text-text-primary hover:border-text-primary"
                      }`}
                      aria-pressed={isSelected}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Filter */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-primary mb-3">
                Color Palette
              </h3>
              <div className="flex flex-col gap-2 text-xs">
                {allColors.map((color) => {
                  const isSelected = queryColor === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() =>
                        updateParams({ color: isSelected ? null : color })
                      }
                      className={`text-left flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? "text-text-primary font-semibold"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      <span>{color}</span>
                      {isSelected && <span className="text-text-primary font-bold">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Range Filter */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-primary mb-3">
                Price (PKR)
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs">
                  <input
                    type="number"
                    placeholder={`Min (${datasetMinPrice})`}
                    value={queryMinPrice}
                    onChange={(e) => updateParams({ minPrice: e.target.value || null })}
                    className="w-1/2 h-9 px-3 bg-canvas-bg border border-border-subtle text-text-primary text-xs rounded-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary"
                    aria-label="Minimum price in PKR"
                  />
                  <span className="text-text-secondary">-</span>
                  <input
                    type="number"
                    placeholder={`Max (${datasetMaxPrice})`}
                    value={queryMaxPrice}
                    onChange={(e) => updateParams({ maxPrice: e.target.value || null })}
                    className="w-1/2 h-9 px-3 bg-canvas-bg border border-border-subtle text-text-primary text-xs rounded-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary"
                    aria-label="Maximum price in PKR"
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* Product Results Grid Area */}
          <main className="flex-1 w-full" aria-label="Product Catalog Results">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 lg:gap-x-6 xl:gap-x-8">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              /* Empty Results State */
              <div className="mx-auto my-6 max-w-2xl rounded-2xl border border-border-subtle bg-surface-white p-12 text-center shadow-xs">
                <div className="w-12 h-12 mx-auto mb-4 text-text-secondary flex items-center justify-center rounded-full bg-surface-subtle border border-border-subtle">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  </svg>
                </div>
                <h3 className="font-serif text-2xl font-medium text-text-primary mb-2">
                  No Garments Match Your Selection
                </h3>
                <p className="text-text-secondary text-xs sm:text-sm max-w-md mx-auto mb-6 leading-relaxed font-sans">
                  We could not find any garments matching your current filters or
                  search criteria. Try broadening your parameters or reset all filters.
                </p>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleClearAllFilters}
                >
                  Reset All Filters
                </Button>
              </div>
            )}
          </main>
        </div>
      </Container>

      {/* Accessible Mobile Filter Drawer / Dialog */}
      {isMobileFilterOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filter Garments"
          className="fixed inset-0 z-50 lg:hidden flex"
        >
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileFilterOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative z-10 ml-auto flex h-full w-full max-w-xs flex-col overflow-hidden border-l border-border-subtle bg-surface-white font-sans shadow-2xl sm:max-w-sm text-text-primary">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-border-subtle">
              <h2 className="font-serif text-lg font-medium text-text-primary tracking-tight">
                Filter Options {activeFilterCount > 0 && `(${activeFilterCount})`}
              </h2>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
                aria-label="Close filter drawer"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Scrollable Filters Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
              {/* Category */}
              <div>
                <h3 className="font-semibold uppercase tracking-wider text-text-primary mb-2">
                  Category
                </h3>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => updateParams({ category: null })}
                    className={`block w-full text-left py-1.5 transition-colors ${
                      !queryCategory
                        ? "text-text-primary font-bold"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    All Categories
                  </button>
                  {allCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() =>
                        updateParams({ category: queryCategory === cat ? null : cat })
                      }
                      className={`block w-full text-left py-1.5 transition-colors ${
                        queryCategory === cat
                          ? "text-text-primary font-bold"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sizes */}
              <div>
                <h3 className="font-semibold uppercase tracking-wider text-text-primary mb-2">
                  Size
                </h3>
                <div className="flex flex-wrap gap-2">
                  {allSizes.map((size) => {
                    const isSelected = querySize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() =>
                          updateParams({ size: isSelected ? null : size })
                        }
                        className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border px-3 text-xs transition-colors ${
                          isSelected
                            ? "border-text-primary bg-text-primary font-semibold text-white"
                            : "border-border-subtle bg-canvas-bg text-text-primary hover:border-text-primary"
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Colors */}
              <div>
                <h3 className="font-semibold uppercase tracking-wider text-text-primary mb-2">
                  Color
                </h3>
                <div className="space-y-2">
                  {allColors.map((color) => {
                    const isSelected = queryColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() =>
                          updateParams({ color: isSelected ? null : color })
                        }
                        className={`flex items-center justify-between w-full py-1.5 transition-colors ${
                          isSelected
                            ? "text-text-primary font-bold"
                            : "text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        <span>{color}</span>
                        {isSelected && <span className="text-text-primary font-bold">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="font-semibold uppercase tracking-wider text-text-primary mb-2">
                  Price Range (PKR)
                </h3>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={queryMinPrice}
                    onChange={(e) => updateParams({ minPrice: e.target.value || null })}
                    className="w-1/2 h-10 px-3 bg-canvas-bg border border-border-subtle text-text-primary text-xs rounded-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary"
                    aria-label="Mobile minimum price"
                  />
                  <span className="text-text-secondary">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={queryMaxPrice}
                    onChange={(e) => updateParams({ maxPrice: e.target.value || null })}
                    className="w-1/2 h-10 px-3 bg-canvas-bg border border-border-subtle text-text-primary text-xs rounded-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary"
                    aria-label="Mobile maximum price"
                  />
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-border-subtle space-y-2 bg-surface-white">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => setIsMobileFilterOpen(false)}
              >
                Apply Filters ({filteredProducts.length})
              </Button>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="w-full text-center text-xs text-text-secondary py-2 hover:text-text-primary hover:underline"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
