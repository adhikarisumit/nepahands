"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

/** Simple dialog: closes on Escape or backdrop click. Slides up as a bottom sheet on phones. */
type Props = { open: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: "md" | "lg" | "xl" };

const WIDTHS = { md: "sm:max-w-lg", lg: "sm:max-w-2xl", xl: "sm:max-w-4xl" };

export default function Modal({ open, onClose, title, children, size = "md" }: Props) {
  // Lock page scroll only while open (depends on `open` alone so re-renders don't re-capture "hidden").
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl ${WIDTHS[size]}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-clay-100 bg-white px-6 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-ink/50 hover:bg-clay-50 hover:text-ink" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
