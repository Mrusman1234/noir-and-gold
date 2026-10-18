"use client";

import React from "react";
import {
  PakistaniCustomerAddress,
  PAKISTAN_PROVINCES,
} from "@/types";

interface CustomerAddressFormProps {
  values: PakistaniCustomerAddress;
  errors: Record<string, string>;
  onChange: (field: keyof PakistaniCustomerAddress, value: string) => void;
  disabled?: boolean;
}

const POPULAR_PAKISTANI_CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Sialkot",
  "Gujranwala",
  "Hyderabad",
  "Abbottabad",
  "Bahawalpur",
  "Sargodha",
  "Sukkur",
  "Mirpur (AJK)",
];

export function CustomerAddressForm({
  values,
  errors,
  onChange,
  disabled = false,
}: CustomerAddressFormProps) {
  return (
    <div className="space-y-6 font-sans">
      {/* Section 1: Customer Contact Details */}
      <div className="rounded-2xl border border-border-subtle bg-surface-white p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
          <span className="text-text-secondary text-sm font-serif font-medium">01</span>
          <h2 className="font-serif text-lg sm:text-xl font-medium text-text-primary">
            Customer Information
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="space-y-1.5 sm:col-span-2">
            <label
              htmlFor="fullName"
              className="block text-xs uppercase tracking-wider text-text-primary font-medium"
            >
              Full Name <span className="text-text-primary font-bold">*</span>
            </label>
            <input
              id="fullName"
              type="text"
              value={values.fullName}
              disabled={disabled}
              onChange={(e) => onChange("fullName", e.target.value)}
              placeholder="e.g. Tariq Mansoor"
              className={`luxury-input luxury-input-rect ${
                errors.fullName ? "border-rose-500" : ""
              }`}
            />
            {errors.fullName && (
              <p className="text-[11px] text-rose-600 font-sans">{errors.fullName}</p>
            )}
          </div>

          {/* Pakistani Mobile Number */}
          <div className="space-y-1.5">
            <label
              htmlFor="phone"
              className="block text-xs uppercase tracking-wider text-text-primary font-medium"
            >
              Mobile Number <span className="text-text-primary font-bold">*</span>
            </label>
            <div className="relative">
              <input
                id="phone"
                type="tel"
                value={values.phone}
                disabled={disabled}
                onChange={(e) => onChange("phone", e.target.value)}
                placeholder="0300-1234567 or +923001234567"
                className={`luxury-input luxury-input-rect ${
                  errors.phone ? "border-rose-500" : "border-border-subtle"
                }`}
              />
            </div>
            <p className="text-[10px] text-text-secondary">
              Delivery courier will call this number before arrival (Format: 03XX-XXXXXXX).
            </p>
            {errors.phone && (
              <p className="text-[11px] text-rose-600 font-sans">{errors.phone}</p>
            )}
          </div>

          {/* Email Address (Optional) */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-xs uppercase tracking-wider text-text-primary font-medium"
            >
              Email Address <span className="text-text-secondary text-[10px] lowercase">(optional)</span>
            </label>
            <input
              id="email"
              type="email"
              value={values.email || ""}
              disabled={disabled}
              onChange={(e) => onChange("email", e.target.value)}
              placeholder="name@example.com"
              className={`luxury-input luxury-input-rect ${
                errors.email ? "border-rose-500" : "border-border-subtle"
              }`}
            />
            <p className="text-[10px] text-text-secondary">
              Used strictly for digital invoice receipts.
            </p>
            {errors.email && (
              <p className="text-[11px] text-rose-600 font-sans">{errors.email}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Pakistani Delivery Address */}
      <div className="rounded-2xl border border-border-subtle bg-surface-white p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
          <span className="text-text-secondary text-sm font-serif font-medium">02</span>
          <h2 className="font-serif text-lg sm:text-xl font-medium text-text-primary">
            Delivery Destination (Pakistan)
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Province / Territory */}
          <div className="space-y-1.5">
            <label
              htmlFor="province"
              className="block text-xs uppercase tracking-wider text-text-primary font-medium"
            >
              Province / Region <span className="text-text-primary font-bold">*</span>
            </label>
            <select
              id="province"
              value={values.province}
              disabled={disabled}
              onChange={(e) => onChange("province", e.target.value)}
              className={`luxury-input luxury-input-rect cursor-pointer ${errors.province ? "border-rose-500" : "border-border-subtle"}`}
            >
              <option value="" className="bg-surface-white text-text-secondary">
                Select Province or Territory
              </option>
              {PAKISTAN_PROVINCES.map((prov) => (
                <option key={prov} value={prov} className="bg-surface-white text-text-primary">
                  {prov}
                </option>
              ))}
            </select>
            {errors.province && (
              <p className="text-[11px] text-rose-600 font-sans">{errors.province}</p>
            )}
          </div>

          {/* City (Datalist enabled) */}
          <div className="space-y-1.5">
            <label
              htmlFor="city"
              className="block text-xs uppercase tracking-wider text-text-primary font-medium"
            >
              City <span className="text-text-primary font-bold">*</span>
            </label>
            <input
              id="city"
              type="text"
              list="pakistan-cities"
              value={values.city}
              disabled={disabled}
              onChange={(e) => onChange("city", e.target.value)}
              placeholder="e.g. Lahore, Karachi, Islamabad"
              className={`luxury-input luxury-input-rect ${
                errors.city ? "border-rose-500" : "border-border-subtle"
              }`}
            />
            <datalist id="pakistan-cities">
              {POPULAR_PAKISTANI_CITIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            {errors.city && (
              <p className="text-[11px] text-rose-600 font-sans">{errors.city}</p>
            )}
          </div>

          {/* Area / Locality */}
          <div className="space-y-1.5 sm:col-span-2">
            <label
              htmlFor="area"
              className="block text-xs uppercase tracking-wider text-text-primary font-medium"
            >
              Area / Sector / Neighborhood <span className="text-text-primary font-bold">*</span>
            </label>
            <input
              id="area"
              type="text"
              value={values.area}
              disabled={disabled}
              onChange={(e) => onChange("area", e.target.value)}
              placeholder="e.g. DHA Phase 5, Gulberg III, F-8/2, Clifton Block 4"
              className={`luxury-input luxury-input-rect ${
                errors.area ? "border-rose-500" : "border-border-subtle"
              }`}
            />
            {errors.area && (
              <p className="text-[11px] text-rose-600 font-sans">{errors.area}</p>
            )}
          </div>

          {/* Street Address & House Number */}
          <div className="space-y-1.5 sm:col-span-2">
            <label
              htmlFor="streetAddress"
              className="block text-xs uppercase tracking-wider text-text-primary font-medium"
            >
              Complete Street Address <span className="text-text-primary font-bold">*</span>
            </label>
            <textarea
              id="streetAddress"
              rows={2}
              value={values.streetAddress}
              disabled={disabled}
              onChange={(e) => onChange("streetAddress", e.target.value)}
              placeholder="House or Flat Number, Street Name, Building Name"
              className={`w-full p-3 bg-canvas-bg border rounded-lg text-xs sm:text-sm text-text-primary placeholder:text-text-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary transition-colors resize-none ${
                errors.streetAddress ? "border-rose-500" : "border-border-subtle"
              }`}
            />
            {errors.streetAddress && (
              <p className="text-[11px] text-rose-600 font-sans">{errors.streetAddress}</p>
            )}
          </div>

          {/* Nearest Landmark (Optional) */}
          <div className="space-y-1.5">
            <label
              htmlFor="landmark"
              className="block text-xs uppercase tracking-wider text-text-primary font-medium"
            >
              Nearest Landmark <span className="text-text-secondary text-[10px] lowercase">(optional)</span>
            </label>
            <input
              id="landmark"
              type="text"
              value={values.landmark || ""}
              disabled={disabled}
              onChange={(e) => onChange("landmark", e.target.value)}
              placeholder="e.g. Near Total Parco pump / Jamia Masjid"
              className="luxury-input luxury-input-rect"
            />
          </div>

          {/* Postal Code (Optional) */}
          <div className="space-y-1.5">
            <label
              htmlFor="postalCode"
              className="block text-xs uppercase tracking-wider text-text-primary font-medium"
            >
              Postal Code <span className="text-text-secondary text-[10px] lowercase">(optional)</span>
            </label>
            <input
              id="postalCode"
              type="text"
              value={values.postalCode || ""}
              disabled={disabled}
              onChange={(e) => onChange("postalCode", e.target.value)}
              placeholder="e.g. 54000"
              className="luxury-input luxury-input-rect"
            />
          </div>

          {/* Special Delivery Instructions */}
          <div className="space-y-1.5 sm:col-span-2">
            <label
              htmlFor="instructions"
              className="block text-xs uppercase tracking-wider text-text-primary font-medium"
            >
              Delivery Instructions <span className="text-text-secondary text-[10px] lowercase">(optional)</span>
            </label>
            <input
              id="instructions"
              type="text"
              value={values.instructions || ""}
              disabled={disabled}
              onChange={(e) => onChange("instructions", e.target.value)}
              placeholder="e.g. Please call before arrival; deliver at front gate"
              className="luxury-input luxury-input-rect"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
