"use client";

import React, {
  createContext,
  useContext,
  useSyncExternalStore,
  useCallback,
  useMemo,
  useState,
} from "react";
import { CartItem } from "@/types";
import {
  ESTIMATED_FLAT_SHIPPING_PKR,
  FREE_SHIPPING_THRESHOLD_PKR,
} from "@/lib/constants";

export { ESTIMATED_FLAT_SHIPPING_PKR, FREE_SHIPPING_THRESHOLD_PKR } from "@/lib/constants";

export interface AddCartItemInput {
  productId: string;
  slug: string;
  title: string;
  categoryName: string;
  pricePkr: number;
  originalPricePkr?: number | null;
  imageUrl: string;
  size: string;
  color: string;
  quantity: number;
  maxStock: number;
}

export interface CartContextType {
  items: CartItem[];
  addItem: (input: AddCartItemInput) => { success: boolean; message: string };
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalCount: number;
  subtotalPkr: number;
  discountTotalPkr: number;
  estimatedShippingFeePkr: number;
  estimatedTotalPkr: number;
  freeShippingThresholdPkr: number;
  isFreeShippingEligible: boolean;
  amountNeededForFreeShipping: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CART_STORAGE_KEY = "noir_gold_cart_v1";

/**
 * Standard delivery configuration placeholders for Pakistani domestic fulfillment.
 * Revalidated server-side before order creation during checkout.
 */
/**
 * Event-driven external store for reliable cross-tab persistence and zero hydration mismatch.
 */
const cartStore = {
  getSnapshot(): string {
    if (typeof window === "undefined") return "[]";
    try {
      return localStorage.getItem(CART_STORAGE_KEY) || "[]";
    } catch {
      return "[]";
    }
  },
  getServerSnapshot(): string {
    return "[]";
  },
  subscribe(callback: () => void): () => void {
    if (typeof window === "undefined") return () => {};
    window.addEventListener("storage", callback);
    window.addEventListener("noir_cart_update", callback);
    return () => {
      window.removeEventListener("storage", callback);
      window.removeEventListener("noir_cart_update", callback);
    };
  },
  set(items: CartItem[]) {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore quota restrictions
    }
    window.dispatchEvent(new Event("noir_cart_update"));
  },
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Subscribe to persistent storage using React's safe external store hook
  const rawItems = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    cartStore.getServerSnapshot
  );

  const items = useMemo<CartItem[]>(() => {
    try {
      const parsed = JSON.parse(rawItems);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [rawItems]);

  const addItem = useCallback(
    (input: AddCartItemInput) => {
      const compositeId = `${input.productId}-${input.size}-${input.color}`;
      const result = {
        success: true,
        message: `Added ${input.title} (${input.size} • ${input.color}) to your shopping bag.`,
      };

      const existingIndex = items.findIndex((item) => item.id === compositeId);

      if (existingIndex > -1) {
        const existing = items[existingIndex];
        const newQuantity = Math.min(
          existing.quantity + input.quantity,
          input.maxStock
        );

        if (existing.quantity >= input.maxStock) {
          return {
            success: false,
            message: `Maximum available inventory reached for this variant (${input.maxStock} pieces).`,
          };
        }

        const updated = [...items];
        updated[existingIndex] = {
          ...existing,
          quantity: newQuantity,
          maxStock: input.maxStock,
        };
        cartStore.set(updated);
        return result;
      }

      // Add as a new distinct line item
      const newItem: CartItem = {
        id: compositeId,
        productId: input.productId,
        slug: input.slug,
        title: input.title,
        categoryName: input.categoryName,
        pricePkr: Math.round(input.pricePkr),
        originalPricePkr: input.originalPricePkr
          ? Math.round(input.originalPricePkr)
          : null,
        imageUrl: input.imageUrl,
        size: input.size,
        color: input.color,
        quantity: Math.min(Math.max(1, input.quantity), input.maxStock),
        maxStock: input.maxStock,
      };

      cartStore.set([...items, newItem]);
      return result;
    },
    [items]
  );

  const removeItem = useCallback(
    (id: string) => {
      cartStore.set(items.filter((item) => item.id !== id));
    },
    [items]
  );

  const updateQuantity = useCallback(
    (id: string, quantity: number) => {
      if (quantity <= 0) {
        cartStore.set(items.filter((item) => item.id !== id));
        return;
      }

      const updated = items.map((item) => {
        if (item.id === id) {
          const clamped = Math.min(Math.max(1, Math.round(quantity)), item.maxStock);
          return { ...item, quantity: clamped };
        }
        return item;
      });

      cartStore.set(updated);
    },
    [items]
  );

  const clearCart = useCallback(() => {
    cartStore.set([]);
  }, []);

  // Real-time calculated amounts
  const totalCount = useMemo(() => {
    return items.reduce((acc, item) => acc + item.quantity, 0);
  }, [items]);

  const subtotalPkr = useMemo(() => {
    return items.reduce((acc, item) => acc + item.pricePkr * item.quantity, 0);
  }, [items]);

  const discountTotalPkr = useMemo(() => {
    return items.reduce((acc, item) => {
      if (item.originalPricePkr && item.originalPricePkr > item.pricePkr) {
        return acc + (item.originalPricePkr - item.pricePkr) * item.quantity;
      }
      return acc;
    }, 0);
  }, [items]);

  const isFreeShippingEligible = subtotalPkr >= FREE_SHIPPING_THRESHOLD_PKR;

  const estimatedShippingFeePkr = useMemo(() => {
    if (items.length === 0) return 0;
    return isFreeShippingEligible ? 0 : ESTIMATED_FLAT_SHIPPING_PKR;
  }, [items.length, isFreeShippingEligible]);

  const estimatedTotalPkr = useMemo(() => {
    return subtotalPkr + estimatedShippingFeePkr;
  }, [subtotalPkr, estimatedShippingFeePkr]);

  const amountNeededForFreeShipping = useMemo(() => {
    return Math.max(0, FREE_SHIPPING_THRESHOLD_PKR - subtotalPkr);
  }, [subtotalPkr]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalCount,
        subtotalPkr,
        discountTotalPkr,
        estimatedShippingFeePkr,
        estimatedTotalPkr,
        freeShippingThresholdPkr: FREE_SHIPPING_THRESHOLD_PKR,
        isFreeShippingEligible,
        amountNeededForFreeShipping,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
