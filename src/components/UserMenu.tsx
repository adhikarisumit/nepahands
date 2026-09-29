"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogIn, LogOut, User, UserPlus } from "lucide-react";
import { ACCOUNT_LINKS, ADMIN_LINK, isActiveLink } from "./accountLinks";
import { cn } from "@/lib/utils";

type Props = { isLoggedIn: boolean; isAdmin: boolean; name?: string | null; email?: string | null; storeName: string };

export default function UserMenu({ isLoggedIn, isAdmin, name, email, storeName }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const displayName = name || email?.split("@")[0] || "";
  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const firstName = displayName.split(" ")[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn("btn-ghost gap-2 px-3", isLoggedIn && "pl-1.5", open && "bg-clay-100")}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Account"
      >
        {isLoggedIn && initials ? (
          <>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-clay-700 text-[11px] font-semibold text-white">
              {initials}
            </span>
            <span className="hidden max-w-[120px] truncate text-sm font-medium sm:inline">{firstName}</span>
            <ChevronDown size={14} className={cn("hidden text-ink/50 transition sm:block", open && "rotate-180")} />
          </>
        ) : (
          <>
            <User size={20} />
            <span className="hidden text-sm font-medium sm:inline">Sign in</span>
          </>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right overflow-hidden rounded-2xl border border-clay-100 bg-white shadow-xl shadow-clay-900/10"
        >
          {isLoggedIn ? (
            <>
              <div className="border-b border-clay-100 bg-clay-50 px-4 py-3">
                <p className="truncate text-sm font-semibold">{displayName}</p>
                <p className="truncate text-xs text-ink/50">{email}</p>
              </div>
              <div className="p-1.5">
                {ACCOUNT_LINKS.map((l) => (
                  <Item key={l.href} {...l} active={isActiveLink(pathname, l.href)} />
                ))}
              </div>
              {isAdmin && (
                <div className="border-t border-clay-100 p-1.5">
                  <Item {...ADMIN_LINK} active={isActiveLink(pathname, ADMIN_LINK.href)} />
                </div>
              )}
              <div className="border-t border-clay-100 p-1.5">
                <form action="/auth/signout" method="post">
                  <button
                    role="menuitem"
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink/70 hover:bg-red-50 hover:text-red-700"
                  >
                    <LogOut size={16} /> Sign out
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="p-4">
              <p className="text-sm font-semibold">Welcome to {storeName}</p>
              <p className="mt-0.5 text-xs text-ink/50">Sign in to track orders, save favourites and get exclusive coupons.</p>
              <div className="mt-4 grid gap-2">
                <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="btn-primary w-full">
                  <LogIn size={16} /> Sign in
                </Link>
                <Link href="/signup" className="btn-outline w-full">
                  <UserPlus size={16} /> Create account
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Item({ href, icon: Icon, label, active }: { href: string; icon: typeof User; label: string; active: boolean }) {
  return (
    <Link
      role="menuitem"
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
        active ? "bg-clay-50 font-medium text-clay-800" : "text-ink/80 hover:bg-clay-50 hover:text-clay-800"
      )}
    >
      <Icon size={16} className={active ? "text-clay-600" : "text-ink/40"} /> {label}
    </Link>
  );
}
