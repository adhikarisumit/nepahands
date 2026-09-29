"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import Modal from "@/components/Modal";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  /** Short overview shown on the card. */
  summary: React.ReactNode;
  buttonLabel: string;
  modalSize?: "md" | "lg" | "xl";
  children: React.ReactNode;
};

// Lets a form inside the modal close it after a successful save.
const CloseContext = createContext<() => void>(() => {});
export const useCloseSettingsModal = () => useContext(CloseContext);

/** Summary card; the full settings form opens in its own modal when the button is clicked. */
export default function SettingsSection({ id, title, description, icon, summary, buttonLabel, modalSize = "xl", children }: Props) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <section id={id} className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-clay-50 text-clay-700">{icon}</span>
      <div className="min-w-0 flex-1">
        <h2 className="font-semibold">{title}</h2>
        <p className="text-sm text-ink/60">{description}</p>
        <div className="mt-3 flex flex-wrap gap-2">{summary}</div>
      </div>
      <button type="button" onClick={() => setOpen(true)} className="btn-outline shrink-0 self-start sm:self-center">
        {buttonLabel} <ArrowUpRight size={15} />
      </button>

      <Modal open={open} onClose={close} title={title} size={modalSize}>
        <CloseContext.Provider value={close}>
          {/* Forms render their own card; inside the modal we drop that outer border/padding. */}
          <div className="[&>form.card]:border-0 [&>form.card]:p-0">{children}</div>
        </CloseContext.Provider>
      </Modal>
    </section>
  );
}

/** Small label/value chip used in section summaries. */
export function Chip({ label, value, tone = "neutral" }: { label?: string; value: React.ReactNode; tone?: "neutral" | "good" | "warn" | "off" }) {
  const tones = {
    neutral: "bg-ink/5 text-ink/80",
    good: "bg-emerald-50 text-emerald-800",
    warn: "bg-amber-50 text-amber-800",
    off: "bg-ink/5 text-ink/50",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs", tones[tone])}>
      {label && <span className="text-ink/50">{label}</span>}
      <span className="font-medium">{value}</span>
    </span>
  );
}
