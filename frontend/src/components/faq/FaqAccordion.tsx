"use client";

import React, { useState } from "react";
import { formatPKR } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD_PKR } from "@/lib/constants";

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: "cod-1",
    category: "Payment & COD",
    question: "How does Cash on Delivery (COD) work across Pakistan?",
    answer:
      "When placing an order, select Cash on Delivery at checkout. No advance deposit or card is required for ready-to-wear orders. When our courier partner arrives at your address, simply hand over the exact cash amount in PKR and receive your sealed atelier package.",
  },
  {
    id: "cod-2",
    category: "Payment & COD",
    question: "Is there any advance deposit required for high-value orders?",
    answer:
      "For standard ready-to-wear orders, no advance payment is required. For custom bridal trousseau or bespoke couture pieces requiring specialized hand-embroidery, our concierge will coordinate a 20% commitment advance via direct bank transfer.",
  },
  {
    id: "shipping-1",
    category: "Shipping & Delivery",
    question: "What are your delivery timelines across Pakistan?",
    answer:
      "Karachi orders are delivered within 24 to 48 hours. Major metropolitan cities (Lahore, Islamabad, Rawalpindi, Faisalabad, Multan) arrive in 2 to 3 business days. All other nationwide districts arrive within 3 to 5 business days via express insured couriers (TCS / Leopards / Call Courier).",
  },
  {
    id: "shipping-2",
    category: "Shipping & Delivery",
    question: "What are the shipping charges and complimentary threshold?",
    answer: `All orders of ${formatPKR(
      FREE_SHIPPING_THRESHOLD_PKR
    )} or more qualify for Complimentary Express Nationwide Shipping. For orders below this threshold, a flat delivery fee of PKR 250 is applied nationwide.`,
  },
  {
    id: "shipping-3",
    category: "Shipping & Delivery",
    question: "Can I inspect the parcel before paying the courier?",
    answer:
      "Standard domestic courier security regulations require the cash to be received before breaking the security tape of the outer transit flyer. However, NOIR & GOLD provides a full 7-Day Doorstep Size Exchange Guarantee: if the garment requires a different size or fit, our courier will swap it directly at your doorstep.",
  },
  {
    id: "sizing-1",
    category: "Sizing & Fit",
    question: "How do I choose the right size for Pakistani silhouettes?",
    answer:
      "Each product page includes our interactive Size Guide with detailed measurements in inches and centimeters for Bust, Waist, Hips, and Garment Length. If you fall between sizes, we recommend sizing up for traditional relaxed silhouettes or consulting our WhatsApp concierge for tailored recommendations.",
  },
  {
    id: "sizing-2",
    category: "Sizing & Fit",
    question: "Do you offer custom alterations or sleeve adjustments?",
    answer:
      "Yes. For select pret and couture pieces, minor length and sleeve alterations can be accommodated prior to dispatch. Contact our WhatsApp concierge within 2 hours of placing your order with your order reference.",
  },
  {
    id: "exchange-1",
    category: "Exchanges & Returns",
    question: "What is your 7-Day Doorstep Exchange Policy?",
    answer:
      "If your garment does not fit as desired, you can request an exchange within 7 days of delivery. Our courier will bring the replacement size directly to your doorstep and collect the original unworn piece with tags intact.",
  },
  {
    id: "exchange-2",
    category: "Exchanges & Returns",
    question: "What conditions must garments meet for an exchange?",
    answer:
      "Garments must be in original, unwashed, and unworn condition with all atelier tags, hangtags, and packaging seals attached. Bespoke bridal orders and customized alterations are final sale.",
  },
  {
    id: "care-1",
    category: "Garment Care",
    question: "How should I care for raw silk, chanderi, and velvet ensembles?",
    answer:
      "All silk, velvet, and embellished garments must be exclusively dry cleaned by a reputable professional cleaner. Avoid spraying perfume or alcohol-based fragrances directly onto metallic zardozi or tilla embroidery.",
  },
];

export function FaqAccordion() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [openId, setOpenId] = useState<string | null>("cod-1");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const categories = ["All", "Payment & COD", "Shipping & Delivery", "Sizing & Fit", "Exchanges & Returns", "Garment Care"];

  const filteredFaqs = FAQS.filter((faq) => {
    const matchesCategory =
      activeCategory === "All" || faq.category === activeCategory;
    const matchesQuery =
      searchQuery === "" ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="space-y-8 font-sans">
      {/* Search Input & Category Pills */}
      <div className="space-y-4">
        <div className="relative max-w-md mx-auto">
          <input
            type="text"
            placeholder="Search questions (e.g. COD, exchange, delivery)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-5 py-3 pl-11 text-sm bg-surface-white border border-border-subtle rounded-full text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-1 focus:ring-text-primary transition-colors shadow-xs"
          />
          <svg
            className="w-4 h-4 text-text-secondary absolute left-4 top-1/2 -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                activeCategory === cat
                  ? "bg-text-primary text-surface-white font-semibold"
                  : "bg-surface-white border border-border-subtle text-text-secondary hover:text-text-primary hover:border-text-primary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-3 max-w-3xl mx-auto">
        {filteredFaqs.length === 0 ? (
          <div className="bg-surface-white border border-border-subtle rounded-2xl p-8 text-center text-xs text-text-secondary space-y-2">
            <p>No questions matching &ldquo;{searchQuery}&rdquo;.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("All");
              }}
              className="text-text-primary font-semibold underline"
            >
              Clear filter
            </button>
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className="bg-surface-white border border-border-subtle rounded-2xl shadow-xs overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                  aria-expanded={isOpen}
                  className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary"
                >
                  <span className="font-serif text-sm sm:text-base font-bold text-text-primary">
                    {faq.question}
                  </span>
                  <span
                    className={`flex-shrink-0 w-6 h-6 rounded-full bg-surface-subtle flex items-center justify-center text-xs text-text-primary transition-transform duration-200 ${
                      isOpen ? "rotate-45" : ""
                    }`}
                  >
                    +
                  </span>
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-text-secondary leading-relaxed border-t border-border-subtle/50 animate-fadeIn">
                    <p>{faq.answer}</p>
                    <span className="inline-block mt-3 px-2 py-0.5 rounded-full text-[10px] bg-surface-subtle text-text-secondary uppercase tracking-wider font-semibold">
                      {faq.category}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
