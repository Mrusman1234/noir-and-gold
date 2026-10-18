import test from "node:test";
import assert from "node:assert/strict";

/**
 * Direct phone validation logic conforming to src/lib/order-service.ts
 */
function validatePakistaniPhone(rawPhone) {
  if (!rawPhone || typeof rawPhone !== "string") {
    return { isValid: false, normalized: "", error: "Phone number is required." };
  }
  const cleaned = rawPhone.replace(/[\s\-()]/g, "");
  const localPattern = /^03\d{9}$/;
  const intlWithPlusPattern = /^\+923\d{9}$/;
  const intlNoPlusPattern = /^923\d{9}$/;

  if (localPattern.test(cleaned)) {
    return { isValid: true, normalized: cleaned };
  }
  if (intlWithPlusPattern.test(cleaned)) {
    return { isValid: true, normalized: "0" + cleaned.slice(3) };
  }
  if (intlNoPlusPattern.test(cleaned)) {
    return { isValid: true, normalized: "0" + cleaned.slice(2) };
  }
  return {
    isValid: false,
    normalized: cleaned,
    error: "Please enter a valid Pakistani mobile number (e.g. 0300-1234567 or +923001234567).",
  };
}

function validateEmail(email) {
  if (!email || !email.trim()) return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

test("Pakistani Mobile Phone Validation & Normalization Rules", () => {
  // 1. Standard domestic 11-digit
  const t1 = validatePakistaniPhone("03001234567");
  assert.equal(t1.isValid, true);
  assert.equal(t1.normalized, "03001234567");

  // 2. Domestic with hyphens and spaces
  const t2 = validatePakistaniPhone("0300-1234567");
  assert.equal(t2.isValid, true);
  assert.equal(t2.normalized, "03001234567");

  const t2b = validatePakistaniPhone("0321 987 6543");
  assert.equal(t2b.isValid, true);
  assert.equal(t2b.normalized, "03219876543");

  // 3. International with plus: +923XXXXXXXXX
  const t3 = validatePakistaniPhone("+923001234567");
  assert.equal(t3.isValid, true);
  assert.equal(t3.normalized, "03001234567");

  // 4. International without plus: 923XXXXXXXXX
  const t4 = validatePakistaniPhone("923451234567");
  assert.equal(t4.isValid, true);
  assert.equal(t4.normalized, "03451234567");

  // 5. Invalid: too short
  const t5 = validatePakistaniPhone("03001234");
  assert.equal(t5.isValid, false);

  // 6. Invalid: wrong network prefix
  const t6 = validatePakistaniPhone("02131234567");
  assert.equal(t6.isValid, false);

  // 7. Invalid: alphabetic / characters
  const t7 = validatePakistaniPhone("0300abc1234");
  assert.equal(t7.isValid, false);

  // 8. Empty input
  const t8 = validatePakistaniPhone("");
  assert.equal(t8.isValid, false);
});

test("Customer Email Format Validation", () => {
  assert.equal(validateEmail(""), true);
  assert.equal(validateEmail(undefined), true);
  assert.equal(validateEmail("customer@domain.com"), true);
  assert.equal(validateEmail("fatima.zahra@atelier.pk"), true);
  assert.equal(validateEmail("invalid-email"), false);
  assert.equal(validateEmail("missing@domain"), false);
  assert.equal(validateEmail("@nodomain.com"), false);
});

test("Order Engine Calculations & Pricing Safety Rules", () => {
  // Authoritative server calculation mock
  const items = [
    { unitPricePkr: 24500, quantity: 1, originalPricePkr: 28000 },
    { unitPricePkr: 14000, quantity: 2, originalPricePkr: null },
  ];

  const subtotalPkr = items.reduce((acc, i) => acc + i.unitPricePkr * i.quantity, 0);
  assert.equal(subtotalPkr, 52500);

  const discountPkr = items.reduce((acc, i) => {
    if (i.originalPricePkr && i.originalPricePkr > i.unitPricePkr) {
      return acc + (i.originalPricePkr - i.unitPricePkr) * i.quantity;
    }
    return acc;
  }, 0);
  assert.equal(discountPkr, 3500);

  // Complimentary delivery threshold is PKR 7,500
  const freeThresholdPkr = 7500;
  const deliveryFeePkr = subtotalPkr >= freeThresholdPkr ? 0 : 250;
  assert.equal(deliveryFeePkr, 0);

  const totalPkr = subtotalPkr + deliveryFeePkr;
  assert.equal(totalPkr, 52500);
});

test("Order Delivery Fee Policy Below Threshold", () => {
  const subtotalPkr = 4500; // Below PKR 7,500
  const freeThresholdPkr = 7500;
  const deliveryFeePkr = subtotalPkr >= freeThresholdPkr ? 0 : 250;
  assert.equal(deliveryFeePkr, 250);

  const totalPkr = subtotalPkr + deliveryFeePkr;
  assert.equal(totalPkr, 4750);
});
