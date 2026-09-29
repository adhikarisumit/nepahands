"use client";

import { useRouter } from "next/navigation";
import { Check, Copy, ShoppingBag } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useCart } from "@/store/cart";
import { formatDate, formatPrice } from "@/lib/utils";

type Props = {
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrder: number;
  expiresAt: string | null;
  description: string | null;
};

export default function CouponCard({ code, type, value, minOrder, expiresAt, description }: Props) {
  const setCoupon = useCart((s) => s.setCoupon);
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const headline = type === "percent" ? `${value}% OFF` : `${formatPrice(value)} OFF`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Code copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — select the code manually");
    }
  };

  return (
    <div className="card relative flex overflow-hidden">
      <div className="flex w-28 shrink-0 flex-col items-center justify-center bg-clay-700 p-4 text-center text-white">
        <span className="text-2xl font-bold leading-tight">{headline.split(" ")[0]}</span>
        <span className="text-xs tracking-widest opacity-80">OFF</span>
      </div>
      {/* ticket notches */}
      <span className="absolute left-[104px] top-0 h-4 w-4 -translate-y-1/2 rounded-full bg-clay-50" />
      <span className="absolute bottom-0 left-[104px] h-4 w-4 translate-y-1/2 rounded-full bg-clay-50" />
      <div className="flex flex-1 flex-col gap-3 border-l-2 border-dashed border-clay-200 p-4">
        <div>
          <p className="font-semibold">{description || headline}</p>
          <p className="mt-0.5 text-xs text-ink/50">
            {minOrder > 0 ? `On orders over ${formatPrice(minOrder)}` : "No minimum spend"}
            {expiresAt && ` · Expires ${formatDate(expiresAt)}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={copy}
            className="flex items-center gap-2 rounded-lg border border-dashed border-clay-400 bg-clay-50 px-3 py-1.5 font-mono text-sm font-semibold tracking-wider hover:bg-clay-100"
            title="Copy code"
          >
            {code} {copied ? <Check size={14} className="text-sage-600" /> : <Copy size={14} className="text-ink/40" />}
          </button>
          <button
            onClick={() => {
              setCoupon(code);
              toast.success(`${code} applied to your cart`);
              router.push("/cart");
            }}
            className="btn-primary px-3 py-1.5 text-xs"
          >
            <ShoppingBag size={14} /> Apply
          </button>
        </div>
      </div>
    </div>
  );
}
