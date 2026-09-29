"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Lock, Minus, Plus, ShoppingBag, Truck } from "lucide-react";
import { useCart, cartCount } from "@/store/cart";
import { formatPrice, PLACEHOLDER_IMG } from "@/lib/utils";
import { LEGAL } from "@/lib/legal";
import OrderSummary from "@/components/OrderSummary";
import { useQuote } from "@/components/useQuote";

export default function CartPage() {
  const { items, setQty, coupon } = useCart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { quote, loading } = useQuote(mounted ? items : [], coupon);

  if (!mounted) return <div className="container-x min-h-[50vh] py-16" />;

  if (items.length === 0) {
    return (
      <div className="container-x flex min-h-[55vh] flex-col items-center justify-center py-16 text-center">
        <ShoppingBag size={40} strokeWidth={1.25} className="text-ink/30" />
        <h1 className="mt-5 text-2xl font-semibold">Your bag is empty</h1>
        <p className="mt-2 max-w-sm text-ink/60">Browse the collection and add a piece you love — each one is made by hand in small batches.</p>
        <Link href="/shop" className="btn-primary mt-8 px-8">Shop the collection</Link>
      </div>
    );
  }

  const count = cartCount(items);

  return (
    <div className="container-x py-8 sm:py-12">
      <Link href="/shop" className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-ink">
        <ArrowLeft size={14} /> Continue shopping
      </Link>
      <div className="mt-4 flex items-baseline justify-between gap-4 border-b border-ink/10 pb-5">
        <h1 className="text-2xl font-semibold sm:text-3xl">Shopping bag</h1>
        <span className="text-sm text-ink/50">
          {count} item{count === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-14">
        <section aria-label="Items in your bag">

          {/* Column headers (desktop) */}
          <div className="eyebrow hidden grid-cols-[1fr_120px_140px_100px] gap-6 border-b border-ink/10 pb-3 md:grid">
            <span>Product</span>
            <span>Price</span>
            <span>Quantity</span>
            <span className="text-right">Total</span>
          </div>

          <ul className="divide-y divide-ink/10">
            {items.map((item) => (
              <li key={item.id} className="grid grid-cols-[88px_1fr] gap-4 py-6 md:grid-cols-[1fr_120px_140px_100px] md:items-center md:gap-6">
                {/* Product */}
                <div className="contents md:flex md:items-center md:gap-4">
                  <Link href={`/product/${item.slug}`} className="row-span-2 block h-[88px] w-[88px] shrink-0 overflow-hidden rounded-md bg-clay-50 md:row-span-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image || PLACEHOLDER_IMG} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
                  </Link>
                  <div className="min-w-0">
                    <Link href={`/product/${item.slug}`} className="font-medium leading-snug hover:underline hover:underline-offset-4">
                      {item.name}
                    </Link>
                    <p className="mt-1 text-sm text-ink/60 md:hidden">{formatPrice(item.price)}</p>
                    {item.stock <= 3 && <p className="mt-1 text-xs text-clay-700">Only {item.stock} left</p>}
                  </div>
                </div>

                {/* Price (desktop) */}
                <span className="hidden text-sm tabular-nums text-ink/70 md:block">{formatPrice(item.price)}</span>

                {/* Quantity + mobile line total */}
                <div className="col-start-2 flex items-center justify-between gap-4 md:col-start-auto md:block">
                  <div className="inline-flex h-10 items-center rounded-md border border-ink/15">
                    <button
                      className="flex h-full w-10 items-center justify-center text-ink/60 hover:text-ink disabled:opacity-30"
                      onClick={() => setQty(item.id, item.quantity - 1)} // at 1, this removes the item from the bag
                      aria-label={item.quantity <= 1 ? `Remove ${item.name} from bag` : `Decrease quantity of ${item.name}`}
                      title={item.quantity <= 1 ? "Remove from bag" : "Decrease quantity"}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">{item.quantity}</span>
                    <button
                      className="flex h-full w-10 items-center justify-center text-ink/60 hover:text-ink disabled:opacity-30"
                      onClick={() => setQty(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      aria-label={`Increase quantity of ${item.name}`}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <p className="font-medium tabular-nums md:hidden">{formatPrice(item.price * item.quantity)}</p>
                </div>

                {/* Line total (desktop) */}
                <span className="hidden text-right font-medium tabular-nums md:block">{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
        </section>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <OrderSummary
            quote={quote}
            loading={loading}
            footer={
              <>
                <Link
                  href="/checkout"
                  aria-disabled={!!quote?.error}
                  className={`btn-primary w-full py-3.5 text-[15px] ${quote?.error ? "pointer-events-none opacity-50" : ""}`}
                >
                  <Lock size={15} /> Checkout
                </Link>
                <ul className="mt-5 space-y-2.5 border-t border-ink/10 pt-5 text-xs text-ink/60">
                  <li className="flex items-center gap-2.5"><Lock size={14} className="shrink-0" /> Secure, encrypted checkout</li>
                  <li className="flex items-center gap-2.5">
                    <Truck size={14} className="shrink-0" /> Ships in {LEGAL.processingTime}
                  </li>
                </ul>
              </>
            }
          />
        </aside>
      </div>
    </div>
  );
}
