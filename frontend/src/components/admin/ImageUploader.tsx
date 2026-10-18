"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";

export interface ProductImageItem {
  id?: string;
  url: string;
  altText: string;
  displayOrder: number;
  isPrimary: boolean;
}

export interface ImageUploaderProps {
  images: ProductImageItem[];
  onChange: (images: ProductImageItem[]) => void;
  disabled?: boolean;
}

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function ImageUploader({ images, onChange, disabled = false }: ImageUploaderProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualUrlInput, setManualUrlInput] = useState("");
  const [showManualAdd, setShowManualAdd] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const ensurePrimaryIntegrity = (list: ProductImageItem[]): ProductImageItem[] => {
    if (list.length === 0) return [];
    const hasPrimary = list.some((img) => img.isPrimary);
    return list.map((img, idx) => ({
      ...img,
      displayOrder: idx,
      isPrimary: hasPrimary ? img.isPrimary : idx === 0,
    }));
  };

  const uploadFile = async (file: File): Promise<string> => {
    // Client-side validations
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      throw new Error(`Invalid format for "${file.name}". Only JPEG, PNG, and WebP are supported.`);
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      throw new Error(`"${file.name}" exceeds 5 MB limit (${sizeMb} MB).`);
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/v1/admin/uploads", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data?.error?.message || `Upload failed for "${file.name}".`);
    }

    return data.file?.url || data.url;
  };

  const processFiles = async (fileList: FileList | File[]) => {
    if (disabled || uploading) return;
    setErrorMessage(null);

    const files = Array.from(fileList);
    if (files.length === 0) return;

    setUploading(true);
    let updatedImages = [...images];
    let failureCount = 0;
    let lastError = "";

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgressText(`Uploading asset ${i + 1} of ${files.length}...`);

      try {
        const uploadedUrl = await uploadFile(file);
        const autoAlt = file.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[-_]/g, " ")
          .trim();

        const newItem: ProductImageItem = {
          url: uploadedUrl,
          altText: autoAlt || "Atelier luxury garment view",
          displayOrder: updatedImages.length,
          isPrimary: updatedImages.length === 0,
        };

        updatedImages = ensurePrimaryIntegrity([...updatedImages, newItem]);
        onChange(updatedImages);
      } catch (err) {
        failureCount++;
        lastError = err instanceof Error ? err.message : "Failed to upload file.";
      }
    }

    setUploading(false);
    setUploadProgressText("");
    if (failureCount > 0) {
      setErrorMessage(
        failureCount === 1
          ? lastError
          : `${failureCount} files failed to upload. Last error: ${lastError}`
      );
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDraggingOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    dragCounterRef.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      void processFiles(e.target.files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const setPrimary = (index: number) => {
    if (disabled) return;
    const updated = images.map((item, i) => ({
      ...item,
      isPrimary: i === index,
    }));
    onChange(updated);
  };

  const removeImage = (index: number) => {
    if (disabled) return;
    const filtered = images.filter((_, i) => i !== index);
    onChange(ensurePrimaryIntegrity(filtered));
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    if (disabled) return;
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= images.length) return;

    const reordered = [...images];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);

    onChange(ensurePrimaryIntegrity(reordered));
  };

  const updateAltText = (index: number, altText: string) => {
    if (disabled) return;
    const updated = images.map((item, i) => (i === index ? { ...item, altText } : item));
    onChange(updated);
  };

  const updateUrl = (index: number, url: string) => {
    if (disabled) return;
    const updated = images.map((item, i) => (i === index ? { ...item, url } : item));
    onChange(updated);
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUrlInput.trim()) return;

    const newItem: ProductImageItem = {
      url: manualUrlInput.trim(),
      altText: "Atelier luxury garment view",
      displayOrder: images.length,
      isPrimary: images.length === 0,
    };

    onChange(ensurePrimaryIntegrity([...images, newItem]));
    setManualUrlInput("");
    setShowManualAdd(false);
  };

  return (
    <div className="space-y-4">
      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={disabled || uploading}
        onChange={handleFileInputChange}
      />

      {/* Drag & Drop Dropzone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => {
          if (!disabled && !uploading) {
            fileInputRef.current?.click();
          }
        }}
        className={`relative border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer text-center select-none ${
          isDraggingOver
            ? "border-amber-500 bg-amber-500/10 scale-[1.005]"
            : "border-border-subtle hover:border-amber-400/80 bg-surface-subtle/40 hover:bg-surface-subtle/80"
        } ${disabled || uploading ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          {/* Atelier Cloud / Upload Icon */}
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isDraggingOver ? "bg-amber-100 text-amber-900" : "bg-canvas-bg text-text-secondary"
            }`}
          >
            {uploading ? (
              <svg
                className="animate-spin h-6 w-6 text-amber-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6 stroke-current"
                fill="none"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
                />
              </svg>
            )}
          </div>

          <div>
            <p className="font-serif text-sm font-semibold text-text-primary">
              {uploading
                ? uploadProgressText || "Uploading couture assets..."
                : isDraggingOver
                  ? "Drop assets here to upload"
                  : "Drag and drop high-res garment photography"}
            </p>
            <p className="text-[11px] text-text-secondary mt-0.5">
              or <span className="text-amber-700 underline font-medium">browse local files</span> (JPEG, PNG, WebP up to 5 MB)
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs font-bold text-rose-500 hover:text-rose-800 ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Manual URL Add Toggle */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-secondary font-medium">
          Uploaded Assets ({images.length})
        </span>
        <button
          type="button"
          onClick={() => setShowManualAdd(!showManualAdd)}
          className="text-[11px] text-amber-700 hover:text-amber-900 underline font-mono cursor-pointer"
        >
          {showManualAdd ? "Cancel manual URL" : "+ Add image via direct URL"}
        </button>
      </div>

      {showManualAdd && (
        <form onSubmit={handleManualAdd} className="flex gap-2">
          <input
            type="text"
            value={manualUrlInput}
            onChange={(e) => setManualUrlInput(e.target.value)}
            placeholder="https://... or /images/..."
            className="flex-1 bg-surface-white border border-border-subtle rounded-lg px-3 py-1.5 text-xs font-mono text-text-primary focus:outline-none focus:border-text-primary"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-text-primary hover:bg-neutral-800 text-surface-white rounded-lg text-xs font-medium cursor-pointer"
          >
            Add URL
          </button>
        </form>
      )}

      {/* Uploaded Gallery Tray */}
      {images.length === 0 ? (
        <div className="p-4 bg-surface-subtle/50 border border-border-subtle rounded-xl text-center text-xs text-text-secondary">
          No images uploaded yet. Primary cover asset is required before publishing.
        </div>
      ) : (
        <div className="space-y-2.5">
          {images.map((item, index) => (
            <div
              key={item.id || `${item.url}-${index}`}
              className={`flex flex-col sm:flex-row sm:items-center gap-3 p-2.5 rounded-xl border transition-all ${
                item.isPrimary
                  ? "bg-amber-50/40 border-amber-300/80 shadow-xs"
                  : "bg-surface-white border-border-subtle hover:border-neutral-300"
              }`}
            >
              {/* Thumbnail */}
              <div className="relative w-14 h-16 rounded-lg overflow-hidden border border-border-subtle shrink-0 bg-surface-subtle">
                <Image
                  src={item.url}
                  alt={item.altText || "Garment Asset"}
                  fill
                  className="object-cover"
                  unoptimized={item.url.startsWith("http") || item.url.startsWith("/uploads")}
                />
                {item.isPrimary && (
                  <span className="absolute bottom-0 inset-x-0 bg-amber-500 text-white text-[9px] font-bold text-center uppercase tracking-wider py-0.5">
                    Cover
                  </span>
                )}
              </div>

              {/* URL & Alt Text Controls */}
              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-mono text-text-secondary shrink-0">
                    URL:
                  </span>
                  <input
                    type="text"
                    value={item.url}
                    disabled={disabled}
                    onChange={(e) => updateUrl(index, e.target.value)}
                    className="w-full text-xs font-mono bg-canvas-bg/60 border border-border-subtle rounded px-2 py-0.5 text-text-primary truncate focus:bg-surface-white focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-mono text-text-secondary shrink-0">
                    Alt:
                  </span>
                  <input
                    type="text"
                    value={item.altText}
                    disabled={disabled}
                    placeholder="Descriptive alt text for accessibility and SEO..."
                    onChange={(e) => updateAltText(index, e.target.value)}
                    className="w-full text-xs bg-surface-white border border-border-subtle rounded px-2 py-0.5 text-text-primary placeholder:text-text-secondary/50 focus:outline-none"
                  />
                </div>
              </div>

              {/* Actions & Reordering */}
              <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-1.5 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-border-subtle">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveImage(index, -1)}
                    disabled={index === 0 || disabled}
                    title="Move asset up"
                    className="px-1.5 py-0.5 text-xs text-text-secondary hover:text-text-primary disabled:opacity-30 border border-border-subtle rounded cursor-pointer"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(index, 1)}
                    disabled={index === images.length - 1 || disabled}
                    title="Move asset down"
                    className="px-1.5 py-0.5 text-xs text-text-secondary hover:text-text-primary disabled:opacity-30 border border-border-subtle rounded cursor-pointer"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrimary(index)}
                    disabled={disabled || item.isPrimary}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase transition-colors ${
                      item.isPrimary
                        ? "bg-amber-600 text-white cursor-default"
                        : "bg-surface-subtle text-text-secondary hover:bg-canvas-bg hover:text-text-primary border border-border-subtle cursor-pointer"
                    }`}
                  >
                    {item.isPrimary ? "Primary" : "Set Primary"}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  disabled={disabled}
                  className="text-[11px] text-rose-600 hover:text-rose-800 self-end sm:self-center font-mono cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
