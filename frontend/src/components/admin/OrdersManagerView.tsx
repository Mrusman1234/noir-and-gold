"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { AdminOrderRecord, OrderStatus } from "@/types";
import { formatPKR } from "@/lib/utils";

const ORDERS_PAGE_SIZE = 50;

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function OrdersManagerView() {
  const [orders, setOrders] = useState<AdminOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderRecord | null>(null);

  // Drawer Tabs: "DETAILS" | "LEDGER"
  const [detailTab, setDetailTab] = useState<"DETAILS" | "LEDGER">("DETAILS");

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("ALL");
  const [datePreset, setDatePreset] = useState<"ALL_TIME" | "TODAY" | "LAST_7_DAYS" | "LAST_30_DAYS" | "CUSTOM">("ALL_TIME");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const requestSequence = useRef(0);

  // Toast / feedback message
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Action modals
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [showShipModal, setShowShipModal] = useState(false);
  const [courierName, setCourierName] = useState("TCS");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [actionError, setActionError] = useState("");

  // Refund Modal State
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundMethod, setRefundMethod] = useState<"ORIGINAL_PAYMENT" | "MANUAL_BANK_TRANSFER" | "STORE_CREDIT">("ORIGINAL_PAYMENT");
  const [refundNote, setRefundNote] = useState("");
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundError, setRefundError] = useState("");

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback((current) => (current?.message === message ? null : current));
    }, 4500);
  };

  const fetchOrders = useCallback(async (requestedPage: number, signal?: AbortSignal) => {
    const requestId = ++requestSequence.current;
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (paymentFilter !== "ALL") params.append("paymentStatus", paymentFilter);
      if (paymentMethodFilter !== "ALL") params.append("paymentMethod", paymentMethodFilter);
      if (dateFrom) params.append("from", dateFrom);
      if (dateTo) params.append("to", dateTo);
      if (appliedSearchQuery) params.append("search", appliedSearchQuery);
      params.append("limit", String(ORDERS_PAGE_SIZE));
      params.append("offset", String((requestedPage - 1) * ORDERS_PAGE_SIZE));

      const res = await fetch(`/api/v1/admin/orders?${params.toString()}`, { signal });
      if (!res.ok) throw new Error("Failed to load orders");
      const data = await res.json();
      if (!data.success) throw new Error(data?.error?.message || "Failed to load orders");
      if (requestId !== requestSequence.current) return;

      const nextTotal = Number.isSafeInteger(data.total) ? data.total : 0;
      const lastPage = Math.max(1, Math.ceil(nextTotal / ORDERS_PAGE_SIZE));
      if (requestedPage > lastPage) {
        setPage(lastPage);
        return;
      }

      const nextOrders = Array.isArray(data.orders) ? (data.orders as AdminOrderRecord[]) : [];
      setOrders(nextOrders);
      setTotalOrders(nextTotal);
      setFetchError(null);
      setSelectedOrder((current) => {
        if (!current) return current;
        return nextOrders.find((order) => order.orderReference === current.orderReference) || current;
      });
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      if (requestId !== requestSequence.current) return;
      console.error("Orders fetch error:", error);
      setFetchError(errorMessage(error, "Failed to load orders."));
    } finally {
      if (requestId === requestSequence.current) setLoading(false);
    }
  }, [statusFilter, paymentFilter, paymentMethodFilter, dateFrom, dateTo, appliedSearchQuery]);

  const handleSelectOrder = async (order: AdminOrderRecord) => {
    setSelectedOrder(order);
    setDetailTab("DETAILS");
    try {
      const res = await fetch(`/api/v1/admin/orders/${order.orderReference}`);
      const data = await res.json();
      if (data.success && data.order) {
        setSelectedOrder(data.order);
      }
    } catch (err) {
      console.error("Failed to load full order ledger detail:", err);
    }
  };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("orderStatus", statusFilter);
      if (paymentFilter !== "ALL") params.append("paymentStatus", paymentFilter);
      if (paymentMethodFilter !== "ALL") params.append("paymentMethod", paymentMethodFilter);
      if (dateFrom) params.append("startDate", dateFrom);
      if (dateTo) params.append("endDate", dateTo);
      if (appliedSearchQuery) params.append("search", appliedSearchQuery);

      const res = await fetch(`/api/v1/admin/orders/export?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to export orders.");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `noir-orders-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showFeedback("success", "Orders CSV export generated successfully.");
    } catch (err) {
      showFeedback("error", err instanceof Error ? err.message : "Failed to export orders.");
    } finally {
      setExporting(false);
    }
  };

  const handleDatePresetChange = (preset: "ALL_TIME" | "TODAY" | "LAST_7_DAYS" | "LAST_30_DAYS" | "CUSTOM") => {
    setDatePreset(preset);
    const now = new Date();
    if (preset === "ALL_TIME") {
      setDateFrom("");
      setDateTo("");
    } else if (preset === "TODAY") {
      const todayStr = now.toISOString().slice(0, 10);
      setDateFrom(todayStr);
      setDateTo(todayStr);
    } else if (preset === "LAST_7_DAYS") {
      const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      setDateFrom(past.toISOString().slice(0, 10));
      setDateTo(now.toISOString().slice(0, 10));
    } else if (preset === "LAST_30_DAYS") {
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      setDateFrom(past.toISOString().slice(0, 10));
      setDateTo(now.toISOString().slice(0, 10));
    }
    setPage(1);
    setLoading(true);
  };

  useEffect(() => {
    const controller = new AbortController();
    const requestTimer = window.setTimeout(() => {
      if (!controller.signal.aborted) void fetchOrders(page, controller.signal);
    }, 0);
    return () => {
      window.clearTimeout(requestTimer);
      controller.abort();
    };
  }, [fetchOrders, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearchQuery(searchQuery.trim());
    setPage(1);
    setLoading(true);
  };

  const updateOrderStatus = async (
    orderRef: string,
    newStatus: OrderStatus,
    payload: {
      courierInfo?: { courierName: string; trackingNumber: string };
      cancellationReason?: string;
      note?: string;
    } = {}
  ) => {
    try {
      setActionLoading(true);
      setActionError("");

      const res = await fetch(`/api/v1/admin/orders/${orderRef}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderStatus: newStatus,
          ...payload,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to update order status");
      }

      setOrders((prev) =>
        prev.map((o) => (o.orderReference === orderRef ? data.order : o))
      );
      setSelectedOrder(data.order);
      setShowCancelModal(false);
      setShowShipModal(false);
      setCancellationReason("");
      setTrackingNumber("");
      showFeedback("success", `Order ${orderRef} updated to ${newStatus}.`);
    } catch (error: unknown) {
      setActionError(errorMessage(error, "Failed to update status"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setRefundError("");

    const amt = Number(refundAmount);
    if (isNaN(amt) || amt <= 0) {
      setRefundError("Please enter a valid refund amount in PKR.");
      return;
    }

    if (!refundReason.trim()) {
      setRefundError("Please provide a substantive reason for the refund.");
      return;
    }

    try {
      setRefundLoading(true);
      const res = await fetch(`/api/v1/admin/orders/${selectedOrder.orderReference}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountPkr: amt,
          reason: refundReason.trim(),
          refundMethod,
          note: refundNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to process refund.");
      }

      // Re-fetch complete order with updated ledger
      const detailRes = await fetch(`/api/v1/admin/orders/${selectedOrder.orderReference}`);
      const detailData = await detailRes.json();
      const updatedOrder = detailData.success
        ? detailData.order
        : { ...selectedOrder, paymentStatus: data.order.paymentStatus };

      setSelectedOrder(updatedOrder);
      setOrders((prev) =>
        prev.map((o) => (o.orderReference === updatedOrder.orderReference ? updatedOrder : o))
      );
      setShowRefundModal(false);
      setRefundAmount("");
      setRefundReason("");
      setRefundNote("");
      showFeedback("success", `Refund of ${formatPKR(amt)} recorded successfully.`);
    } catch (err) {
      setRefundError(err instanceof Error ? err.message : "Refund processing failed.");
    } finally {
      setRefundLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-sans";
      case "CONFIRMED":
        return "bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-sans";
      case "PROCESSING":
        return "bg-purple-50 text-purple-700 border border-purple-200 rounded-full font-sans";
      case "SHIPPED":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-sans";
      case "DELIVERED":
        return "bg-teal-50 text-teal-700 border border-teal-200 rounded-full font-sans";
      case "CANCELLED":
      case "FAILED_DELIVERY":
        return "bg-rose-50 text-rose-700 border border-rose-200 rounded-full font-sans";
      default:
        return "bg-surface-subtle text-text-secondary border border-border-subtle rounded-full font-sans";
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "PARTIALLY_REFUNDED":
        return "bg-amber-50 text-amber-800 border border-amber-300";
      case "REFUNDED":
        return "bg-purple-50 text-purple-800 border border-purple-200";
      case "FAILED":
        return "bg-rose-50 text-rose-700 border border-rose-200";
      default:
        return "bg-amber-50 text-amber-800 border border-amber-200";
    }
  };

  const statuses = [
    "ALL",
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ];
  const totalPages = Math.max(1, Math.ceil(totalOrders / ORDERS_PAGE_SIZE));

  // Ledger stats for selected order
  const totalRefundedPkr =
    selectedOrder?.refunds?.reduce((acc, r) => acc + (r.amountPkr || 0), 0) ?? 0;
  const remainingRefundablePkr = selectedOrder ? Math.max(0, selectedOrder.totalPkr - totalRefundedPkr) : 0;
  const canIssueRefund =
    selectedOrder &&
    remainingRefundablePkr > 0 &&
    (selectedOrder.paymentStatus === "PAID" || selectedOrder.paymentStatus === "PARTIALLY_REFUNDED");

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between shadow-md transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-bold px-2 py-0.5 opacity-60 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header & Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            Orders &amp; Financial Ledger
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Cash on Delivery verification, electronic payment attempts, courier tracking, and transactional refunds.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-text-primary hover:bg-black text-surface-white text-xs font-semibold rounded-xl cursor-pointer transition-colors shadow-xs disabled:opacity-50"
            title="Export filtered orders as RFC-4180 CSV"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {exporting ? "Generating CSV..." : "Export CSV"}
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-surface-white border border-border-subtle rounded-2xl p-5 shadow-xs space-y-4">
        {/* Status Pipeline Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border-subtle pb-3">
          {statuses.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
                setLoading(true);
              }}
              className={`px-3 py-1.5 text-xs font-sans uppercase tracking-wider rounded-full transition-colors cursor-pointer ${
                statusFilter === st
                  ? "bg-text-primary text-surface-white font-semibold shadow-xs"
                  : "bg-surface-white text-text-secondary hover:text-text-primary hover:bg-surface-subtle border border-border-subtle"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search, Payment Filters & Date Range Controls */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <form onSubmit={handleSearchSubmit} className="w-full sm:w-96 flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reference, customer name, phone, city..."
                className="flex-1 bg-surface-white border border-border-subtle rounded-xl px-3.5 py-2 text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-1 focus:ring-text-primary"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-text-primary hover:bg-black text-xs text-surface-white font-semibold rounded-xl cursor-pointer transition-colors shadow-xs"
              >
                Filter
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                <span>Method:</span>
                <select
                  value={paymentMethodFilter}
                  onChange={(e) => {
                    setPaymentMethodFilter(e.target.value);
                    setPage(1);
                    setLoading(true);
                  }}
                  className="bg-surface-white border border-border-subtle rounded-xl px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-text-primary cursor-pointer"
                >
                  <option value="ALL">All Methods</option>
                  <option value="CASH_ON_DELIVERY">Cash on Delivery (COD)</option>
                  <option value="ONLINE_CARD">Credit / Debit Card</option>
                  <option value="JAZZCASH">JazzCash</option>
                  <option value="EASYPAISA">EasyPaisa</option>
                  <option value="BANK_TRANSFER">Direct Bank Transfer</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                <span>Payment:</span>
                <select
                  value={paymentFilter}
                  onChange={(e) => {
                    setPaymentFilter(e.target.value);
                    setPage(1);
                    setLoading(true);
                  }}
                  className="bg-surface-white border border-border-subtle rounded-xl px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-text-primary cursor-pointer"
                >
                  <option value="ALL">All Payment Statuses</option>
                  <option value="PAID">PAID (Collected)</option>
                  <option value="PENDING">PENDING Collection</option>
                  <option value="PARTIALLY_REFUNDED">PARTIALLY REFUNDED</option>
                  <option value="REFUNDED">REFUNDED</option>
                  <option value="FAILED">FAILED</option>
                </select>
              </div>
            </div>
          </div>

          {/* Granular Date Range Toolbar */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border-subtle/60 text-xs text-text-secondary">
            <span className="font-medium text-[11px] uppercase tracking-wider text-text-primary">
              Date Filter:
            </span>
            <select
              value={datePreset}
              onChange={(e) =>
                handleDatePresetChange(
                  e.target.value as "ALL_TIME" | "TODAY" | "LAST_7_DAYS" | "LAST_30_DAYS" | "CUSTOM"
                )
              }
              className="bg-surface-white border border-border-subtle rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-text-primary cursor-pointer"
            >
              <option value="ALL_TIME">All Time</option>
              <option value="TODAY">Today</option>
              <option value="LAST_7_DAYS">Last 7 Days</option>
              <option value="LAST_30_DAYS">Last 30 Days</option>
              <option value="CUSTOM">Custom Date Range</option>
            </select>

            <div className="flex items-center gap-1.5">
              <span>From:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setDatePreset("CUSTOM");
                  setPage(1);
                }}
                className="bg-surface-white border border-border-subtle rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-text-primary"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span>To:</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setDatePreset("CUSTOM");
                  setPage(1);
                }}
                className="bg-surface-white border border-border-subtle rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-text-primary"
              />
            </div>

            {(dateFrom || dateTo || paymentMethodFilter !== "ALL" || paymentFilter !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setDatePreset("ALL_TIME");
                  setDateFrom("");
                  setDateTo("");
                  setPaymentMethodFilter("ALL");
                  setPaymentFilter("ALL");
                  setPage(1);
                }}
                className="text-[11px] text-rose-600 hover:text-rose-800 underline cursor-pointer ml-auto"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-surface-white border border-border-subtle rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-subtle text-[10px] uppercase font-sans font-semibold tracking-wider text-text-secondary border-b border-border-subtle">
              <tr>
                <th className="py-3 px-4">Order Ref</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">City / Area</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Order Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-text-secondary font-sans">
                    Loading atelier orders pipeline...
                  </td>
                </tr>
              ) : fetchError ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-rose-600 font-sans">
                    {fetchError}
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-text-secondary font-sans">
                    No orders match your selected filters.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr
                    key={ord.orderReference}
                    onClick={() => handleSelectOrder(ord)}
                    className="hover:bg-canvas-bg/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-medium text-text-primary">
                      {ord.orderReference}
                    </td>
                    <td className="py-3 px-4 text-text-secondary font-mono text-[11px]">
                      {new Date(ord.createdAt).toLocaleDateString("en-PK", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-text-primary">{ord.customer.fullName}</div>
                      <div className="text-[10px] text-text-secondary font-mono">{ord.customer.phone}</div>
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      <div>{ord.customer.city}</div>
                      <div className="text-[10px] text-text-secondary/70 truncate max-w-[120px]">
                        {ord.customer.area}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[10px] uppercase text-text-secondary">
                        {ord.paymentMethod.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-full border ${getPaymentStatusBadge(
                          ord.paymentStatus
                        )}`}
                      >
                        {ord.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-serif font-bold text-text-primary">
                      {formatPKR(ord.totalPkr)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-full ${getStatusBadge(
                          ord.orderStatus
                        )}`}
                      >
                        {ord.orderStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleSelectOrder(ord);
                        }}
                        className="px-2.5 py-1 bg-surface-white hover:bg-canvas-bg border border-border-subtle text-[10px] font-semibold text-text-primary rounded-md transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-border-subtle flex items-center justify-between text-xs text-text-secondary">
            <span>
              Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalOrders} total)
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => {
                  setPage((p) => Math.max(1, p - 1));
                  setLoading(true);
                }}
                className="px-3 py-1 bg-surface-white border border-border-subtle rounded-md hover:bg-canvas-bg disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => {
                  setPage((p) => Math.min(totalPages, p + 1));
                  setLoading(true);
                }}
                className="px-3 py-1 bg-surface-white border border-border-subtle rounded-md hover:bg-canvas-bg disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Details & Audit Ledger Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="bg-surface-white border-l border-border-subtle w-full max-w-2xl h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-border-subtle flex items-center justify-between">
              <div>
                <span className="text-[10px] text-accent-gold uppercase font-mono tracking-wider">
                  Order Ledger Dossier
                </span>
                <h2 className="font-serif text-xl font-bold text-text-primary">
                  {selectedOrder.orderReference}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-text-secondary hover:text-text-primary rounded-full hover:bg-surface-subtle border border-border-subtle cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="px-6 pt-3 border-b border-border-subtle flex gap-6 text-xs font-medium bg-surface-subtle/30">
              <button
                type="button"
                onClick={() => setDetailTab("DETAILS")}
                className={`pb-3 transition-colors cursor-pointer ${
                  detailTab === "DETAILS"
                    ? "border-b-2 border-text-primary text-text-primary font-bold"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Order &amp; Customer Details
              </button>
              <button
                type="button"
                onClick={() => setDetailTab("LEDGER")}
                className={`pb-3 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  detailTab === "LEDGER"
                    ? "border-b-2 border-text-primary text-text-primary font-bold"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <span>Payment &amp; Audit Ledger</span>
                {selectedOrder.refunds && selectedOrder.refunds.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded-full text-[9px] font-mono">
                    {selectedOrder.refunds.length}
                  </span>
                )}
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-text-primary">
              {actionError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
                  {actionError}
                </div>
              )}

              {/* Status and Action Buttons */}
              <div className="bg-surface-subtle/50 border border-border-subtle p-5 rounded-2xl space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-text-secondary uppercase font-sans font-semibold block">
                      Order Status
                    </span>
                    <span
                      className={`inline-block mt-1 px-3 py-0.5 text-xs font-medium uppercase tracking-wider rounded-full ${getStatusBadge(
                        selectedOrder.orderStatus
                      )}`}
                    >
                      {selectedOrder.orderStatus}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-text-secondary uppercase font-sans font-semibold block">
                      Payment Status
                    </span>
                    <span
                      className={`inline-block mt-1 px-3 py-0.5 text-xs font-medium uppercase tracking-wider rounded-full ${getPaymentStatusBadge(
                        selectedOrder.paymentStatus
                      )}`}
                    >
                      {selectedOrder.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* Lifecycle Transition Actions */}
                <div className="pt-3 border-t border-border-subtle flex flex-wrap gap-2 items-center">
                  {selectedOrder.orderStatus === "PENDING" && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() =>
                        updateOrderStatus(selectedOrder.orderReference, "CONFIRMED", {
                          note: "Order verified via telephone call with customer.",
                        })
                      }
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold text-xs shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      Confirm Order
                    </button>
                  )}

                  {selectedOrder.orderStatus === "CONFIRMED" && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() =>
                        updateOrderStatus(selectedOrder.orderReference, "PROCESSING", {
                          note: "Atelier staff packing garments in luxury gift packaging.",
                        })
                      }
                      className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-semibold text-xs shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      Move to Processing
                    </button>
                  )}

                  {selectedOrder.orderStatus === "PROCESSING" && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => setShowShipModal(true)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-semibold text-xs shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      Dispatch &amp; Assign Courier 📦
                    </button>
                  )}

                  {selectedOrder.orderStatus === "SHIPPED" && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() =>
                        updateOrderStatus(selectedOrder.orderReference, "DELIVERED", {
                          note: "Consignment marked delivered to customer.",
                        })
                      }
                      className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-full font-semibold text-xs shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      Mark Delivered
                    </button>
                  )}

                  {selectedOrder.orderStatus !== "CANCELLED" &&
                    selectedOrder.orderStatus !== "DELIVERED" && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => setShowCancelModal(true)}
                        className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-full font-semibold text-xs cursor-pointer disabled:opacity-50"
                      >
                        Cancel Order
                      </button>
                    )}

                  {/* Issue Refund Button */}
                  {canIssueRefund && (
                    <button
                      type="button"
                      onClick={() => {
                        setRefundAmount(String(remainingRefundablePkr));
                        setRefundReason("");
                        setRefundNote("");
                        setShowRefundModal(true);
                      }}
                      className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-full font-semibold text-xs shadow-xs cursor-pointer ml-auto"
                    >
                      Issue Refund 💳
                    </button>
                  )}
                </div>
              </div>

              {/* TAB 1: Order Details */}
              {detailTab === "DETAILS" && (
                <>
                  {/* Courier Tracking Section if Shipped */}
                  {selectedOrder.courierInfo && (
                    <div className="bg-surface-white border border-border-subtle p-5 rounded-2xl space-y-1 font-sans shadow-xs">
                      <span className="text-[10px] text-accent-gold uppercase font-semibold tracking-wider block">
                        Courier Consignment Details
                      </span>
                      <div className="text-text-primary text-xs">
                        Courier: <strong className="font-semibold">{selectedOrder.courierInfo.courierName}</strong>
                      </div>
                      <div className="text-text-primary text-xs font-mono">
                        Tracking Number:{" "}
                        <strong className="font-semibold">{selectedOrder.courierInfo.trackingNumber}</strong>
                      </div>
                    </div>
                  )}

                  {/* Customer Delivery Details */}
                  <div className="bg-surface-white border border-border-subtle p-5 rounded-2xl space-y-3 shadow-xs">
                    <h3 className="font-serif text-sm font-bold text-text-primary uppercase tracking-wider border-b border-border-subtle pb-2">
                      Customer &amp; Delivery Address
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-text-secondary text-xs">
                      <div>
                        <span className="text-[10px] text-text-secondary/70 block uppercase font-medium">Name</span>
                        <span className="text-text-primary font-semibold">
                          {selectedOrder.customer.fullName}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-text-secondary/70 block uppercase font-medium">Phone</span>
                        <span className="font-mono text-text-primary font-semibold">
                          {selectedOrder.customer.phone}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-text-secondary/70 block uppercase font-medium">Province</span>
                        <span className="text-text-primary">{selectedOrder.customer.province}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-text-secondary/70 block uppercase font-medium">City / Area</span>
                        <span className="text-text-primary">
                          {selectedOrder.customer.city}, {selectedOrder.customer.area}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-text-secondary/70 block uppercase font-medium">
                          Street Address
                        </span>
                        <span className="text-text-primary">{selectedOrder.customer.streetAddress}</span>
                      </div>
                    </div>
                  </div>

                  {/* Line Items */}
                  <div className="bg-surface-white border border-border-subtle p-5 rounded-2xl space-y-3 shadow-xs">
                    <h3 className="font-serif text-sm font-bold text-text-primary uppercase tracking-wider border-b border-border-subtle pb-2">
                      Ordered Garments ({selectedOrder.items.length})
                    </h3>
                    <div className="divide-y divide-border-subtle">
                      {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <div className="font-semibold text-text-primary truncate">{item.title}</div>
                            <div className="text-[10px] text-text-secondary">
                              Size: {item.size} • Color: {item.color} • SKU: {item.sku}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-serif font-bold text-text-primary">
                              {formatPKR(item.lineTotalPkr)}
                            </div>
                            <div className="text-[10px] text-text-secondary">
                              {item.quantity} × {formatPKR(item.unitPricePkr)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Totals */}
                    <div className="pt-3 border-t border-border-subtle space-y-1.5 font-sans text-right text-xs">
                      <div className="flex justify-between text-text-secondary">
                        <span>Subtotal:</span>
                        <span className="font-medium text-text-primary">{formatPKR(selectedOrder.subtotalPkr)}</span>
                      </div>
                      <div className="flex justify-between text-text-secondary">
                        <span>Delivery Fee (Pakistan):</span>
                        <span className="font-medium text-text-primary">
                          {selectedOrder.deliveryFeePkr === 0
                            ? "FREE"
                            : formatPKR(selectedOrder.deliveryFeePkr)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-serif font-bold text-text-primary pt-2 border-t border-border-subtle">
                        <span>Total Amount:</span>
                        <span className="text-base text-text-primary">
                          {formatPKR(selectedOrder.totalPkr)}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* TAB 2: Payment & Audit Ledger */}
              {detailTab === "LEDGER" && (
                <>
                  {/* Financial Balance Summary */}
                  <div className="bg-surface-white border border-border-subtle p-5 rounded-2xl space-y-3 shadow-xs">
                    <h3 className="font-serif text-sm font-bold text-text-primary uppercase tracking-wider border-b border-border-subtle pb-2">
                      Financial Balance &amp; Ledger
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 bg-surface-subtle rounded-xl">
                        <span className="text-[10px] text-text-secondary uppercase font-medium block">Total Order</span>
                        <span className="font-serif font-bold text-sm text-text-primary">
                          {formatPKR(selectedOrder.totalPkr)}
                        </span>
                      </div>
                      <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                        <span className="text-[10px] text-emerald-800 uppercase font-medium block">Collected</span>
                        <span className="font-serif font-bold text-sm text-emerald-700">
                          {selectedOrder.paymentStatus === "PAID" || selectedOrder.paymentStatus === "PARTIALLY_REFUNDED"
                            ? formatPKR(selectedOrder.totalPkr)
                            : "PKR 0"}
                        </span>
                      </div>
                      <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl">
                        <span className="text-[10px] text-purple-800 uppercase font-medium block">Refunded</span>
                        <span className="font-serif font-bold text-sm text-purple-700">
                          {formatPKR(totalRefundedPkr)}
                        </span>
                      </div>
                      <div className="p-3 bg-surface-subtle rounded-xl">
                        <span className="text-[10px] text-text-secondary uppercase font-medium block">Refundable</span>
                        <span className="font-serif font-bold text-sm text-text-primary">
                          {formatPKR(remainingRefundablePkr)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Refunds Ledger */}
                  <div className="bg-surface-white border border-border-subtle p-5 rounded-2xl space-y-3 shadow-xs">
                    <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                      <h3 className="font-serif text-sm font-bold text-text-primary uppercase tracking-wider">
                        Processed Refunds ({selectedOrder.refunds?.length || 0})
                      </h3>
                      {canIssueRefund && (
                        <button
                          type="button"
                          onClick={() => {
                            setRefundAmount(String(remainingRefundablePkr));
                            setRefundReason("");
                            setRefundNote("");
                            setShowRefundModal(true);
                          }}
                          className="px-3 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
                        >
                          + Issue Refund
                        </button>
                      )}
                    </div>

                    {!selectedOrder.refunds || selectedOrder.refunds.length === 0 ? (
                      <div className="py-4 text-center text-text-secondary text-xs">
                        No refunds recorded for this order.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedOrder.refunds.map((rf) => (
                          <div
                            key={rf.id}
                            className="p-3 bg-surface-subtle rounded-xl border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div>
                              <div className="font-serif font-bold text-text-primary text-xs">
                                {formatPKR(rf.amountPkr)}
                                <span className="ml-2 font-mono text-[10px] text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full uppercase">
                                  {rf.provider}
                                </span>
                              </div>
                              <div className="text-[11px] text-text-secondary mt-0.5">
                                Reason: {rf.reason}
                              </div>
                              <div className="text-[10px] text-text-secondary/70 font-mono mt-0.5">
                                ID: {rf.id}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="inline-block px-2 py-0.5 text-[9px] font-mono uppercase bg-emerald-100 text-emerald-800 rounded-full font-bold">
                                {rf.status}
                              </span>
                              <div className="text-[10px] text-text-secondary font-mono mt-0.5">
                                {new Date(rf.requestedAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Payment Attempts & Gateway Events Timeline */}
                  <div className="bg-surface-white border border-border-subtle p-5 rounded-2xl space-y-3 shadow-xs">
                    <h3 className="font-serif text-sm font-bold text-text-primary uppercase tracking-wider border-b border-border-subtle pb-2">
                      Payment Attempts &amp; Gateway Events ({selectedOrder.paymentAttempts?.length || 0})
                    </h3>

                    {!selectedOrder.paymentAttempts || selectedOrder.paymentAttempts.length === 0 ? (
                      <div className="py-4 text-center text-text-secondary text-xs">
                        No external payment attempt records found (Order created via standard cash pipeline).
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedOrder.paymentAttempts.map((pa) => (
                          <div
                            key={pa.id}
                            className="p-3.5 bg-surface-subtle/70 rounded-xl border border-border-subtle space-y-2"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                              <div>
                                <span className="font-semibold text-text-primary">
                                  {pa.provider} ({pa.paymentMethod})
                                </span>
                                <span className="ml-2 font-mono text-[10px] text-text-secondary">
                                  ID: {pa.id}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-serif font-bold text-text-primary">
                                  {formatPKR(pa.amountPkr)}
                                </span>
                                <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-surface-white border border-border-subtle rounded-full font-bold">
                                  {pa.status}
                                </span>
                              </div>
                            </div>

                            {pa.providerPaymentId && (
                              <div className="text-[11px] font-mono text-text-secondary">
                                Gateway Trans ID: <strong className="text-text-primary">{pa.providerPaymentId}</strong>
                              </div>
                            )}

                            {pa.failureMessage && (
                              <div className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200">
                                Failure: [{pa.failureCode || "FAILED"}] {pa.failureMessage}
                              </div>
                            )}

                            {/* Raw Gateway Events */}
                            {pa.events && pa.events.length > 0 && (
                              <div className="pt-2 border-t border-border-subtle/60 space-y-1">
                                <span className="text-[10px] font-mono uppercase font-semibold text-text-secondary block">
                                  Raw Event Log ({pa.events.length})
                                </span>
                                <div className="space-y-1">
                                  {pa.events.map((ev) => (
                                    <div
                                      key={ev.id}
                                      className="p-2 bg-surface-white rounded-lg border border-border-subtle text-[10px] flex items-center justify-between"
                                    >
                                      <div>
                                        <span className="font-mono font-semibold text-text-primary">{ev.eventType}</span>
                                        <span className="text-text-secondary ml-2 font-mono">
                                          Event: {ev.providerEventId}
                                        </span>
                                      </div>
                                      <span className="text-text-secondary font-mono">
                                        {new Date(ev.receivedAt).toLocaleTimeString()}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Audit Logs */}
                  {selectedOrder.auditLogs && selectedOrder.auditLogs.length > 0 && (
                    <div className="bg-surface-white border border-border-subtle p-5 rounded-2xl space-y-3 shadow-xs">
                      <h3 className="font-serif text-sm font-bold text-text-primary uppercase tracking-wider border-b border-border-subtle pb-2">
                        Audit Trail History
                      </h3>
                      <div className="space-y-2">
                        {selectedOrder.auditLogs.map((log) => (
                          <div
                            key={log.id}
                            className="p-3 bg-surface-subtle rounded-xl border border-border-subtle/60 text-[11px]"
                          >
                            <div className="flex justify-between font-mono text-[10px] text-text-secondary">
                              <span>{log.performedBy}</span>
                              <span>{new Date(log.timestamp).toLocaleString()}</span>
                            </div>
                            <div className="text-text-primary font-medium mt-1">{log.action}</div>
                            {log.note && (
                              <div className="text-text-secondary text-[10px] mt-0.5">{log.note}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedOrder && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-white border border-border-subtle rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-text-primary">
                  Issue Order Refund
                </h3>
                <p className="text-[11px] text-text-secondary font-mono">
                  Order: {selectedOrder.orderReference}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRefundModal(false)}
                className="text-text-secondary hover:text-text-primary cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {refundError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
                {refundError}
              </div>
            )}

            <div className="p-3 bg-surface-subtle rounded-xl border border-border-subtle text-xs space-y-1">
              <div className="flex justify-between text-text-secondary">
                <span>Total Order Value:</span>
                <span className="font-mono font-bold text-text-primary">{formatPKR(selectedOrder.totalPkr)}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Remaining Refundable Capacity:</span>
                <span className="font-mono font-bold text-purple-700">{formatPKR(remainingRefundablePkr)}</span>
              </div>
            </div>

            <form onSubmit={handleRefundSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-text-secondary font-medium mb-1">
                  Refund Amount in PKR (Max {formatPKR(remainingRefundablePkr)}):
                </label>
                <input
                  type="number"
                  value={refundAmount}
                  max={remainingRefundablePkr}
                  min={1}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  required
                  placeholder="e.g. 50000"
                  className="w-full bg-surface-white border border-border-subtle rounded-lg p-2.5 text-text-primary font-mono focus:outline-none focus:border-text-primary"
                />
              </div>

              <div>
                <label className="block text-text-secondary font-medium mb-1">Refund Method:</label>
                <select
                  value={refundMethod}
                  onChange={(e) =>
                    setRefundMethod(
                      e.target.value as "ORIGINAL_PAYMENT" | "MANUAL_BANK_TRANSFER" | "STORE_CREDIT"
                    )
                  }
                  className="w-full bg-surface-white border border-border-subtle rounded-lg p-2.5 text-text-primary focus:outline-none focus:border-text-primary cursor-pointer"
                >
                  <option value="ORIGINAL_PAYMENT">Original Payment Method (Automated Gateway)</option>
                  <option value="MANUAL_BANK_TRANSFER">Manual Bank Transfer / IBFT</option>
                  <option value="STORE_CREDIT">Store Credit / Atelier Voucher</option>
                </select>
              </div>

              <div>
                <label className="block text-text-secondary font-medium mb-1">
                  Mandatory Refund Reason:
                </label>
                <input
                  type="text"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  required
                  placeholder="e.g. Size exchange unavailable, fabric defect reported..."
                  className="w-full bg-surface-white border border-border-subtle rounded-lg p-2.5 text-text-primary focus:outline-none focus:border-text-primary"
                />
              </div>

              <div>
                <label className="block text-text-secondary font-medium mb-1">
                  Administrative Note (Optional):
                </label>
                <textarea
                  value={refundNote}
                  onChange={(e) => setRefundNote(e.target.value)}
                  rows={2}
                  placeholder="Internal audit notes, bank transaction references, IBFT transfer ID..."
                  className="w-full bg-surface-white border border-border-subtle rounded-lg p-2.5 text-text-primary focus:outline-none focus:border-text-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  disabled={refundLoading}
                  className="px-4 py-2 border border-border-subtle text-text-secondary hover:bg-canvas-bg rounded-full text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={refundLoading}
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white rounded-full font-semibold uppercase tracking-wider text-[11px] cursor-pointer shadow-xs"
                >
                  {refundLoading ? "Executing Refund..." : "Process Refund"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {showCancelModal && selectedOrder && (
        <div className="fixed inset-0 z-60 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-white border border-border-subtle rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="font-serif text-lg font-bold text-rose-700">Cancel Order</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Cancelling order <strong>{selectedOrder.orderReference}</strong> records the cancellation and restores reserved stock atomically.
            </p>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                Mandatory Cancellation Reason:
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="e.g. Customer changed mind, incorrect address provided, unreachable on phone..."
                rows={3}
                className="w-full bg-surface-white border border-border-subtle rounded-xl p-3 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-1.5 bg-surface-subtle hover:bg-surface-white border border-border-subtle text-text-primary rounded-full text-xs font-medium cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!cancellationReason.trim() || actionLoading}
                onClick={() =>
                  updateOrderStatus(selectedOrder.orderReference, "CANCELLED", {
                    cancellationReason,
                  })
                }
                className="px-5 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-full text-xs font-semibold cursor-pointer shadow-xs"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Modal */}
      {showShipModal && selectedOrder && (
        <div className="fixed inset-0 z-60 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-white border border-border-subtle rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="font-serif text-lg font-bold text-text-primary">
              Dispatch Order &amp; Courier Assignment
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Enter courier details for order <strong>{selectedOrder.orderReference}</strong>.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                  Courier Service:
                </label>
                <select
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full bg-surface-white border border-border-subtle rounded-xl p-2.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-text-primary cursor-pointer"
                >
                  <option value="TCS">TCS Express</option>
                  <option value="Leopards">Leopards Courier</option>
                  <option value="Trax">Trax Logistics</option>
                  <option value="Call Courier">Call Courier</option>
                  <option value="Rider">Atelier Karachi Express Rider</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                  Consignment Tracking Number:
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. TCS-9821342 or LEO-77123"
                  className="w-full bg-surface-white border border-border-subtle rounded-xl p-2.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-text-primary"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowShipModal(false)}
                className="px-4 py-1.5 bg-surface-subtle hover:bg-surface-white border border-border-subtle text-text-primary rounded-full text-xs font-medium cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!trackingNumber.trim() || actionLoading}
                onClick={() =>
                  updateOrderStatus(selectedOrder.orderReference, "SHIPPED", {
                    courierInfo: { courierName, trackingNumber },
                  })
                }
                className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-full text-xs font-semibold cursor-pointer shadow-xs"
              >
                Dispatch Parcel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
