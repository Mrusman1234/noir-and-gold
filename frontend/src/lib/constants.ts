/**
 * Brand & Store Constants for NOIR & GOLD
 * Documented in docs/project-requirements.md & docs/visual-design-specification.md
 */

export const BRAND_NAME = "NOIR & GOLD";
export const BRAND_TAGLINE = "Bespoke Haute Couture & Luxury Prêt-à-Porter";
export const BRAND_DESCRIPTION =
  "NOIR & GOLD is a luxury boutique fashion and prêt-à-porter house in Pakistan, offering curated ready-to-wear, formal couture, and contemporary fusion apparel.";

export const COPYRIGHT_YEAR = 2026;

export const DEFAULT_CURRENCY = "PKR";
export const DEFAULT_COUNTRY = "Pakistan";

// Shipping policy constants
export const FREE_SHIPPING_THRESHOLD_PKR = 7500;
export const ESTIMATED_FLAT_SHIPPING_PKR = 250;
export const SHIPPING_RATES = {
  LOCAL_KARACHI: 200,
  MAJOR_METROS: 300,
  NATIONWIDE: 400,
} as const;

export const OFFICIAL_PHONE = "+92 300 1234567";
export const OFFICIAL_EMAIL = "concierge@noirandgold.com";
export const OFFICIAL_WHATSAPP_LINK = "https://wa.me/923001234567";

/**
 * Verified Domestic Payment Accounts for NOIR & GOLD Atelier
 */
export const PAYMENT_ACCOUNTS = {
  CASH_ON_DELIVERY: {
    id: "CASH_ON_DELIVERY" as const,
    name: "Cash on Delivery (COD)",
    shortName: "COD",
    badge: "Nationwide Doorstep Delivery",
    tagline: "Pay safely in cash when your courier delivers your package.",
    requiresReference: false,
    details: [
      "No advance payment required.",
      "Exact cash amount is appreciated upon parcel handover.",
      "7-day doorstep inspection & exchange policy applies.",
    ],
  },
  JAZZCASH: {
    id: "JAZZCASH" as const,
    name: "JazzCash Mobile Account / Till",
    shortName: "JazzCash",
    badge: "Instant Mobile Transfer",
    accountTitle: "NOIR & GOLD ATELIER",
    accountNumber: "0300 1234567",
    tillNumber: "0300 1234567",
    tagline: "Send funds via JazzCash App or USSD (*786#) to our official merchant till.",
    requiresReference: true,
    referenceLabel: "JazzCash Transaction ID (TID)",
    referencePlaceholder: "e.g. 1029384756 (10-12 digits)",
    details: [
      "Open JazzCash App → Send Money / Till Payment.",
      "Enter Account/Till: 0300 1234567 (Title: NOIR & GOLD ATELIER).",
      "Enter exact order total and complete transfer.",
      "Input your TID/Transaction Reference below for immediate verification.",
    ],
  },
  EASYPAISA: {
    id: "EASYPAISA" as const,
    name: "EasyPaisa Mobile Account / Till",
    shortName: "EasyPaisa",
    badge: "Instant Mobile Transfer",
    accountTitle: "NOIR & GOLD ATELIER",
    accountNumber: "0345 1234567",
    tillNumber: "0345 1234567",
    tagline: "Send funds via EasyPaisa App or USSD (*786#) to our official merchant account.",
    requiresReference: true,
    referenceLabel: "EasyPaisa TRX ID",
    referencePlaceholder: "e.g. 11029384756 (11 digits)",
    details: [
      "Open EasyPaisa App → Money Transfer / EasyPaisa Account.",
      "Enter Account: 0345 1234567 (Title: NOIR & GOLD ATELIER).",
      "Enter exact order total and authorize with PIN.",
      "Paste the 11-digit TRX ID below so our finance desk can tag your parcel.",
    ],
  },
  BANK_TRANSFER: {
    id: "BANK_TRANSFER" as const,
    name: "Direct Bank Transfer (IBFT / Raast)",
    shortName: "Bank Transfer",
    badge: "All Pakistani Commercial Banks",
    bankName: "Meezan Bank Ltd",
    accountTitle: "NOIR & GOLD ATELIER",
    accountNumber: "0102 0103456789",
    iban: "PK36MEZN0001020103456789",
    branch: "Clifton Branch, Karachi (0102)",
    tagline: "Transfer via Raast, Mobile Banking App, or ATM from any bank in Pakistan.",
    requiresReference: true,
    referenceLabel: "Bank Transfer Reference / Sender Account",
    referencePlaceholder: "e.g. FT261016123456 or Sender Account Name",
    details: [
      "Bank: Meezan Bank Ltd (Islamic Banking)",
      "Account Title: NOIR & GOLD ATELIER",
      "IBAN: PK36MEZN0001020103456789 (24 characters)",
      "Account Number: 0102 0103456789",
      "Enter the Bank Reference Number or Sender Account Name below for rapid order clearance.",
    ],
  },
} as const;

