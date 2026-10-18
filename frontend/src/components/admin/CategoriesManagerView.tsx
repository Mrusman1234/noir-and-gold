"use client";

import React, { useState, useEffect } from "react";
import { CategoryRecord } from "@/types";

const AUDIENCE_OPTIONS = ["women", "men", "unisex"] as const;
type CategoryAudience = (typeof AUDIENCE_OPTIONS)[number];

function toAudience(value: string): CategoryAudience {
  return (AUDIENCE_OPTIONS as readonly string[]).includes(value)
    ? (value as CategoryAudience)
    : "unisex";
}

export function CategoriesManagerView() {
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [audience, setAudience] = useState<CategoryAudience>("women");
  const [description, setDescription] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/v1/admin/categories");
      if (!res.ok) throw new Error("Failed to load categories");
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error("Categories fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchCategories();
    };
    void load();
  }, []);

  const toggleCategory = async (cat: CategoryRecord) => {
    try {
      const nextActive = !cat.isActive;
      const res = await fetch(`/api/v1/admin/categories/${cat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextActive }),
      });
      if (res.ok) {
        setCategories((prev) =>
          prev.map((c) => (c.id === cat.id ? { ...c, isActive: nextActive } : c))
        );
      }
    } catch (err) {
      console.error("Error toggling category:", err);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Category name is required.");
      return;
    }

    try {
      setCreateLoading(true);
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const res = await fetch("/api/v1/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug,
          description: description.trim(),
          audience,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to create category");
      }

      setCategories((prev) => [...prev, data.category]);
      setShowCreateModal(false);
      setName("");
      setDescription("");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create category");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            Store Categories
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Manage luxury department classifications, curation banners, and navigation hierarchies.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex cursor-pointer items-center gap-2 self-start rounded-full bg-text-primary px-5 py-2.5 text-xs font-medium uppercase tracking-wider text-surface-white transition-colors hover:bg-neutral-800 sm:self-auto shadow-xs"
        >
          <span>+ Add New Category</span>
        </button>
      </div>

      {/* Categories Table */}
      <div className="bg-surface-white border border-border-subtle rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-canvas-bg text-[10px] uppercase font-mono tracking-wider text-text-secondary border-b border-border-subtle">
              <tr>
                <th className="py-3 px-4 font-semibold">Category Name</th>
                <th className="py-3 px-4 font-semibold">Slug Identifier</th>
                <th className="py-3 px-4 font-semibold">Audience</th>
                <th className="py-3 px-4 font-semibold">Description</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-text-secondary">
                    <div className="inline-block w-6 h-6 border-2 border-border-subtle border-t-text-primary rounded-full animate-spin mb-2" />
                    <div>Loading store categories...</div>
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-text-secondary">
                    No categories found.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-canvas-bg/60 transition-colors">
                    <td className="py-3.5 px-4 font-serif text-sm font-semibold text-text-primary">
                      {cat.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-text-secondary text-[11px]">
                      {cat.slug}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[10px] uppercase text-text-secondary">
                      {cat.audience}
                    </td>
                    <td className="py-3.5 px-4 text-text-secondary max-w-xs truncate">
                      {cat.description || "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-full border ${
                          cat.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-neutral-100 text-neutral-600 border-neutral-200"
                        }`}
                      >
                        {cat.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className="px-2.5 py-1 bg-surface-white hover:bg-canvas-bg border border-border-subtle text-[10px] font-mono text-text-primary rounded-md transition-colors cursor-pointer"
                      >
                        {cat.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Category Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-white border border-border-subtle rounded-xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h3 className="font-serif text-lg font-bold text-text-primary">
                Add Store Category
              </h3>
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
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateCategory} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-text-secondary font-medium mb-1">Category Name:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Wedding Formals"
                  required
                  className="w-full bg-surface-white border border-border-subtle rounded-md p-2 text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-text-primary"
                />
              </div>

              <div>
                <label className="block text-text-secondary font-medium mb-1">Audience:</label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(toAudience(e.target.value))}
                  className="w-full bg-surface-white border border-border-subtle rounded-md p-2 text-text-primary focus:outline-none focus:border-text-primary cursor-pointer"
                >
                  <option value="women">Women</option>
                  <option value="men">Men</option>
                  <option value="unisex">Unisex</option>
                </select>
              </div>

              <div>
                <label className="block text-text-secondary font-medium mb-1">Description:</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Editorial description of the category..."
                  rows={3}
                  className="w-full bg-surface-white border border-border-subtle rounded-md p-2 text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-text-primary"
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
                  {createLoading ? "Creating..." : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
