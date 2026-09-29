"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, LayoutGrid, LogIn, LogOut, Search, ShoppingBag, Sparkles, Store, UserPlus, X, BookOpen } from "lucide-react";
import BrandLogo from "./BrandLogo";
import { ACCOUNT_LINKS, ADMIN_LINK, isActiveLink } from "./accountLinks";
import { LEGAL_PAGES } from "@/lib/legal";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  storeName: string;
  logoUrl?: string | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  userName?: string | null;
  userEmail?: string | null;
  cartCount: number;
};

const SHOP_LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/shop", label: "Shop all", icon: Store },
  { href: "/shop?sort=newest", label: "New in", icon: Sparkles },
  { href: "/categories", label: "Categories", icon: LayoutGrid },
  { href: "/about", label: "Our story", icon: BookOpen },
];

/**
 * Phone/tablet navigation: slides in from the right (next to the menu button) and covers ~70% of the
 * screen, leaving the page visible (dimmed) on the left — tapping that area closes it.
 */
export default function MobileDrawer({ open, onClose, storeName, logoUrl, isLoggedIn, isAdmin, userName, userEmail, cartCount }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState("");

  // Close on navigation
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Lock page scroll + close on Escape while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const firstName = (userName || userEmail?.split("@")[0] || "").split(" ")[0];
  const item = (active: boolean) =>
    cn("flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] transition-colors", active ? "bg-clay-50 font-medium text-clay-800" : "text-ink hover:bg-ink/5");

  return (
    <div className={cn("fixed inset-0 z-50 lg:hidden", open ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!open}>
      {/* Dimmed page (the visible ~30%) — tap to close */}
      <div className={cn("absolute inset-0 bg-ink/40 transition-opacity duration-300", open ? "opacity-100" : "opacity-0")} onClick={onClose} />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={cn(
          "absolute inset-y-0 right-0 flex w-[70%] min-w-[260px] max-w-[360px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-4 py-4">
          <Link href="/" className="min-w-0">
            <BrandLogo name={storeName} logoUrl={logoUrl} />
          </Link>
          <button onClick={onClose} className="rounded-md p-1.5 text-ink/60 hover:bg-ink/5 hover:text-ink" aria-label="Close menu" tabIndex={open ? 0 : -1}>
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`/shop?q=${encodeURIComponent(q)}`);
              onClose();
            }}
            className="relative mb-4"
          >
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="input pl-9" tabIndex={open ? 0 : -1} />
          </form>

          <nav aria-label="Shop" className="space-y-0.5">
            {SHOP_LINKS.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className={item(href === "/" ? pathname === "/" : pathname === href.split("?")[0] && !href.includes("?"))} tabIndex={open ? 0 : -1}>
                <Icon size={18} className="text-ink/40" /> {label}
              </Link>
            ))}
          </nav>

          <div className="my-4 border-t border-ink/10" />

          {isLoggedIn ? (
            <nav aria-label="Account" className="space-y-0.5">
              <p className="px-3 pb-2 text-sm font-semibold">Hello, {firstName}</p>
              <Link href="/cart" className={item(pathname === "/cart")} tabIndex={open ? 0 : -1}>
                <ShoppingBag size={18} className="text-ink/40" /> Cart
                {cartCount > 0 && <span className="ml-auto rounded-full bg-clay-700 px-2 py-0.5 text-xs font-medium text-white">{cartCount}</span>}
              </Link>
              {ACCOUNT_LINKS.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className={item(isActiveLink(pathname, href))} tabIndex={open ? 0 : -1}>
                  <Icon size={18} className="text-ink/40" /> {label}
                </Link>
              ))}
              {isAdmin && (
                <Link href={ADMIN_LINK.href} className={item(isActiveLink(pathname, ADMIN_LINK.href))} tabIndex={open ? 0 : -1}>
                  <ADMIN_LINK.icon size={18} className="text-ink/40" /> {ADMIN_LINK.label}
                </Link>
              )}
              <form action="/auth/signout" method="post">
                <button className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-[15px] text-red-600 hover:bg-red-50" tabIndex={open ? 0 : -1}>
                  <LogOut size={18} /> Sign out
                </button>
              </form>
            </nav>
          ) : (
            <div className="space-y-2 px-1">
              <p className="px-2 pb-1 text-sm text-ink/60">Sign in to track orders, save favourites and see your coupons.</p>
              <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="btn-primary w-full" tabIndex={open ? 0 : -1}>
                <LogIn size={16} /> Sign in
              </Link>
              <Link href="/signup" className="btn-outline w-full" tabIndex={open ? 0 : -1}>
                <UserPlus size={16} /> Create account
              </Link>
              <Link href="/cart" className={cn(item(pathname === "/cart"), "mt-2")} tabIndex={open ? 0 : -1}>
                <ShoppingBag size={18} className="text-ink/40" /> Cart
                {cartCount > 0 && <span className="ml-auto rounded-full bg-clay-700 px-2 py-0.5 text-xs font-medium text-white">{cartCount}</span>}
              </Link>
            </div>
          )}
        </div>

        <div className="border-t border-ink/10 px-4 py-3">
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink/50">
            {LEGAL_PAGES.slice(0, 3).map((p) => (
              <Link key={p.href} href={p.href} className="hover:text-ink" tabIndex={open ? 0 : -1}>
                {p.label.replace(" & Return", "")}
              </Link>
            ))}
            <Link href="/contact" className="hover:text-ink" tabIndex={open ? 0 : -1}>Contact</Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
