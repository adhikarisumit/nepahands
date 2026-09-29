"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LEGAL_PAGES } from "@/lib/legal";
import { cn } from "@/lib/utils";

export default function LegalNav() {
  const path = usePathname();
  return (
    <nav aria-label="Legal" className="lg:sticky lg:top-28 lg:self-start">
      <p className="mb-3 hidden text-xs font-semibold uppercase tracking-widest text-ink/40 lg:block">Legal</p>
      <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
        {LEGAL_PAGES.map((p) => (
          <li key={p.href} className="shrink-0">
            <Link
              href={p.href}
              className={cn(
                "block rounded-lg px-3 py-2 text-sm transition",
                path === p.href ? "bg-white font-medium text-clay-800 shadow-sm ring-1 ring-clay-100" : "text-ink/70 hover:bg-white/70"
              )}
            >
              {p.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
