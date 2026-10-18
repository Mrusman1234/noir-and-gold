"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ContactForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    subject: "Order Inquiry",
    orderReference: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate sending message
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 600);
  };

  if (isSubmitted) {
    return (
      <div className="bg-surface-white border border-border-subtle rounded-2xl p-8 shadow-xs text-center space-y-4 animate-fadeIn">
        <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 border border-emerald-300 flex items-center justify-center text-emerald-600">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="font-serif text-xl font-bold text-text-primary">
          Message Received
        </h3>
        <p className="text-xs sm:text-sm text-text-secondary max-w-sm mx-auto leading-relaxed">
          Thank you, <strong>{formData.fullName}</strong>. A dedicated atelier concierge has received your inquiry and will contact you via WhatsApp or email shortly.
        </p>
        <button
          type="button"
          onClick={() => {
            setIsSubmitted(false);
            setFormData({
              fullName: "",
              phone: "",
              email: "",
              subject: "Order Inquiry",
              orderReference: "",
              message: "",
            });
          }}
          className="text-xs font-semibold uppercase tracking-wider text-text-primary underline pt-2 cursor-pointer"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface-white border border-border-subtle rounded-2xl p-6 sm:p-8 shadow-xs space-y-5"
    >
      <div className="space-y-1">
        <h3 className="font-serif text-lg font-bold text-text-primary">
          Send an Atelier Inquiry
        </h3>
        <p className="text-xs text-text-secondary">
          We respond within 2 to 4 business hours.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="contactFullName" className="block text-xs font-semibold uppercase tracking-wider text-text-primary">
            Full Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="contactFullName"
            type="text"
            required
            placeholder="Amina Malik"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className="w-full px-4 py-2.5 text-sm bg-surface-white border border-border-subtle rounded-xl text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:ring-1 focus:ring-text-primary transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="contactPhone" className="block text-xs font-semibold uppercase tracking-wider text-text-primary">
            WhatsApp / Mobile <span className="text-rose-500">*</span>
          </label>
          <input
            id="contactPhone"
            type="tel"
            required
            placeholder="0300 1234567"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-2.5 text-sm bg-surface-white border border-border-subtle rounded-xl text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:ring-1 focus:ring-text-primary transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="contactEmail" className="block text-xs font-semibold uppercase tracking-wider text-text-primary">
            Email Address
          </label>
          <input
            id="contactEmail"
            type="email"
            placeholder="amina@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2.5 text-sm bg-surface-white border border-border-subtle rounded-xl text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:ring-1 focus:ring-text-primary transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="contactSubject" className="block text-xs font-semibold uppercase tracking-wider text-text-primary">
            Inquiry Department
          </label>
          <select
            id="contactSubject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="w-full px-4 py-2.5 text-sm bg-surface-white border border-border-subtle rounded-xl text-text-primary focus:outline-none focus:ring-1 focus:ring-text-primary transition-colors cursor-pointer"
          >
            <option value="Order Inquiry">Existing Order &amp; Delivery</option>
            <option value="Sizing & Alteration">Size &amp; Fit Assistance</option>
            <option value="Salon Appointment">Private Salon Appointment</option>
            <option value="Bespoke Trousseau">Bridal &amp; Bespoke Trousseau</option>
            <option value="General Inquiry">General Atelier Inquiries</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="contactOrderRef" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Order Reference (Optional)
        </label>
        <input
          id="contactOrderRef"
          type="text"
          placeholder="e.g. NG-20261016-XXXX"
          value={formData.orderReference}
          onChange={(e) => setFormData({ ...formData, orderReference: e.target.value.toUpperCase() })}
          className="w-full px-4 py-2.5 text-sm bg-surface-white border border-border-subtle rounded-xl text-text-primary placeholder:text-text-secondary/40 uppercase font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-text-primary transition-colors"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="contactMessage" className="block text-xs font-semibold uppercase tracking-wider text-text-primary">
          Your Message <span className="text-rose-500">*</span>
        </label>
        <textarea
          id="contactMessage"
          required
          rows={4}
          placeholder="Please describe your sizing requirements, preferred salon visit date, or order details..."
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full px-4 py-2.5 text-sm bg-surface-white border border-border-subtle rounded-xl text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:ring-1 focus:ring-text-primary transition-colors resize-none"
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? "Dispatching Message..." : "Submit Inquiry to Concierge"}
      </Button>
    </form>
  );
}
