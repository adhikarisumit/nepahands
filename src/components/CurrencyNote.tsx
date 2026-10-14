"use client";

import { useFormatPrice } from "./Price";
import { CURRENCY } from "@/lib/utils";

/** Explains that converted prices are estimates; renders nothing in the store currency. */
export default function CurrencyNote({ className }: { className?: string }) {
  const { converted, display } = useFormatPrice();
  if (!converted) return null;
  return <p className={className}>Prices in {display} are approximate. Your order is charged in {CURRENCY}.</p>;
}
