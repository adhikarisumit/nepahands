"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ConfirmOptions = {
  title: string;
  message?: React.ReactNode;
  /** Label of the confirm button, e.g. "Delete". */
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red, warning-style dialog for destructive actions. */
  danger?: boolean;
  /** If set, the user must type this word (e.g. "delete") before confirming. */
  typeToConfirm?: string;
};

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };

const ConfirmContext = createContext<(opts: ConfirmOptions) => Promise<boolean>>(async () => false);

/** `const confirm = useConfirm(); if (await confirm({...})) { ... }` */
export const useConfirm = () => useContext(ConfirmContext);

/** Shortcut for permanent deletions: red dialog that requires typing "delete". */
export function deleteOptions(what: string, detail?: React.ReactNode): ConfirmOptions {
  return {
    title: `Delete ${what}?`,
    message: detail ?? "This permanently removes it from the website. This can't be undone.",
    confirmLabel: "Delete",
    danger: true,
    typeToConfirm: "delete",
  };
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);

  const confirm = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setPending({ ...opts, resolve });
      }),
    []
  );

  const close = (ok: boolean) => {
    pending?.resolve(ok);
    setPending(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && <Dialog opts={pending} onClose={close} />}
    </ConfirmContext.Provider>
  );
}

function Dialog({ opts, onClose }: { opts: ConfirmOptions; onClose: (ok: boolean) => void }) {
  const [typed, setTyped] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const word = opts.typeToConfirm?.toLowerCase();
  const ready = !word || typed.trim().toLowerCase() === word;

  useEffect(() => {
    (word ? inputRef.current : confirmRef.current)?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Capture phase on window + stopPropagation: Esc closes only this dialog, not a modal behind it.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose(false);
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const Icon = opts.danger ? AlertTriangle : HelpCircle;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={() => onClose(false)}>
      <form
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full rounded-t-2xl bg-white p-6 shadow-2xl sm:max-w-md sm:rounded-2xl"
        onMouseDown={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (ready) onClose(true);
        }}
      >
        <div className="flex gap-4">
          <span
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
              opts.danger ? "bg-red-50 text-red-600" : "bg-clay-50 text-clay-700"
            )}
          >
            <Icon size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="confirm-title" className="text-lg font-semibold leading-snug">{opts.title}</h2>
            {opts.message && <div className="mt-1.5 text-sm leading-relaxed text-ink/65">{opts.message}</div>}
          </div>
        </div>

        {word && (
          <div className="mt-5">
            <label htmlFor="confirm-type" className="label">
              Type <span className="rounded bg-red-50 px-1.5 py-0.5 font-mono text-red-700">{word}</span> to confirm
            </label>
            <input
              ref={inputRef}
              id="confirm-type"
              className="input font-mono"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder={word}
            />
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn-outline" onClick={() => onClose(false)}>
            {opts.cancelLabel ?? "Cancel"}
          </button>
          <button
            ref={confirmRef}
            type="submit"
            disabled={!ready}
            className={cn("btn px-6", opts.danger ? "bg-red-600 text-white hover:bg-red-700" : "bg-clay-700 text-white hover:bg-clay-800")}
          >
            {opts.confirmLabel ?? "Confirm"}
          </button>
        </div>
      </form>
    </div>
  );
}
