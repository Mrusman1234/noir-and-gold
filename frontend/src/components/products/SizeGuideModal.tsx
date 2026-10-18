"use client";

import React, { useState, useEffect } from "react";

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAudience?: "women" | "men" | "unisex";
}

interface SizeRow {
  size: string;
  chestIn: string;
  waistIn: string;
  hipIn: string;
  lengthIn: string;
  chestCm: string;
  waistCm: string;
  hipCm: string;
  lengthCm: string;
}

const WOMEN_SIZING: SizeRow[] = [
  { size: "XS", chestIn: "34", waistIn: "28", hipIn: "38", lengthIn: "48", chestCm: "86", waistCm: "71", hipCm: "97", lengthCm: "122" },
  { size: "S", chestIn: "36", waistIn: "30", hipIn: "40", lengthIn: "49", chestCm: "91", waistCm: "76", hipCm: "102", lengthCm: "124" },
  { size: "M", chestIn: "39", waistIn: "33", hipIn: "43", lengthIn: "50", chestCm: "99", waistCm: "84", hipCm: "109", lengthCm: "127" },
  { size: "L", chestIn: "42", waistIn: "36", hipIn: "46", lengthIn: "51", chestCm: "107", waistCm: "91", hipCm: "117", lengthCm: "130" },
  { size: "XL", chestIn: "45", waistIn: "39", hipIn: "49", lengthIn: "52", chestCm: "114", waistCm: "99", hipCm: "124", lengthCm: "132" },
];

const MEN_SIZING: SizeRow[] = [
  { size: "38 / S", chestIn: "38", waistIn: "32", hipIn: "40", lengthIn: "40", chestCm: "97", waistCm: "81", hipCm: "102", lengthCm: "102" },
  { size: "40 / M", chestIn: "40", waistIn: "34", hipIn: "42", lengthIn: "41", chestCm: "102", waistCm: "86", hipCm: "107", lengthCm: "104" },
  { size: "42 / L", chestIn: "42", waistIn: "36", hipIn: "44", lengthIn: "42", chestCm: "107", waistCm: "91", hipCm: "112", lengthCm: "107" },
  { size: "44 / XL", chestIn: "44", waistIn: "38", hipIn: "46", lengthIn: "43", chestCm: "112", waistCm: "97", hipCm: "117", lengthCm: "109" },
];

export function SizeGuideModal({
  isOpen,
  onClose,
  initialAudience = "women",
}: SizeGuideModalProps) {
  const [unit, setUnit] = useState<"in" | "cm">("in");
  const [activeTab, setActiveTab] = useState<"women" | "men">(
    initialAudience === "men" ? "men" : "women"
  );
  const [prevAudience, setPrevAudience] = useState(initialAudience);

  if (initialAudience !== prevAudience) {
    setPrevAudience(initialAudience);
    setActiveTab(initialAudience === "men" ? "men" : "women");
  }

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentRows = activeTab === "women" ? WOMEN_SIZING : MEN_SIZING;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="size-guide-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in"
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-surface-white border border-border-subtle p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto text-text-primary font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-6">
          <div>
            <h2 id="size-guide-title" className="font-serif text-2xl font-medium text-text-primary">
              Sizing &amp; Measurement Guide
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              Atelier standard measurements for NOIR &amp; GOLD couture and prêt
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close size guide"
            className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab & Unit Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          {/* Category Tabs */}
          <div className="inline-flex p-1 bg-surface-subtle rounded-full border border-border-subtle">
            <button
              type="button"
              onClick={() => setActiveTab("women")}
              className={`px-4 py-1.5 text-xs uppercase tracking-wider font-sans transition-colors cursor-pointer rounded-full ${
                activeTab === "women"
                  ? "bg-surface-white text-text-primary font-semibold shadow-xs"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Women&apos;s Prêt
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("men")}
              className={`px-4 py-1.5 text-xs uppercase tracking-wider font-sans transition-colors cursor-pointer rounded-full ${
                activeTab === "men"
                  ? "bg-surface-white text-text-primary font-semibold shadow-xs"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Men&apos;s Formal
            </button>
          </div>

          {/* Unit Toggle */}
          <div className="flex items-center gap-2 text-xs font-sans">
            <span className="text-text-secondary">Unit:</span>
            <div className="inline-flex p-1 bg-surface-subtle rounded-full border border-border-subtle">
              <button
                type="button"
                onClick={() => setUnit("in")}
                className={`px-3 py-1 text-xs transition-colors cursor-pointer rounded-full ${
                  unit === "in"
                    ? "bg-surface-white text-text-primary font-semibold shadow-xs"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Inches (in)
              </button>
              <button
                type="button"
                onClick={() => setUnit("cm")}
                className={`px-3 py-1 text-xs transition-colors cursor-pointer rounded-full ${
                  unit === "cm"
                    ? "bg-surface-white text-text-primary font-semibold shadow-xs"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Centimeters (cm)
              </button>
            </div>
          </div>
        </div>

        {/* Size Table */}
        <div className="overflow-x-auto border border-border-subtle rounded-xl mb-6">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-surface-subtle text-text-primary uppercase tracking-wider border-b border-border-subtle text-[11px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Standard Size</th>
                <th className="py-3 px-4 font-semibold">Chest / Bust</th>
                <th className="py-3 px-4 font-semibold">Waist</th>
                <th className="py-3 px-4 font-semibold">Hip</th>
                <th className="py-3 px-4 font-semibold">Garment Length</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-text-secondary">
              {currentRows.map((row) => (
                <tr key={row.size} className="hover:bg-canvas-bg transition-colors">
                  <td className="py-3 px-4 font-semibold text-text-primary">{row.size}</td>
                  <td className="py-3 px-4">{unit === "in" ? `${row.chestIn}"` : `${row.chestCm} cm`}</td>
                  <td className="py-3 px-4">{unit === "in" ? `${row.waistIn}"` : `${row.waistCm} cm`}</td>
                  <td className="py-3 px-4">{unit === "in" ? `${row.hipIn}"` : `${row.hipCm} cm`}</td>
                  <td className="py-3 px-4">{unit === "in" ? `${row.lengthIn}"` : `${row.lengthCm} cm`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tailoring & Fit Guidance */}
        <div className="p-4 bg-surface-subtle border border-border-subtle rounded-xl text-xs text-text-secondary space-y-2">
          <p className="text-text-primary font-semibold uppercase tracking-wider text-[11px]">
            Pakistani Bespoke Fit Advisory
          </p>
          <p className="leading-relaxed">
            All NOIR &amp; GOLD ensembles feature our signature royal ease (1.5–2 inches of built-in seam allowance).
            If you fall between sizes or plan to wear formal inner layers, we recommend selecting the larger size.
          </p>
          <p className="text-text-primary text-[11px] font-medium">
            Need custom adjustments? Our atelier concierge can accommodate bespoke sleeve and length alterations prior to dispatch.
          </p>
        </div>
      </div>
    </div>
  );
}
