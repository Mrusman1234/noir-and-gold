"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { CustomerAddressForm } from "@/components/checkout/CustomerAddressForm";
import { CheckoutSummary } from "@/components/checkout/CheckoutSummary";
import { Button } from "@/components/ui/Button";
import { PakistaniCustomerAddress, CreateOrderResponseDTO, PaymentMethod } from "@/types";
import { useCart } from "@/context/CartContext";

const INITIAL_ADDRESS: PakistaniCustomerAddress = {
  fullName: "",
  phone: "",
  email: "",
  province: "",
  city: "",
  area: "",
  streetAddress: "",
  postalCode: "",
  landmark: "",
  instructions: "",
};

const ORDER_ATTEMPT_STORAGE_KEY = "noir_checkout_idempotency_v1";

export function CheckoutPageView() {
  const router = useRouter();
  const {
    items,
    subtotalPkr,
    discountTotalPkr,
    estimatedShippingFeePkr,
    estimatedTotalPkr,
    clearCart,
  } = useCart();

  const [formValues, setFormValues] = useState<PakistaniCustomerAddress>(INITIAL_ADDRESS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH_ON_DELIVERY");
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [paymentReferenceError, setPaymentReferenceError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const idempotencyKeyRef = useRef<string | null>(null);

  const getIdempotencyKey = () => {
    if (idempotencyKeyRef.current) return idempotencyKeyRef.current;

    try {
      const storedKey = window.sessionStorage.getItem(ORDER_ATTEMPT_STORAGE_KEY);
      if (storedKey?.startsWith("idemp_") && storedKey.length <= 128) {
        idempotencyKeyRef.current = storedKey;
        return storedKey;
      }
    } catch {
      // Storage may be unavailable; the component ref still stabilizes in-page retries.
    }

    const key = `idemp_${window.crypto.randomUUID()}`;
    idempotencyKeyRef.current = key;
    try {
      window.sessionStorage.setItem(ORDER_ATTEMPT_STORAGE_KEY, key);
    } catch {
      // Keep the key in the component ref for this page instance.
    }
    return key;
  };

  const clearIdempotencyKey = () => {
    idempotencyKeyRef.current = null;
    try {
      window.sessionStorage.removeItem(ORDER_ATTEMPT_STORAGE_KEY);
    } catch {
      // Storage may be unavailable.
    }
  };

  const handleFieldChange = (
    field: keyof PakistaniCustomerAddress,
    value: string
  ) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    // Clear field-specific error as user types
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  // Client-side pre-validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formValues.fullName.trim() || formValues.fullName.trim().length < 3) {
      newErrors.fullName = "Please enter your full name (minimum 3 characters).";
    }

    const cleanPhone = formValues.phone.replace(/[\s\-()]/g, "");
    const isValidPhone =
      /^03\d{9}$/.test(cleanPhone) ||
      /^\+923\d{9}$/.test(cleanPhone) ||
      /^923\d{9}$/.test(cleanPhone);

    if (!isValidPhone) {
      newErrors.phone =
        "Enter a valid Pakistani mobile number (e.g. 0300-1234567 or +923001234567).";
    }

    if (formValues.email && formValues.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formValues.email.trim())) {
        newErrors.email = "Please enter a valid email address.";
      }
    }

    if (!formValues.province) {
      newErrors.province = "Please select your delivery province or territory.";
    }

    if (!formValues.city.trim() || formValues.city.trim().length < 2) {
      newErrors.city = "Please enter your delivery city.";
    }

    if (!formValues.area.trim() || formValues.area.trim().length < 2) {
      newErrors.area = "Please specify your sector, phase, or neighborhood.";
    }

    if (!formValues.streetAddress.trim() || formValues.streetAddress.trim().length < 5) {
      newErrors.streetAddress =
        "Please provide your complete street address including house or flat number.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit order to authoritative backend
  const handleSubmitOrder = async () => {
    setServerError(null);

    if (items.length === 0) {
      setServerError("Your shopping bag is empty. Please add garments before checking out.");
      return;
    }

    if (!validateForm()) {
      window.scrollTo({ top: 120, behavior: "smooth" });
      return;
    }

    if (paymentMethod !== "CASH_ON_DELIVERY" && (!paymentReference.trim() || paymentReference.trim().length < 4)) {
      setPaymentReferenceError("Please enter your transaction ID, reference number, or sender mobile.");
      window.scrollTo({ top: 400, behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);

    try {
      const idempotencyKey = getIdempotencyKey();

      const response = await fetch("/api/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": idempotencyKey,
        },
        body: JSON.stringify({
          customer: formValues,
          items: items.map((i) => ({
            productId: i.productId,
            size: i.size,
            color: i.color,
            quantity: i.quantity,
          })),
          idempotencyKey,
          paymentMethod,
          paymentReference: paymentReference.trim() || undefined,
        }),
      });

      const data: CreateOrderResponseDTO = await response.json();

      if (!response.ok || !data.success) {
        if (data.error?.fields) {
          setErrors(data.error.fields);
        }
        if (data.error?.code === "IDEMPOTENCY_KEY_REUSED") {
          clearIdempotencyKey();
        }
        setServerError(
          data.error?.message ||
            "Unable to place your order. Please review your details and try again."
        );
        setIsSubmitting(false);
        window.scrollTo({ top: 120, behavior: "smooth" });
        return;
      }

      // Order confirmed! Clear shopping bag and navigate to verified success page
      clearCart();
      clearIdempotencyKey();
      router.push(
        `/order-success/${data.orderReference}?token=${encodeURIComponent(
          data.verificationToken || ""
        )}`
      );
    } catch {
      setServerError(
        "A network communication error occurred. Please check your connection and try again."
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-8 sm:py-12 bg-canvas-bg text-text-primary font-sans">
      <Container size="xl">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb navigation"
          className="flex items-center gap-2 text-xs text-text-secondary uppercase tracking-widest mb-6 sm:mb-8 font-sans"
        >
          <Link href="/" className="hover:text-text-primary transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/cart" className="hover:text-text-primary transition-colors">
            Shopping Bag
          </Link>
          <span>/</span>
          <span className="text-text-primary font-semibold">Checkout</span>
        </nav>

        {/* Page Header */}
        <div className="pb-6 mb-8 border-b border-border-subtle">
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-text-secondary block mb-1">
            Cash on Delivery • Pakistan Domestic Express
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-normal tracking-tight text-text-primary">
            Checkout &amp; Delivery Details
          </h1>
        </div>

        {/* Server / General Error Alert Banner */}
        {serverError && (
          <div
            role="alert"
            className="mb-8 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-sans flex items-start gap-3 rounded-xl shadow-xs animate-fade-in"
          >
            <span className="text-rose-600 font-bold text-base leading-none">⚠</span>
            <div className="flex-1">
              <p className="font-semibold text-rose-900">Order Submission Notice</p>
              <p className="mt-0.5 leading-relaxed">{serverError}</p>
            </div>
          </div>
        )}

        {/* Content Area */}
        {items.length === 0 ? (
          /* Empty Bag Guard View */
          <div className="max-w-xl mx-auto py-16 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-surface-white border border-border-subtle flex items-center justify-center text-text-primary shadow-xs">
              <svg className="w-8 h-8 stroke-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25c-.669 0-1.188-.578-1.119-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>

            <div className="space-y-2">
              <h2 className="font-serif text-2xl font-medium text-text-primary">
                Your Shopping Bag is Empty
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary font-sans leading-relaxed">
                You cannot complete checkout without selecting at least one atelier piece. Please browse our collections to proceed.
              </p>
            </div>

            <div className="pt-2">
              <Button href="/shop" variant="primary" size="lg" showArrow>
                Discover the Collection
              </Button>
            </div>
          </div>
        ) : (
          /* Active Checkout Grid Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-14 items-start">
            {/* Left Column: Customer and Shipping Form (lg:col-span-7) */}
            <div className="lg:col-span-7 space-y-6">
              <CustomerAddressForm
                values={formValues}
                errors={errors}
                onChange={handleFieldChange}
                disabled={isSubmitting}
              />
            </div>

            {/* Right Column: Order Summary & COD Confirmation (lg:col-span-5) */}
            <div className="lg:col-span-5">
              <CheckoutSummary
                items={items}
                subtotalPkr={subtotalPkr}
                discountTotalPkr={discountTotalPkr}
                deliveryFeePkr={estimatedShippingFeePkr}
                totalPkr={estimatedTotalPkr}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmitOrder}
                paymentMethod={paymentMethod}
                onPaymentMethodChange={(m) => {
                  setPaymentMethod(m);
                  setPaymentReferenceError(undefined);
                }}
                paymentReference={paymentReference}
                onPaymentReferenceChange={(ref) => {
                  setPaymentReference(ref);
                  setPaymentReferenceError(undefined);
                }}
                paymentReferenceError={paymentReferenceError}
              />
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
