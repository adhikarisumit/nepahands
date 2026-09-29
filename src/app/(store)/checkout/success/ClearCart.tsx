"use client";

import { useEffect } from "react";
import { useCart } from "@/store/cart";

export default function ClearCart() {
  const clear = useCart((s) => s.clear);
  useEffect(() => clear(), [clear]);
  return null;
}
