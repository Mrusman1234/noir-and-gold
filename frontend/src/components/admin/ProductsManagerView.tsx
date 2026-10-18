"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ProductDetail } from "@/types";
import { formatPKR } from "@/lib/utils";
import { VariantMatrixBuilder, VariantMatrixItem } from "./VariantMatrixBuilder";
import { ImageUploader, ProductImageItem } from "./ImageUploader";

const AUDIENCE_OPTIONS = ["women", "men", "unisex"] as const;
type ProductAudience = (typeof AUDIENCE_OPTIONS)[number];

function toAudience(value: string): ProductAudience {
  return (AUDIENCE_OPTIONS as readonly string[]).includes(value)
    ? (value as ProductAudience)
    : "unisex";
}

export type ImageManagerItem = ProductImageItem;

export function ProductsManagerView() {
  const [products, setProducts] = useState<ProductDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "ARCHIVED">("ALL");

  // Feedback Notification
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    type: "ARCHIVE" | "RESTORE";
    product: ProductDetail;
  } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Women's Luxury Prêt");
  const [newAudience, setNewAudience] = useState<ProductAudience>("women");
  const [newPrice, setNewPrice] = useState("");
  const [newFabric, setNewFabric] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newImages, setNewImages] = useState<ImageManagerItem[]>([
    {
      url: "/images/products/prod-001-primary.jpg",
      altText: "Primary Garment View",
      displayOrder: 0,
      isPrimary: true,
    },
  ]);
  const [newVariants, setNewVariants] = useState<VariantMatrixItem[]>([
    { size: "S", colorName: "Obsidian Black", colorHex: "#252522", stock: 5, sku: "NG-GARMENT-OBS-S-1", isActive: true },
    { size: "M", colorName: "Obsidian Black", colorHex: "#252522", stock: 5, sku: "NG-GARMENT-OBS-M-2", isActive: true },
    { size: "L", colorName: "Obsidian Black", colorHex: "#252522", stock: 3, sku: "NG-GARMENT-OBS-L-3", isActive: true },
  ]);

  // Edit Modal State
  const [editingProduct, setEditingProduct] = useState<ProductDetail | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editCategory, setEditCategory] = useState("Women's Luxury Prêt");
  const [editAudience, setEditAudience] = useState<ProductAudience>("women");
  const [editPrice, setEditPrice] = useState("");
  const [editSalePrice, setEditSalePrice] = useState("");
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "DRAFT" | "ARCHIVED">("ACTIVE");
  const [editFabric, setEditFabric] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImages, setEditImages] = useState<ImageManagerItem[]>([]);
  const [editVariants, setEditVariants] = useState<VariantMatrixItem[]>([]);

  const showFeedback = useCallback((type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback((current) => (current?.message === message ? null : current));
    }, 4500);
  }, []);


  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const res = await fetch("/api/v1/admin/products");
        if (!res.ok) throw new Error("Failed to load products");
        const data = await res.json();
        if (!ignore && data.success) {
          setProducts(data.products || []);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Products fetch error:", err);
          showFeedback("error", "Failed to retrieve atelier catalog from server.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      ignore = true;
    };
  }, [showFeedback]);


  // Open Edit Modal
  const openEditModal = (prod: ProductDetail) => {
    setEditingProduct(prod);
    setEditError("");
    setEditTitle(prod.title);
    setEditSlug(prod.slug);
    setEditCategory(prod.categoryName);
    setEditAudience(toAudience(prod.audience || "unisex"));
    setEditPrice(String(prod.pricePkr));
    setEditSalePrice(prod.salePricePkr ? String(prod.salePricePkr) : "");
    setEditStatus(prod.isSoldOut ? "ARCHIVED" : "ACTIVE");
    setEditFabric(prod.fabric || "");
    setEditDescription(prod.description || "");

    // Map Images
    const mappedImages: ImageManagerItem[] = (prod.images || []).map((img, i) => ({
      id: img.id,
      url: img.url,
      altText: img.alt || prod.title,
      displayOrder: i,
      isPrimary: Boolean(img.isPrimary ?? (i === 0)),
    }));
    if (mappedImages.length === 0 && prod.primaryImageUrl) {
      mappedImages.push({
        url: prod.primaryImageUrl,
        altText: prod.title,
        displayOrder: 0,
        isPrimary: true,
      });
    }
    setEditImages(mappedImages);

    // Map Variants
    const mappedVariants: VariantMatrixItem[] = (prod.variants || []).map((v) => ({
      id: v.id,
      size: v.size,
      colorName: v.colorName,
      colorHex: v.colorHex || "#1F2022",
      stock: v.stock,
      sku: v.sku,
      priceDeltaPkr: v.pricePkr ? v.pricePkr - prod.pricePkr : 0,
      pricePkr: v.pricePkr || prod.pricePkr,
      isActive: true,
    }));
    setEditVariants(mappedVariants);
  };

  // Submit Product Edit (PATCH)
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setEditError("");

    if (!editTitle.trim() || !editPrice) {
      setEditError("Title and price are required.");
      return;
    }

    if (editVariants.length === 0) {
      setEditError("At least one variant SKU is required.");
      return;
    }

    // Check duplicate SKUs
    const skus = editVariants.map((v) => v.sku.trim().toUpperCase());
    if (new Set(skus).size !== skus.length) {
      setEditError("Duplicate SKU detected in Variant Matrix. All SKUs must be unique.");
      return;
    }

    try {
      setEditLoading(true);
      const basePrice = Number(editPrice);

      const primaryImg = editImages.find((img) => img.isPrimary)?.url || editImages[0]?.url || editingProduct.primaryImageUrl;

      const payload = {
        title: editTitle.trim(),
        slug: editSlug.trim(),
        categoryName: editCategory,
        audience: editAudience,
        pricePkr: basePrice,
        basePricePkr: basePrice,
        salePricePkr: editSalePrice ? Number(editSalePrice) : null,
        status: editStatus,
        isSoldOut: editStatus === "ARCHIVED",
        fabric: editFabric.trim(),
        fabricDetails: editFabric.trim(),
        description: editDescription.trim(),
        primaryImageUrl: primaryImg,
        images: editImages.map((img, idx) => ({
          url: img.url,
          alt: img.altText || editTitle.trim(),
          isPrimary: img.url === primaryImg,
          displayOrder: idx,
        })),
        variants: editVariants.map((v) => ({
          id: v.id,
          size: v.size.trim(),
          colorName: v.colorName.trim(),
          colorHex: v.colorHex.trim(),
          stock: Number(v.stock),
          sku: v.sku.trim(),
          pricePkr: v.pricePkr ? Number(v.pricePkr) : basePrice,
          isActive: v.isActive,
        })),
      };

      const res = await fetch(`/api/v1/admin/products/${editingProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to update product.");
      }

      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? data.product : p))
      );
      setEditingProduct(null);
      showFeedback("success", `Garment "${editTitle}" updated successfully.`);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update product.");
    } finally {
      setEditLoading(false);
    }
  };

  // Submit Product Creation (POST)
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!newTitle.trim() || !newPrice) {
      setFormError("Title and price are required.");
      return;
    }

    if (newVariants.length === 0) {
      setFormError("At least one variant SKU is required.");
      return;
    }

    // Check duplicate SKUs
    const skus = newVariants.map((v) => v.sku.trim().toUpperCase());
    if (new Set(skus).size !== skus.length) {
      setFormError("Duplicate SKU detected in Variant Matrix. All SKUs must be unique.");
      return;
    }

    try {
      setCreateLoading(true);
      const slug = newTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const primaryImg = newImages.find((img) => img.isPrimary)?.url || newImages[0]?.url || "/images/products/prod-001-primary.jpg";
      const basePrice = Number(newPrice);

      const payload = {
        title: newTitle.trim(),
        slug,
        categoryName: newCategory,
        audience: newAudience,
        pricePkr: basePrice,
        basePricePkr: basePrice,
        fabric: newFabric || "Pure Pakistani Handloom Raw Silk",
        fabricDetails: newFabric || "Pure Pakistani Handloom Raw Silk",
        description:
          newDescription ||
          "Exquisite artisanal luxury silhouette crafted with master craftsmanship.",
        primaryImageUrl: primaryImg,
        images: newImages.map((img, i) => ({
          url: img.url,
          alt: img.altText || newTitle.trim(),
          isPrimary: img.url === primaryImg,
          displayOrder: i,
        })),
        variants: newVariants.map((v) => ({
          size: v.size.trim(),
          colorName: v.colorName.trim(),
          colorHex: v.colorHex.trim(),
          stock: Number(v.stock),
          sku: v.sku.trim(),
          pricePkr: v.pricePkr ? Number(v.pricePkr) : basePrice,
          isActive: v.isActive,
        })),
        details: ["Crafted by master artisans in Pakistan"],
        careInstructions: ["Specialist Dry Clean Only"],
      };

      const res = await fetch("/api/v1/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to create garment.");
      }

      setProducts((prev) => [data.product, ...prev]);
      setShowCreateModal(false);
      setNewTitle("");
      setNewPrice("");
      setNewFabric("");
      setNewDescription("");
      showFeedback("success", `Garment "${data.product.title}" created successfully.`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create product.");
    } finally {
      setCreateLoading(false);
    }
  };

  // Archive / Restore Execution
  const executeConfirmAction = async () => {
    if (!confirmModal) return;
    const { type, product } = confirmModal;

    try {
      setConfirmLoading(true);

      if (type === "ARCHIVE") {
        // Soft delete / archive
        const res = await fetch(`/api/v1/admin/products/${product.id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data?.error?.message || "Failed to archive product.");
        }
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, isSoldOut: true } : p))
        );
        showFeedback("success", `Garment "${product.title}" archived successfully.`);
      } else {
        // Restore active
        const res = await fetch(`/api/v1/admin/products/${product.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "RESTORE" }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data?.error?.message || "Failed to restore product.");
        }
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, isSoldOut: false } : p))
        );
        showFeedback("success", `Garment "${product.title}" restored to active catalog.`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Action failed.";
      showFeedback("error", msg);
    } finally {
      setConfirmLoading(false);
      setConfirmModal(null);
    }
  };

  const filtered = products.filter((p) => {
    const matchesSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase());
    const matchesCat =
      selectedCategory === "ALL" || p.categoryName === selectedCategory;

    let matchesStatus = true;
    if (statusFilter === "ACTIVE") matchesStatus = !p.isSoldOut;
    if (statusFilter === "ARCHIVED") matchesStatus = Boolean(p.isSoldOut);

    return matchesSearch && matchesCat && matchesStatus;
  });

  const categories = Array.from(new Set(products.map((p) => p.categoryName)));

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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            Garment Catalog
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Manage couture pieces, variant SKUs, atelier descriptions, image assets, and pricing in PKR.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex cursor-pointer items-center gap-2 self-start rounded-full bg-text-primary px-5 py-2.5 text-xs font-medium uppercase tracking-wider text-surface-white transition-colors hover:bg-neutral-800 sm:self-auto shadow-xs"
        >
          <span>+ Add New Garment</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-surface-white border border-border-subtle rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search garments by title, slug, or SKU..."
          className="w-full md:w-80 bg-surface-white border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-text-primary"
        />

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto text-xs text-text-secondary">
          <div className="flex items-center gap-1.5">
            <span className="font-medium">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-surface-white border border-border-subtle rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-text-primary cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "ARCHIVED")}
              className="bg-surface-white border border-border-subtle rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-text-primary cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="ARCHIVED">Archived / Soft-Deleted</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-surface-white border border-border-subtle rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-subtle text-[10px] uppercase font-sans font-semibold tracking-wider text-text-secondary border-b border-border-subtle">
              <tr>
                <th className="py-3 px-4">Garment</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Audience</th>
                <th className="py-3 px-4">Base Price</th>
                <th className="py-3 px-4">Variant Matrix</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-text-secondary font-sans">
                    Loading atelier catalog...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-text-secondary font-sans">
                    No garments match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((prod) => {
                  const totalStock = prod.variants.reduce((acc, v) => acc + v.stock, 0);
                  const isArchived = Boolean(prod.isSoldOut);

                  return (
                    <tr key={prod.id} className="hover:bg-canvas-bg/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-12 relative rounded overflow-hidden border border-border-subtle shrink-0 bg-surface-subtle">
                            <Image
                              src={prod.primaryImageUrl}
                              alt={prod.title}
                              fill
                              className="object-cover"
                              unoptimized={prod.primaryImageUrl.startsWith("http")}
                            />
                          </div>
                          <div>
                            <div className="font-medium text-text-primary">{prod.title}</div>
                            <div className="text-[10px] text-text-secondary font-mono">
                              {prod.sku} • /{prod.slug}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-text-secondary">{prod.categoryName}</td>
                      <td className="py-3 px-4 font-mono text-[10px] uppercase text-text-secondary">
                        {prod.audience || "unisex"}
                      </td>
                      <td className="py-3 px-4 font-serif font-medium text-text-primary">
                        {formatPKR(prod.pricePkr)}
                        {prod.salePricePkr && (
                          <div className="text-[10px] text-rose-600 line-through">
                            {formatPKR(prod.salePricePkr)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <span className="text-text-primary font-medium">{prod.variants.length} SKUs</span>
                        <span className="text-text-secondary ml-1">
                          ({totalStock} pcs)
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-full border ${
                            isArchived
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {isArchived ? "ARCHIVED / SOFT-DELETED" : "ACTIVE"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(prod)}
                            className="px-2.5 py-1 bg-surface-white hover:bg-canvas-bg border border-border-subtle text-[10px] font-semibold text-text-primary rounded-md transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          {isArchived ? (
                            <button
                              type="button"
                              onClick={() => setConfirmModal({ type: "RESTORE", product: prod })}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[10px] font-medium text-emerald-800 rounded-md transition-colors cursor-pointer"
                            >
                              Restore
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmModal({ type: "ARCHIVE", product: prod })}
                              className="px-2.5 py-1 bg-surface-white hover:bg-canvas-bg border border-border-subtle text-[10px] font-mono text-text-secondary hover:text-rose-700 rounded-md transition-colors cursor-pointer"
                            >
                              Archive
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Archive / Restore */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-white border border-border-subtle rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="font-serif text-lg font-bold text-text-primary">
              {confirmModal.type === "ARCHIVE" ? "Archive Garment" : "Restore Garment"}
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              {confirmModal.type === "ARCHIVE" ? (
                <>
                  Are you sure you want to soft-delete <strong>{confirmModal.product.title}</strong>? It will be marked as{" "}
                  <code className="text-rose-600 font-mono">ARCHIVED</code>, hidden from the public storefront, and its stock deactivated while preserving historical orders.
                </>
              ) : (
                <>
                  Restore <strong>{confirmModal.product.title}</strong> to active catalog? It will become visible on the storefront and available for ordering.
                </>
              )}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                disabled={confirmLoading}
                className="px-4 py-2 border border-border-subtle text-text-secondary hover:bg-canvas-bg rounded-lg text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeConfirmAction}
                disabled={confirmLoading}
                className={`px-4 py-2 rounded-lg text-xs font-semibold text-white cursor-pointer shadow-xs ${
                  confirmModal.type === "ARCHIVE"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {confirmLoading
                  ? "Processing..."
                  : confirmModal.type === "ARCHIVE"
                    ? "Confirm Archive"
                    : "Confirm Restore"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-white border border-border-subtle rounded-2xl p-6 max-w-3xl w-full space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-text-primary">
                  Edit Garment: {editingProduct.title}
                </h3>
                <p className="text-[11px] text-text-secondary font-mono">
                  ID: {editingProduct.id} • SKU: {editingProduct.sku}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="text-text-secondary hover:text-text-primary p-1 cursor-pointer transition-colors"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-secondary font-medium mb-1">Garment Title:</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                    className="w-full bg-surface-white border border-border-subtle rounded-lg p-2.5 text-text-primary focus:outline-none focus:border-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary font-medium mb-1">Slug:</label>
                  <input
                    type="text"
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value)}
                    required
                    className="w-full bg-surface-white border border-border-subtle rounded-lg p-2.5 text-text-primary font-mono focus:outline-none focus:border-text-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-text-secondary font-medium mb-1">Category:</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full bg-surface-white border border-border-subtle rounded-lg p-2.5 text-text-primary focus:outline-none focus:border-text-primary cursor-pointer"
                  >
                    <option value="Women's Luxury Prêt">Women&apos;s Luxury Prêt</option>
                    <option value="Men's Bespoke & Formal">Men&apos;s Bespoke & Formal</option>
                    <option value="Men's Luxury Casual">Men&apos;s Luxury Casual</option>
                    <option value="Festive Shawls & Wraps">Festive Shawls & Wraps</option>
                    <option value="Women's Formal Wear">Women&apos;s Formal Wear</option>
                    <option value="Men's Kurta & Waistcoat">Men&apos;s Kurta & Waistcoat</option>
                  </select>
                </div>
                <div>
                  <label className="block text-text-secondary font-medium mb-1">Audience:</label>
                  <select
                    value={editAudience}
                    onChange={(e) => setEditAudience(toAudience(e.target.value))}
                    className="w-full bg-surface-white border border-border-subtle rounded-lg p-2.5 text-text-primary focus:outline-none focus:border-text-primary cursor-pointer"
                  >
                    <option value="women">Women</option>
                    <option value="men">Men</option>
                    <option value="unisex">Unisex</option>
                  </select>
                </div>
                <div>
                  <label className="block text-text-secondary font-medium mb-1">Status:</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as "ACTIVE" | "DRAFT" | "ARCHIVED")}
                    className="w-full bg-surface-white border border-border-subtle rounded-lg p-2.5 text-text-primary focus:outline-none focus:border-text-primary cursor-pointer"
                  >
                    <option value="ACTIVE">ACTIVE (Published)</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="ARCHIVED">ARCHIVED / Soft-Deleted</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-secondary font-medium mb-1">Base Price (PKR):</label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    required
                    className="w-full bg-surface-white border border-border-subtle rounded-lg p-2.5 text-text-primary font-mono focus:outline-none focus:border-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary font-medium mb-1">Sale / Promotional Price (Optional):</label>
                  <input
                    type="number"
                    value={editSalePrice}
                    onChange={(e) => setEditSalePrice(e.target.value)}
                    placeholder="Leave empty if regular price"
                    className="w-full bg-surface-white border border-border-subtle rounded-lg p-2.5 text-text-primary font-mono focus:outline-none focus:border-text-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-text-secondary font-medium mb-1">Fabric Composition:</label>
                <input
                  type="text"
                  value={editFabric}
                  onChange={(e) => setEditFabric(e.target.value)}
                  className="w-full bg-surface-white border border-border-subtle rounded-lg p-2.5 text-text-primary focus:outline-none focus:border-text-primary"
                />
              </div>

              <div>
                <label className="block text-text-secondary font-medium mb-1">Atelier Description:</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-surface-white border border-border-subtle rounded-lg p-2.5 text-text-primary focus:outline-none focus:border-text-primary"
                />
              </div>

              {/* Image Manager in Edit Modal */}
              <div className="p-4 bg-surface-subtle border border-border-subtle rounded-xl space-y-3">
                <div>
                  <h4 className="font-semibold text-text-primary">Product Image Gallery</h4>
                  <p className="text-[11px] text-text-secondary">Drag and drop photography, set cover photo, reorder, and edit alt text.</p>
                </div>

                <ImageUploader
                  images={editImages}
                  onChange={setEditImages}
                  disabled={editLoading}
                />
              </div>

              {/* Dynamic Variant Matrix Builder */}
              <div className="border-t border-border-subtle pt-3">
                <VariantMatrixBuilder
                  variants={editVariants}
                  onChange={setEditVariants}
                  basePricePkr={Number(editPrice) || editingProduct.pricePkr}
                  productSlug={editSlug || editingProduct.slug}
                  disabled={editLoading}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-canvas-bg rounded-full text-xs font-medium cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 bg-text-primary hover:bg-neutral-800 text-surface-white rounded-full font-medium uppercase tracking-wider text-[11px] cursor-pointer transition-colors shadow-xs disabled:opacity-50"
                >
                  {editLoading ? "Updating..." : "Update Garment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-white border border-border-subtle rounded-2xl p-6 max-w-3xl w-full space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-text-primary">Add New Garment</h3>
                <p className="text-[11px] text-text-secondary">
                  Create a new luxury attire piece in the atelier database.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-text-secondary hover:text-text-primary p-1 cursor-pointer transition-colors"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-secondary font-medium mb-1">Garment Title:</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Imperial Hand-Embroidered Velvet Sherwani"
                    required
                    className="w-full bg-surface-white border border-border-subtle rounded-lg p-2.5 text-text-primary focus:outline-none focus:border-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary font-medium mb-1">Category:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-surface-white border border-border-subtle rounded-lg p-2.5 text-text-primary focus:outline-none focus:border-text-primary cursor-pointer"
                  >
                    <option value="Women's Luxury Prêt">Women&apos;s Luxury Prêt</option>
                    <option value="Men's Bespoke & Formal">Men&apos;s Bespoke & Formal</option>
                    <option value="Men's Luxury Casual">Men&apos;s Luxury Casual</option>
                    <option value="Festive Shawls & Wraps">Festive Shawls & Wraps</option>
                    <option value="Women's Formal Wear">Women&apos;s Formal Wear</option>
                    <option value="Men's Kurta & Waistcoat">Men&apos;s Kurta & Waistcoat</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-secondary font-medium mb-1">Base Price (PKR):</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="e.g. 55000"
                    required
                    className="w-full bg-surface-white border border-border-subtle rounded-lg p-2.5 text-text-primary font-mono focus:outline-none focus:border-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary font-medium mb-1">Audience:</label>
                  <select
                    value={newAudience}
                    onChange={(e) => setNewAudience(toAudience(e.target.value))}
                    className="w-full bg-surface-white border border-border-subtle rounded-lg p-2.5 text-text-primary focus:outline-none focus:border-text-primary cursor-pointer"
                  >
                    <option value="women">Women</option>
                    <option value="men">Men</option>
                    <option value="unisex">Unisex</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-text-secondary font-medium mb-1">Fabric Composition:</label>
                <input
                  type="text"
                  value={newFabric}
                  onChange={(e) => setNewFabric(e.target.value)}
                  placeholder="e.g. Pure Zari & Velvet Handloom"
                  className="w-full bg-surface-white border border-border-subtle rounded-lg p-2.5 text-text-primary focus:outline-none focus:border-text-primary"
                />
              </div>

              <div>
                <label className="block text-text-secondary font-medium mb-1">Atelier Description:</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Artisanal notes, embroidery motifs, drape characteristics..."
                  rows={2}
                  className="w-full bg-surface-white border border-border-subtle rounded-lg p-2.5 text-text-primary focus:outline-none focus:border-text-primary"
                />
              </div>

              {/* Image Manager in Create Modal */}
              <div className="p-4 bg-surface-subtle border border-border-subtle rounded-xl space-y-3">
                <div>
                  <h4 className="font-semibold text-text-primary">Garment Gallery Assets</h4>
                  <p className="text-[11px] text-text-secondary">Drag and drop photography, set cover photo, reorder, and edit alt text.</p>
                </div>

                <ImageUploader
                  images={newImages}
                  onChange={setNewImages}
                  disabled={createLoading}
                />
              </div>

              {/* Dynamic Variant Matrix Builder */}
              <div className="border-t border-border-subtle pt-3">
                <VariantMatrixBuilder
                  variants={newVariants}
                  onChange={setNewVariants}
                  basePricePkr={Number(newPrice) || 0}
                  productSlug={newTitle}
                  disabled={createLoading}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-canvas-bg rounded-full text-xs font-medium cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 bg-text-primary hover:bg-neutral-800 text-surface-white rounded-full font-medium uppercase tracking-wider text-[11px] cursor-pointer transition-colors shadow-xs disabled:opacity-50"
                >
                  {createLoading ? "Creating..." : "Save Garment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
