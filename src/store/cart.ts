"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/lib/types";

type CartState = {
  items: CartItem[];
  coupon: string | null;
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  setCoupon: (code: string | null) => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      coupon: null,
      add: (item, qty = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.id === item.id);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.id === item.id ? { ...i, ...item, quantity: Math.min(i.quantity + qty, item.stock) } : i
              ),
            };
          }
          return { items: [...s.items, { ...item, quantity: Math.min(qty, item.stock) }] };
        }),
      setQty: (id, qty) =>
        set((s) => ({
          items: s.items
            .map((i) => (i.id === id ? { ...i, quantity: Math.max(0, Math.min(qty, i.stock)) } : i))
            .filter((i) => i.quantity > 0),
        })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [], coupon: null }),
      setCoupon: (code) => set({ coupon: code }),
    }),
    { name: "handicraft-cart" }
  )
);

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.quantity, 0);
export const cartSubtotal = (items: CartItem[]) => items.reduce((n, i) => n + i.price * i.quantity, 0);
