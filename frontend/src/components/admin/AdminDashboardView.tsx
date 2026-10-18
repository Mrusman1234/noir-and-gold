"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AdminDashboardMetrics, AdminOrderRecord } from "@/types";
import { formatPKR } from "@/lib/utils";

export function AdminDashboardView() {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<AdminOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {

      const [metricsRes, ordersRes] = await Promise.all([
        fetch("/api/v1/admin/analytics"),
        fetch("/api/v1/admin/orders?limit=6"),
      ]);

      if (!metricsRes.ok || !ordersRes.ok) {
        throw new Error("Failed to load dashboard data. Please verify your credentials.");
      }

      const metricsData = await metricsRes.json();
      const ordersData = await ordersRes.json();

      if (metricsData.success && metricsData.metrics) {
        setMetrics(metricsData.metrics);
      }
      if (ordersData.success && ordersData.orders) {
        setRecentOrders(ordersData.orders);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching admin dashboard information.");
    } finally {
      setLoading(false);
    }
  };

  // The initial render already starts in the loading state, so the effect must
  // not write state synchronously; only a user-triggered retry re-arms the spinner.
  useEffect(() => {
    // The loader is awaited inside the effect so no state is written synchronously
    // during the commit; the initial render already starts in the loading state.
    const load = async () => {
      await fetchDashboardData();
    };
    void load();
  }, []);

  const handleRefreshDashboard = () => {
    setError(null);
    setLoading(true);
    void fetchDashboardData();
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-surface-white border border-border-subtle rounded-xl animate-pulse" />
          <div className="h-8 w-24 bg-surface-white border border-border-subtle rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-surface-white border border-border-subtle rounded-2xl p-5 shadow-xs animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-surface-white border border-border-subtle rounded-2xl shadow-xs animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center text-rose-800 shadow-xs">
        <p className="text-sm">{error}</p>
        <button
          onClick={handleRefreshDashboard}
          className="mt-4 px-5 py-2 bg-text-primary text-surface-white text-xs font-semibold uppercase tracking-wider rounded-full hover:bg-black transition-colors cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Quick Sync */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            Executive Overview
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Real-time Pakistan atelier operations, Cash on Delivery collections, and dispatch metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefreshDashboard}
            className="inline-flex items-center gap-2 px-4 py-2 bg-surface-white hover:bg-surface-subtle border border-border-subtle text-xs text-text-primary font-medium rounded-full transition-colors cursor-pointer shadow-xs"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh Metrics</span>
          </button>
          <Link
            href="/admin/orders"
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-text-primary px-4 py-2 text-xs font-semibold uppercase tracking-wider text-surface-white transition-colors hover:bg-black shadow-xs"
          >
            <span>View All Orders</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Collected Revenue */}
        <div className="bg-surface-white border border-border-subtle p-5 rounded-2xl shadow-xs relative overflow-hidden group hover:border-text-primary/40 transition-colors">
          <div className="flex items-center justify-between text-text-secondary mb-2">
            <span className="text-[11px] font-sans font-semibold uppercase tracking-wider">Collected Revenue</span>
            <span className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center text-xs font-bold">
              ₨
            </span>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
            {formatPKR(metrics?.totalCollectedRevenuePkr || 0)}
          </div>
          <div className="mt-2 text-[11px] text-emerald-700 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Delivered &amp; Paid COD Cash Only</span>
          </div>
        </div>

        {/* Card 2: Pending Pipeline Revenue */}
        <div className="bg-surface-white border border-border-subtle p-5 rounded-2xl shadow-xs relative overflow-hidden group hover:border-text-primary/40 transition-colors">
          <div className="flex items-center justify-between text-text-secondary mb-2">
            <span className="text-[11px] font-sans font-semibold uppercase tracking-wider">In-Transit Pipeline</span>
            <span className="w-7 h-7 rounded-full bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center text-xs">
              ⏳
            </span>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
            {formatPKR(metrics?.pendingRevenuePkr || 0)}
          </div>
          <div className="mt-2 text-[11px] text-amber-700 font-medium flex items-center gap-1.5">
            <span>Pending courier cash collection</span>
          </div>
        </div>

        {/* Card 3: Orders Lifecycle */}
        <div className="bg-surface-white border border-border-subtle p-5 rounded-2xl shadow-xs relative overflow-hidden group hover:border-text-primary/40 transition-colors">
          <div className="flex items-center justify-between text-text-secondary mb-2">
            <span className="text-[11px] font-sans font-semibold uppercase tracking-wider">Total Orders</span>
            <span className="w-7 h-7 rounded-full bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center text-xs">
              📦
            </span>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
            {metrics?.totalOrders || 0}
          </div>
          <div className="mt-2 flex items-center gap-2 text-[10px] font-sans font-medium">
            <span className="text-amber-700">{metrics?.pendingOrders || 0} Pend</span>
            <span className="text-text-secondary/40">•</span>
            <span className="text-blue-700">{metrics?.confirmedOrders || 0} Conf</span>
            <span className="text-text-secondary/40">•</span>
            <span className="text-emerald-700">{metrics?.shippedOrders || 0} Ship</span>
          </div>
        </div>

        {/* Card 4: Inventory Alerts */}
        <div className="bg-surface-white border border-border-subtle p-5 rounded-2xl shadow-xs relative overflow-hidden group hover:border-text-primary/40 transition-colors">
          <div className="flex items-center justify-between text-text-secondary mb-2">
            <span className="text-[11px] font-sans font-semibold uppercase tracking-wider">Stock Alerts</span>
            <span className="w-7 h-7 rounded-full bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center text-xs">
              ⚠️
            </span>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
            {(metrics?.lowStockVariantCount || 0) + (metrics?.outOfStockVariantCount || 0)}
          </div>
          <div className="mt-2 text-[11px] text-rose-700 font-medium flex items-center gap-2">
            <span>{metrics?.lowStockVariantCount || 0} Low Stock</span>
            <span>•</span>
            <span>{metrics?.outOfStockVariantCount || 0} Sold Out</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Orders Pipeline + Operations Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Orders Table */}
        <div className="lg:col-span-2 bg-surface-white border border-border-subtle rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-surface-white">
            <div>
              <h2 className="font-serif text-base text-text-primary font-bold">
                Recent Orders Pipeline
              </h2>
              <p className="text-[11px] text-text-secondary">
                Latest customer reservations awaiting confirmation, packing, or courier dispatch.
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs text-text-primary hover:underline font-semibold"
            >
              All Orders →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-[10px] uppercase font-sans font-semibold tracking-wider text-text-secondary border-b border-border-subtle">
                <tr>
                  <th className="py-3 px-4">Order Ref</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">City</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle font-sans">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-text-secondary">
                      No customer orders placed yet.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((ord) => (
                    <tr
                      key={ord.orderReference}
                      className="hover:bg-surface-subtle/50 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-semibold text-text-primary">
                        <Link href="/admin/orders" className="hover:underline">
                          {ord.orderReference}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-text-primary">
                        <div className="font-medium">{ord.customer.fullName}</div>
                        <div className="text-[10px] text-text-secondary font-mono">
                          {ord.customer.phone}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary">
                        {ord.customer.city}
                      </td>
                      <td className="py-3.5 px-4 font-serif font-bold text-text-primary">
                        {formatPKR(ord.totalPkr)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[10px] uppercase tracking-wider rounded-full font-medium ${getStatusBadge(
                            ord.orderStatus
                          )}`}
                        >
                          {ord.orderStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[10px] uppercase tracking-wider rounded-full font-medium ${
                            ord.paymentStatus === "PAID"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {ord.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Quick Atelier Actions & Shortcuts */}
        <div className="space-y-6">
          {/* Quick Operations Links */}
          <div className="bg-surface-white border border-border-subtle rounded-2xl p-5 shadow-xs">
            <h3 className="font-serif text-sm font-bold text-text-primary mb-3 uppercase tracking-wider">
              Atelier Management
            </h3>
            <div className="space-y-2">
              <Link
                href="/admin/orders"
                className="flex items-center justify-between p-3 bg-surface-white hover:bg-surface-subtle border border-border-subtle rounded-xl text-xs text-text-primary transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span>📦</span>
                  <span className="font-medium">Orders Pipeline</span>
                </div>
                <span className="text-[10px] font-mono text-text-secondary">
                  {metrics?.totalOrders || 0} Orders →
                </span>
              </Link>
              <Link
                href="/admin/inventory"
                className="flex items-center justify-between p-3 bg-surface-white hover:bg-surface-subtle border border-border-subtle rounded-xl text-xs text-text-primary transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span>📊</span>
                  <span className="font-medium">Variant Inventory</span>
                </div>
                <span className="text-[10px] font-mono text-rose-600 font-semibold">
                  {metrics?.lowStockVariantCount || 0} Low Stock →
                </span>
              </Link>
              <Link
                href="/admin/products"
                className="flex items-center justify-between p-3 bg-surface-white hover:bg-surface-subtle border border-border-subtle rounded-xl text-xs text-text-primary transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span>👗</span>
                  <span className="font-medium">Garment Catalog</span>
                </div>
                <span className="text-[10px] font-mono text-text-secondary">
                  {metrics?.totalProductsCount || 0} Styles →
                </span>
              </Link>
              <Link
                href="/admin/categories"
                className="flex items-center justify-between p-3 bg-surface-white hover:bg-surface-subtle border border-border-subtle rounded-xl text-xs text-text-primary transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span>🏷️</span>
                  <span className="font-medium">Store Categories</span>
                </div>
                <span className="text-[10px] font-mono text-text-secondary">
                  Manage →
                </span>
              </Link>
            </div>
          </div>

          {/* Regional Shipping & COD Notice */}
          <div className="bg-surface-subtle border border-border-subtle rounded-2xl p-5 text-xs text-text-secondary space-y-2">
            <div className="flex items-center gap-2 text-text-primary font-bold uppercase tracking-wider text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Pakistani Cash on Delivery (COD)</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Nationwide courier dispatch active. When couriers (TCS, Leopards, Trax) confirm delivery and remittance, mark orders as <strong className="text-text-primary">DELIVERED</strong> and payment as <strong className="text-emerald-700 font-bold">PAID</strong> to register in collected revenue.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
