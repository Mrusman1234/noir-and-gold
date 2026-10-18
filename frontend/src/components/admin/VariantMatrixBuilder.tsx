"use client";

import React from "react";
import { formatPKR } from "@/lib/utils";

export interface VariantMatrixItem {
  id?: string;
  size: string;
  colorName: string;
  colorHex: string;
  sku: string;
  stock: number;
  priceDeltaPkr?: number;
  pricePkr?: number;
  isActive: boolean;
}

interface VariantMatrixBuilderProps {
  variants: VariantMatrixItem[];
  onChange: (variants: VariantMatrixItem[]) => void;
  basePricePkr: number;
  productSlug?: string;
  disabled?: boolean;
}

const PRESET_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Standard", "Custom"] as const;

export function VariantMatrixBuilder({
  variants,
  onChange,
  basePricePkr,
  productSlug = "GARMENT",
  disabled = false,
}: VariantMatrixBuilderProps) {
  // Check for duplicate SKUs in real time
  const skuCounts = new Map<string, number>();
  variants.forEach((v) => {
    const s = v.sku.trim().toUpperCase();
    if (s) {
      skuCounts.set(s, (skuCounts.get(s) || 0) + 1);
    }
  });

  const duplicateSkus = new Set(
    Array.from(skuCounts.entries())
      .filter(([, count]) => count > 1)
      .map(([sku]) => sku)
  );

  const handleFieldChange = (
    index: number,
    field: keyof VariantMatrixItem,
    value: string | number | boolean
  ) => {
    const updated = variants.map((row, i) => {
      if (i !== index) return row;
      const next = { ...row, [field]: value };

      // If price delta changes, recalculate pricePkr
      if (field === "priceDeltaPkr") {
        const delta = typeof value === "number" ? value : Number(value) || 0;
        next.pricePkr = Math.max(0, basePricePkr + delta);
      }

      return next;
    });
    onChange(updated);
  };

  const generateDefaultSku = (size: string, color: string, index: number): string => {
    const cleanSlug = (productSlug || "NG")
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .slice(0, 8);
    const cleanColor = (color || "COL")
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "")
      .slice(0, 3);
    const cleanSize = (size || "STD").toUpperCase().replace(/[^A-Z0-9]+/g, "");
    return `NG-${cleanSlug}-${cleanColor}-${cleanSize}-${index + 1}`;
  };

  const handleAddRow = () => {
    const newIndex = variants.length;
    const defaultColor = "Obsidian Black";
    const defaultHex = "#1F2022";
    const defaultSize = "M";

    const newRow: VariantMatrixItem = {
      size: defaultSize,
      colorName: defaultColor,
      colorHex: defaultHex,
      sku: generateDefaultSku(defaultSize, defaultColor, newIndex),
      stock: 5,
      priceDeltaPkr: 0,
      pricePkr: basePricePkr,
      isActive: true,
    };
    onChange([...variants, newRow]);
  };

  const handleRemoveRow = (index: number) => {
    if (variants.length <= 1) return;
    onChange(variants.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
            Variant Matrix & Inventory
          </h4>
          <p className="text-[11px] text-text-secondary">
            Configure sizes, couture shades, custom SKUs, and variant-specific inventory levels.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddRow}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-surface-white hover:bg-canvas-bg border border-border-subtle rounded-lg text-text-primary transition-colors cursor-pointer disabled:opacity-50"
        >
          <span className="text-amber-500 font-bold">+</span>
          <span>Add Variant</span>
        </button>
      </div>

      {duplicateSkus.size > 0 && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>
            <strong>Duplicate SKU Warning:</strong> The following SKUs are assigned to multiple rows:{" "}
            {Array.from(duplicateSkus).join(", ")}. Each variant SKU must be unique.
          </span>
        </div>
      )}

      <div className="border border-border-subtle rounded-xl overflow-hidden bg-surface-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-subtle text-[10px] uppercase font-mono font-semibold tracking-wider text-text-secondary border-b border-border-subtle">
              <tr>
                <th className="py-2.5 px-3">Size</th>
                <th className="py-2.5 px-3">Colour Swatch</th>
                <th className="py-2.5 px-3">SKU</th>
                <th className="py-2.5 px-3 w-24">Stock</th>
                <th className="py-2.5 px-3 w-32">Price (PKR)</th>
                <th className="py-2.5 px-3 w-16 text-center">Active</th>
                <th className="py-2.5 px-3 w-12 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {variants.map((row, index) => {
                const isCustomSize = !["XS", "S", "M", "L", "XL", "XXL", "Standard"].includes(row.size);
                const isDupSku = row.sku.trim() ? duplicateSkus.has(row.sku.trim().toUpperCase()) : false;
                const finalPrice = basePricePkr + (row.priceDeltaPkr || 0);

                return (
                  <tr key={row.id || index} className="hover:bg-canvas-bg/30 transition-colors">
                    {/* Size Selector */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <select
                          value={isCustomSize ? "Custom" : row.size}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val !== "Custom") {
                              handleFieldChange(index, "size", val);
                            }
                          }}
                          disabled={disabled}
                          className="bg-surface-white border border-border-subtle rounded-md px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-text-primary cursor-pointer"
                        >
                          {PRESET_SIZES.map((sz) => (
                            <option key={sz} value={sz}>
                              {sz}
                            </option>
                          ))}
                        </select>
                        {isCustomSize && (
                          <input
                            type="text"
                            value={row.size}
                            placeholder="Custom size"
                            onChange={(e) => handleFieldChange(index, "size", e.target.value)}
                            disabled={disabled}
                            className="w-16 bg-surface-white border border-border-subtle rounded-md px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-text-primary"
                          />
                        )}
                      </div>
                    </td>

                    {/* Color Swatch & Name */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="relative flex items-center">
                          <input
                            type="color"
                            value={row.colorHex || "#000000"}
                            onChange={(e) => handleFieldChange(index, "colorHex", e.target.value)}
                            disabled={disabled}
                            className="w-7 h-7 rounded border border-border-subtle cursor-pointer p-0.5 bg-surface-white"
                            title="Pick swatch colour"
                          />
                        </div>
                        <input
                          type="text"
                          value={row.colorName}
                          onChange={(e) => handleFieldChange(index, "colorName", e.target.value)}
                          placeholder="Shade (e.g. Royal Maroon)"
                          disabled={disabled}
                          className="w-32 bg-surface-white border border-border-subtle rounded-md px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-text-primary"
                        />
                      </div>
                    </td>

                    {/* SKU with Duplicate Warning */}
                    <td className="py-2.5 px-3">
                      <div className="relative">
                        <input
                          type="text"
                          value={row.sku}
                          onChange={(e) => handleFieldChange(index, "sku", e.target.value.toUpperCase())}
                          placeholder="SKU-CODE"
                          disabled={disabled}
                          className={`w-40 font-mono text-xs uppercase bg-surface-white border rounded-md px-2 py-1 focus:outline-none ${
                            isDupSku
                              ? "border-rose-400 bg-rose-50 text-rose-800 focus:border-rose-500"
                              : "border-border-subtle text-text-primary focus:border-text-primary"
                          }`}
                        />
                        {isDupSku && (
                          <span className="block text-[9px] text-rose-600 font-sans mt-0.5">
                            Duplicate SKU
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Stock Count */}
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        min="0"
                        value={row.stock}
                        onChange={(e) =>
                          handleFieldChange(index, "stock", Math.max(0, parseInt(e.target.value, 10) || 0))
                        }
                        disabled={disabled}
                        className="w-20 font-mono text-xs bg-surface-white border border-border-subtle rounded-md px-2 py-1 text-text-primary focus:outline-none focus:border-text-primary"
                      />
                    </td>

                    {/* Price Adjustment */}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col gap-0.5">
                        <input
                          type="number"
                          value={row.priceDeltaPkr ?? 0}
                          onChange={(e) =>
                            handleFieldChange(index, "priceDeltaPkr", parseInt(e.target.value, 10) || 0)
                          }
                          placeholder="+/- delta"
                          disabled={disabled}
                          className="w-24 font-mono text-xs bg-surface-white border border-border-subtle rounded-md px-2 py-1 text-text-primary focus:outline-none focus:border-text-primary"
                        />
                        <span className="text-[10px] text-text-secondary font-mono">
                          Total: {formatPKR(finalPrice)}
                        </span>
                      </div>
                    </td>

                    {/* Active Toggle Switch */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleFieldChange(index, "isActive", !row.isActive)}
                        disabled={disabled}
                        className={`w-8 h-4.5 rounded-full transition-colors relative inline-block cursor-pointer ${
                          row.isActive ? "bg-emerald-600" : "bg-neutral-300"
                        }`}
                        title={row.isActive ? "Active (visible for checkout)" : "Inactive (hidden)"}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-white rounded-full transition-transform ${
                            row.isActive ? "translate-x-3.5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </td>

                    {/* Remove Action */}
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(index)}
                        disabled={disabled || variants.length <= 1}
                        className="p-1 text-text-secondary hover:text-rose-600 disabled:opacity-20 cursor-pointer transition-colors"
                        title="Remove Variant"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
