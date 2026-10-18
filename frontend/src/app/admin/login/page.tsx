"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BRAND_NAME } from "@/lib/constants";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/v1/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(
          data?.error?.message || "Invalid credentials. Please verify your email and password."
        );
        setLoading(false);
        return;
      }

      // Successful login -> navigate to Dashboard
      router.push("/admin");
    } catch {
      setErrorMessage("Network error connecting to authentication server. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas-bg flex flex-col justify-center items-center px-4 py-12 relative text-text-primary">
      {/* Subtle ambient accent */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-gold/10 blur-[120px]" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Masthead */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block group">
            <span className="font-serif text-2xl sm:text-3xl font-bold tracking-[0.2em] text-text-primary uppercase transition-colors">
              {BRAND_NAME}
            </span>
            <span className="text-[10px] tracking-[0.25em] text-accent-gold font-sans font-semibold uppercase block mt-1">
              Atelier Management Portal
            </span>
          </Link>
          <p className="mt-3 text-xs text-text-secondary leading-relaxed max-w-xs mx-auto">
            Authorized portal for catalog curation, nationwide dispatch, and Cash on Delivery order processing.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-surface-white border border-border-subtle rounded-2xl p-6 sm:p-8 shadow-xs">
          <h1 className="font-serif text-lg text-text-primary font-bold tracking-wide mb-1">
            Sign In to Portal
          </h1>
          <p className="text-xs text-text-secondary mb-6">
            Enter your atelier administrative credentials to continue.
          </p>

          {errorMessage && (
            <div
              role="alert"
              className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5"
            >
              <svg className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5"
              >
                Email Address
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-surface-white border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:ring-1 focus:ring-text-primary transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5"
              >
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full bg-surface-white border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:ring-1 focus:ring-text-primary transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-text-primary px-4 py-3 text-xs font-semibold uppercase tracking-wider text-surface-white hover:bg-black transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-surface-white/30 border-t-surface-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Access Management Portal</span>
              )}
            </button>
          </form>
        </div>

        {/* Back to Public Atelier */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-xs text-text-secondary hover:text-text-primary transition-colors inline-flex items-center gap-1.5"
          >
            <span>← Return to Public Atelier Storefront</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
