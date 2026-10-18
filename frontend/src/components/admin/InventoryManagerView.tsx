"use client";

import React, { useState, useEffect } from "react";
import { InventoryVariantItem, InventoryAuditLogEntry } from "@/types";
import { formatPKR } from "@/lib/utils";

export function InventoryManagerView() {
  const [variants, setVariants] = useState<InventoryVariantItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<InventoryAuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState<"VARIANTS" | "LOGS">("VARIANTS");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // Adjustment Modal
  const [selectedVariant, setSelectedVariant] = useState<InventoryVariantItem | null>(null);
  const [newStock, setNewStock] = useState("");
  const [reason, setReason] = useState("");
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustError, setAdjustError] = useState("");

  const fetchInventory = async () => {
    try {
      const res = await fetch("/api/v1/admin/inventory");
      if (!res.ok) throw new Error("Failed to load inventory");
      const data = await res.json();
      if (data.success) {
        setVariants(data.variants || []);
        setAuditLogs(data.auditLogs || []);
      }
    } catch (err) {
      console.error("Inventory fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchInventory();
    };
    void load();
  }, []);

  const openAdjustModal = (item: InventoryVariantItem) => {
    setSelectedVariant(item);
    setNewStock(String(item.stock));
    setReason("");
    setAdjustError("");
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariant) return;

    if (!reason.trim()) {
      setAdjustError("An audit reason is required for inventory modifications.");
      return;
    }

    try {
      setAdjustLoading(true);
      setAdjustError("");

      const res = await fetch("/api/v1/admin/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedVariant.productId,
          variantId: selectedVariant.variantId,
          newStock: Number(newStock),
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to adjust stock");
      }

      // Update local variants list
      setVariants((prev) =>
        prev.map((v) =>
          v.variantId === selectedVariant.variantId
            ? {
                ...v,
                stock: Number(newStock),
                status:
                  Number(newStock) === 0
                    ? "OUT_OF_STOCK"
                    : Number(newStock) <= 3
                    ? "LOW_STOCK"
                    : "IN_STOCK",
              }
            : v
        )
      );

      if (data.log) {
        setAuditLogs((prev) => [data.log, ...prev]);
      }

      setSelectedVariant(null);
    } catch (err) {
      setAdjustError(err instanceof Error ? err.message : "Failed to adjust inventory");
    } finally {
      setAdjustLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "IN_STOCK":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "LOW_STOCK":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "OUT_OF_STOCK":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-neutral-100 text-neutral-600 border-neutral-200";
    }
  };

  const filteredVariants = variants.filter((v) => {
    const matchesSearch =
      !search ||
      v.productTitle.toLowerCase().includes(search.toLowerCase()) ||
      v.sku.toLowerCase().includes(search.toLowerCase()) ||
      v.colorName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            Variant Inventory
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            SKU-level stock tracking across atelier size and color matrices, with audit trails.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("VARIANTS")}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-full transition-colors cursor-pointer ${
              activeTab === "VARIANTS"
                ? "bg-text-primary text-surface-white font-medium shadow-xs"
                : "bg-surface-white border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-canvas-bg"
            }`}
          >
            Variant Stock Table
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("LOGS")}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-full transition-colors cursor-pointer ${
              activeTab === "LOGS"
                ? "bg-text-primary text-surface-white font-medium shadow-xs"
                : "bg-surface-white border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-canvas-bg"
            }`}
          >
            Adjustment Audit Logs ({auditLogs.length})
          </button>
        </div>
      </div>

      {activeTab === "VARIANTS" ? (
        <>
          {/* Filters Bar */}
          <div className="bg-surface-white border border-border-subtle rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by garment, SKU, or color..."
              className="w-full sm:w-80 bg-surface-white border border-border-subtle rounded-md px-3 py-2 text-xs text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-text-primary"
            />

            <div className="flex items-center gap-2 w-full sm:w-auto text-xs text-text-secondary">
              <span className="font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-surface-white border border-border-subtle rounded-md px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-text-primary cursor-pointer"
              >
                <option value="ALL">All Stock Levels</option>
                <option value="IN_STOCK">In Stock (&gt; 3)</option>
                <option value="LOW_STOCK">Low Stock (1-3 pcs)</option>
                <option value="OUT_OF_STOCK">Sold Out (0 pcs)</option>
              </select>
            </div>
          </div>

          {/* Variants Table */}
          <div className="bg-surface-white border border-border-subtle rounded-lg overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-canvas-bg text-[10px] uppercase font-mono tracking-wider text-text-secondary border-b border-border-subtle">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Garment</th>
                    <th className="py-3 px-4 font-semibold">Variant SKU</th>
                    <th className="py-3 px-4 font-semibold">Size</th>
                    <th className="py-3 px-4 font-semibold">Color</th>
                    <th className="py-3 px-4 font-semibold">Retail Price</th>
                    <th className="py-3 px-4 font-semibold">Stock</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-text-secondary">
                        <div className="inline-block w-6 h-6 border-2 border-border-subtle border-t-text-primary rounded-full animate-spin mb-2" />
                        <div>Loading inventory levels...</div>
                      </td>
                    </tr>
                  ) : filteredVariants.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-text-secondary">
                        No inventory variants match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredVariants.map((item) => (
                      <tr
                        key={item.variantId}
                        className="hover:bg-canvas-bg/60 transition-colors"
                      >
                        <td className="py-3 px-4 text-text-primary font-medium">
                          {item.productTitle}
                        </td>
                        <td className="py-3 px-4 font-mono text-text-secondary text-[11px]">
                          {item.sku}
                        </td>
                        <td className="py-3 px-4 font-mono text-text-primary">{item.size}</td>
                        <td className="py-3 px-4 text-text-secondary">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-3 h-3 rounded-full border border-border-subtle inline-block"
                              style={{ backgroundColor: item.colorHex }}
                            />
                            <span>{item.colorName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-serif text-text-primary font-medium">
                          {formatPKR(item.pricePkr)}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-text-primary">
                          {item.stock} pcs
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-full border ${getStatusBadge(
                              item.status
                            )}`}
                          >
                            {item.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => openAdjustModal(item)}
                            className="px-2.5 py-1 bg-surface-white hover:bg-canvas-bg border border-border-subtle text-[10px] font-mono text-text-primary rounded-md transition-colors cursor-pointer"
                          >
                            Adjust Stock →
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Audit Logs Tab */
        <div className="bg-surface-white border border-border-subtle rounded-lg overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas-bg text-[10px] uppercase font-mono tracking-wider text-text-secondary border-b border-border-subtle">
                <tr>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Garment & SKU</th>
                  <th className="py-3 px-4 font-semibold">Delta</th>
                  <th className="py-3 px-4 font-semibold">Stock Transition</th>
                  <th className="py-3 px-4 font-semibold">Audit Reason</th>
                  <th className="py-3 px-4 font-semibold">Performed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-text-secondary">
                      No inventory adjustment records found.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-canvas-bg/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-[10px] text-text-secondary">
                        {new Date(log.timestamp).toLocaleString("en-PK")}
                      </td>
                      <td className="py-3 px-4 text-text-primary">
                        <div className="font-medium">{log.productTitle}</div>
                        <div className="text-[10px] font-mono text-text-secondary">
                          {log.sku} ({log.size} • {log.colorName})
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold">
                        <span
                          className={
                            log.adjustmentDelta > 0
                              ? "text-emerald-700"
                              : log.adjustmentDelta < 0
                              ? "text-rose-700"
                              : "text-text-secondary"
                          }
                        >
                          {log.adjustmentDelta > 0 ? `+${log.adjustmentDelta}` : log.adjustmentDelta}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-text-secondary">
                        {log.previousStock} → <strong className="text-text-primary">{log.newStock}</strong>
                      </td>
                      <td className="py-3 px-4 text-text-secondary">{log.reason}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-text-secondary">
                        {log.adjustedBy}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {selectedVariant && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-white border border-border-subtle rounded-xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="font-serif text-lg font-bold text-text-primary">
              Adjust Variant Stock
            </h3>
            <div className="p-3 bg-canvas-bg border border-border-subtle rounded-md text-xs space-y-1">
              <div className="font-medium text-text-primary">{selectedVariant.productTitle}</div>
              <div className="font-mono text-[11px] text-text-secondary">
                SKU: {selectedVariant.sku}
              </div>
              <div className="text-text-secondary text-[11px]">
                Size: {selectedVariant.size} • Color: {selectedVariant.colorName} • Current Stock:{" "}
                <strong className="text-text-primary">{selectedVariant.stock} pcs</strong>
              </div>
            </div>

            {adjustError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-xs">
                {adjustError}
              </div>
            )}

            <form onSubmit={handleAdjustSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-text-secondary font-medium mb-1">
                  New Exact Quantity (in atelier):
                </label>
                <input
                  type="number"
                  min="0"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  required
                  className="w-full bg-surface-white border border-border-subtle rounded-md p-2 text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-text-primary font-mono text-base"
                />
              </div>

              <div>
                <label className="block text-text-secondary font-medium mb-1">
                  Mandatory Audit Reason:
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Lahore master tailoring batch restock, fabric defect discard, physical inventory reconciliation..."
                  rows={3}
                  required
                  className="w-full bg-surface-white border border-border-subtle rounded-md p-2 text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-text-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setSelectedVariant(null)}
                  className="px-4 py-2 border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-canvas-bg rounded-full text-xs font-medium cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustLoading}
                  className="px-5 py-2 bg-text-primary hover:bg-neutral-800 text-surface-white rounded-full font-medium uppercase tracking-wider text-[11px] cursor-pointer transition-colors shadow-xs disabled:opacity-50"
                >
                  {adjustLoading ? "Saving..." : "Save Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
