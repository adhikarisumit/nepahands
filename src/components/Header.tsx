"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Heart, Menu, Search, ShoppingBag } from "lucide-react";
import { useCart, cartCount } from "@/store/cart";
import UserMenu from "./UserMenu";
import BrandLogo from "./BrandLogo";
import MobileDrawer from "./MobileDrawer";

type Props = {
  isLoggedIn: boolean;
  isAdmin: boolean;
  announcement?: string | null;
  storeName: string;
  logoUrl?: string | null;
  userName?: string | null;
  userEmail?: string | null;
};

const LINKS = [
  { href: "/shop", label: "Shop all" },
  { href: "/shop?sort=newest", label: "New in" },
  { href: "/categories", label: "Categories" },
  { href: "/about", label: "Our story" },
];

export default function Header({ isLoggedIn, isAdmin, announcement, storeName, logoUrl, userName, userEmail }: Props) {
  const items = useCart((s) => s.items);
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => setMounted(true), []);
  const count = mounted ? cartCount(items) : 0;

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/shop?q=${encodeURIComponent(q)}`);
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-clay-100 bg-clay-50/95 backdrop-blur">
        {announcement && (
          <div className="bg-clay-800 px-4 py-1.5 text-center text-xs tracking-wide text-clay-50">{announcement}</div>
        )}
        <div className="container-x flex h-16 items-center gap-2 sm:gap-4">
          <Link href="/" className="min-w-0 shrink">
            <BrandLogo name={storeName} logoUrl={logoUrl} />
          </Link>

          {/* Desktop navigation */}
          <nav className="ml-8 hidden gap-6 text-sm lg:flex">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="text-ink/80 hover:text-clay-700">
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Search (tablet + desktop) */}
          <form onSubmit={onSearch} className="ml-auto hidden max-w-xs flex-1 md:block">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search handmade goods…" className="input rounded-full pl-9" />
            </div>
          </form>

          <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1 md:ml-2">
            {/* Wishlist + account dropdown on desktop; on phones/tablets these live in the drawer */}
            <Link href="/wishlist" className="btn-ghost hidden px-3 lg:inline-flex" title="Wishlist">
              <Heart size={20} />
            </Link>
            <div className="hidden lg:block">
              <UserMenu isLoggedIn={isLoggedIn} isAdmin={isAdmin} name={userName} email={userEmail} storeName={storeName} />
            </div>
            <Link href="/cart" className="btn-ghost relative px-2.5 sm:px-3" title="Cart">
              <ShoppingBag size={20} />
              {count > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-clay-700 px-1 text-[10px] font-bold text-white">
                  {count}
                </span>
              )}
            </Link>
            {/* Menu button on the right (phones + tablets) */}
            <button
              className="btn-ghost -mr-1 px-2.5 lg:hidden"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              aria-expanded={drawerOpen}
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      <MobileDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        storeName={storeName}
        logoUrl={logoUrl}
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        userName={userName}
        userEmail={userEmail}
        cartCount={count}
      />
    </>
  );
}
