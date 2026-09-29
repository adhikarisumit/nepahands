"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import toast from "react-hot-toast";
import { toggleWishlist } from "@/app/(store)/actions";
import { cn } from "@/lib/utils";

export default function WishlistButton({ productId, initial, isLoggedIn }: { productId: string; initial: boolean; isLoggedIn: boolean }) {
  const [saved, setSaved] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <button
      className="btn-outline h-12 w-full"
      disabled={pending}
      aria-pressed={saved}
      onClick={() => {
        if (!isLoggedIn) return router.push(`/login?next=${encodeURIComponent(pathname)}`);
        start(async () => {
          const res = await toggleWishlist(productId);
          if (res.error) return void toast.error(res.error);
          setSaved(!!res.saved);
          toast.success(res.saved ? "Saved to your wishlist" : "Removed from your wishlist");
        });
      }}
    >
      <Heart size={17} className={cn("transition-colors", saved && "fill-clay-700 text-clay-700")} />
      {saved ? "Saved to wishlist" : "Add to wishlist"}
    </button>
  );
}
