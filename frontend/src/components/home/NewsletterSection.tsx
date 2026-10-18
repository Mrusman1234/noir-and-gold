"use client";

import React, { useState } from "react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  return (
    <section aria-label="Private Client Gazette" className="bg-canvas-bg py-18 sm:py-24 border-b border-border-subtle">
      <Container size="md">
        <div className="mx-auto max-w-xl text-center">
          <p className="mb-2.5 text-[10.5px] uppercase font-bold tracking-[0.24em] text-text-secondary">
            Private Client Circle
          </p>
          <h2 className="font-serif text-3xl font-medium tracking-tight text-text-primary sm:text-5xl">
            The Atelier Gazette
          </h2>
          <p className="mt-4 text-xs leading-6 text-text-secondary sm:text-sm">
            Receive seasonal private previews, trunk showing dates in Karachi and Lahore,
            and priority access to limited prêt releases.
          </p>

          {submitted ? (
            <div className="mt-8 rounded-full bg-status-success/10 border border-status-success/30 px-6 py-3 text-xs text-status-success font-medium inline-block">
              Thank you. You have been added to our private client circle.
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mx-auto mt-8 flex max-w-md flex-col gap-2.5 sm:flex-row"
            >
              <label htmlFor="newsletter-email" className="sr-only">
                Email Address
              </label>
              <input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="luxury-input flex-1 rounded-full text-xs px-5 border-border-subtle"
              />
              <Button type="submit" variant="primary" size="md" className="shrink-0">
                Subscribe
              </Button>
            </form>
          )}
        </div>
      </Container>
    </section>
  );
}
