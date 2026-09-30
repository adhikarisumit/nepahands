"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

/** Table row that opens the order when clicked anywhere (the order number stays a real link for keyboard / new-tab use). */
export default function OrderRow({ href, number, children }: { href: string; number: number; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <tr
      className="group cursor-pointer hover:bg-clay-50"
      onClick={(e) => {
        // Let real links/buttons inside the row handle their own clicks; respect text selection.
        if ((e.target as HTMLElement).closest("a, button")) return;
        if (window.getSelection()?.toString()) return;
        if (e.metaKey || e.ctrlKey) window.open(href, "_blank");
        else router.push(href);
      }}
    >
      <td>
        <Link href={href} className="font-medium text-clay-700 hover:underline">#{number}</Link>
      </td>
      {children}
      <td className="w-8 text-ink/30 group-hover:text-clay-700" aria-hidden>
        <ChevronRight size={16} />
      </td>
    </tr>
  );
}
