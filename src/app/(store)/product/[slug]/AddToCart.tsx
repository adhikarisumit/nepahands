"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { useCart } from "@/store/cart";
import type { CartItem } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export default function AddToCart({ product }: { product: Omit<CartItem, "quantity"> }) {
  const [qty, setQty] = useState(1);
  const add = useCart((s) => s.add);
  const soldOut = product.stock <= 0;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [showSticky, setShowSticky] = useState(false);

  // On phones, show a compact "Add to cart" bar once the main button scrolls out of view.
  useEffect(() => {
    const el = buttonRef.current;
    if (!el || soldOut) return;
    const io = new IntersectionObserver(([entry]) => setShowSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, [soldOut]);

  const addToCart = () => {
    add(product, qty);
    toast.success(
      <span>
        Added to your bag.{" "}
        <Link href="/cart" className="font-medium underline underline-offset-2">
          View bag
        </Link>
      </span>
    );
  };

  return (
    <>
      <div className="flex gap-3">
        <div className="inline-flex h-12 items-center rounded-md border border-ink/15 bg-white">
          <button
            className="flex h-full w-11 items-center justify-center text-ink/60 hover:text-ink disabled:opacity-30"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1 || soldOut}
            aria-label="Decrease quantity"
          >
            <Minus size={15} />
          </button>
          <span className="w-8 text-center font-medium tabular-nums" aria-live="polite">{qty}</span>
          <button
            className="flex h-full w-11 items-center justify-center text-ink/60 hover:text-ink disabled:opacity-30"
            onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
            disabled={qty >= product.stock || soldOut}
            aria-label="Increase quantity"
          >
            <Plus size={15} />
          </button>
        </div>
        <button ref={buttonRef} className="btn-primary h-12 flex-1 text-[15px]" disabled={soldOut} onClick={addToCart}>
          {soldOut ? "Sold out" : `Add to cart · ${formatPrice(product.price * qty)}`}
        </button>
      </div>

      {/* Mobile sticky bar */}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-white/95 px-4 py-3 backdrop-blur transition-transform duration-300 lg:hidden ${
          showSticky ? "translate-y-0" : "translate-y-full"
        }`}
        aria-hidden={!showSticky}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{product.name}</p>
            <p className="text-sm tabular-nums text-ink/60">{formatPrice(product.price)}</p>
          </div>
          <button className="btn-primary shrink-0 px-6" onClick={addToCart} tabIndex={showSticky ? 0 : -1}>
            Add to cart
          </button>
        </div>
      </div>
    </>
  );
}
