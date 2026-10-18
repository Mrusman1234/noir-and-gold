"use client";

import React, { useState } from "react";

interface ProductAccordionProps {
  fabric?: string;
  details?: string[];
  careInstructions?: string[];
}

interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

export function ProductAccordion({
  fabric,
  details = [],
  careInstructions = [],
}: ProductAccordionProps) {
  // Default first section open
  const [openIds, setOpenIds] = useState<string[]>(["craftsmanship"]);

  const toggleSection = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const items: AccordionItem[] = [
    {
      id: "craftsmanship",
      title: "Fabric & Atelier Craftsmanship",
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-text-secondary leading-relaxed font-sans">
          {fabric && (
            <p>
              <strong className="text-text-primary font-semibold">Composition:</strong> {fabric}
            </p>
          )}
          {details.length > 0 && (
            <ul className="list-disc list-inside space-y-1.5 text-text-secondary">
              {details.map((detail, idx) => (
                <li key={idx} className="text-text-secondary">
                  {detail}
                </li>
              ))}
            </ul>
          )}
        </div>
      ),
    },
    {
      id: "care",
      title: "Wash & Care Instructions",
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-text-secondary leading-relaxed font-sans">
          {careInstructions.length > 0 ? (
            <ul className="list-disc list-inside space-y-1.5 text-text-secondary">
              {careInstructions.map((instr, idx) => (
                <li key={idx} className="text-text-secondary">
                  {instr}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-text-secondary">
              Strictly Dry Clean Only. Store hanging in protective muslin garment dust-bag.
            </p>
          )}
        </div>
      ),
    },
    {
      id: "shipping",
      title: "Pakistan Delivery & Cash on Delivery (COD)",
      content: (
        <div className="space-y-2.5 text-xs sm:text-sm text-text-secondary leading-relaxed font-sans">
          <p className="text-text-primary font-medium">
            Cash on Delivery (COD) is available on all domestic Pakistani orders.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
            <div className="p-3 bg-surface-subtle border border-border-subtle rounded-lg">
              <span className="text-text-primary font-semibold block mb-0.5">Karachi Metro</span>
              <span className="text-text-secondary">1–2 Business Days</span>
            </div>
            <div className="p-3 bg-surface-subtle border border-border-subtle rounded-lg">
              <span className="text-text-primary font-semibold block mb-0.5">Lahore &amp; Islamabad</span>
              <span className="text-text-secondary">2–3 Business Days</span>
            </div>
            <div className="p-3 bg-surface-subtle border border-border-subtle rounded-lg sm:col-span-2">
              <span className="text-text-primary font-semibold block mb-0.5">Nationwide Cities</span>
              <span className="text-text-secondary">3–5 Business Days via Tracked Express Courier</span>
            </div>
          </div>
          <p className="text-xs text-text-primary font-medium pt-1">
            * Enjoy complimentary delivery nationwide on all orders exceeding PKR 7,500.
          </p>
        </div>
      ),
    },
    {
      id: "returns",
      title: "7-Day Doorstep Exchange Policy",
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-text-secondary leading-relaxed font-sans">
          <p>
            We offer a seamless <strong className="text-text-primary font-semibold">7-day inspection and size exchange window</strong> from the date of parcel delivery across Pakistan.
          </p>
          <p className="text-text-secondary text-xs">
            If your garment requires sizing adjustments, our customer concierge coordinates a reverse courier pickup directly from your doorstep. Garments must remain unworn with security atelier tags intact.
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="border-t border-border-subtle divide-y divide-border-subtle">
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);
        return (
          <div key={item.id} className="py-4">
            <button
              type="button"
              onClick={() => toggleSection(item.id)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between text-left text-sm font-serif font-medium text-text-primary hover:text-text-secondary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary py-1 cursor-pointer"
            >
              <span>{item.title}</span>
              <span className="text-text-primary text-base font-sans ml-4 transition-transform duration-200">
                {isOpen ? "−" : "+"}
              </span>
            </button>
            {isOpen && (
              <div className="pt-3 pb-1 animate-fade-in">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
