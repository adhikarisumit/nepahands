"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart3, LayoutDashboard, PanelTop, Boxes, ExternalLink, FolderTree, Menu, MessageSquare, Settings, ShoppingCart, Store, Tag, Users, X } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/homepage", label: "Homepage", icon: PanelTop },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/products", label: "Products", icon: Boxes },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquare },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminSidebar({ email, storeName, logoUrl }: { email: string; storeName: string; logoUrl?: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/admin" ? path === href : path.startsWith(href));

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-clay-100 bg-white px-4 py-3 lg:hidden">
        <Link href="/admin" className="flex min-w-0 items-center gap-2">
          <BrandLogo name={storeName} logoUrl={logoUrl} />
          <span className="badge shrink-0 bg-clay-100 text-clay-700">Admin</span>
        </Link>
        <button onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open} className="p-1">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      <aside
        className={cn(
          "w-full shrink-0 flex-col border-r border-clay-100 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64",
          open ? "flex" : "hidden"
        )}
      >
        <div className="hidden p-6 lg:block">
          <Link href="/admin"><BrandLogo name={storeName} logoUrl={logoUrl} /></Link>
          <p className="mt-1 text-xs uppercase tracking-widest text-ink/40">Admin panel</p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                isActive(href) ? "bg-clay-100 font-medium text-clay-800" : "text-ink/70 hover:bg-clay-50"
              )}
            >
              <Icon size={18} /> {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-clay-100 p-4 text-sm">
          <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-ink/70 hover:text-clay-700">
            <Store size={16} /> View store <ExternalLink size={12} className="text-ink/40" />
          </a>
          <p className="mt-3 truncate text-xs text-ink/40">{email}</p>
          <form action="/auth/signout" method="post">
            <button className="mt-1 text-xs text-clay-700 hover:underline">Sign out</button>
          </form>
        </div>
      </aside>
    </>
  );
}
