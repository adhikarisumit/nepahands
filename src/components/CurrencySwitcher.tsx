"use client";

import { useEffect } from "react";
import { DISPLAY_CURRENCIES, syncCurrency, useCurrency } from "@/store/currency";
import { CURRENCY, cn } from "@/lib/utils";

/** AUD / USD toggle. Also restores the saved choice and loads exchange rates on first mount. */
export default function CurrencySwitcher({ className }: { className?: string }) {
  const display = useCurrency((s) => (s.ready ? s.display : CURRENCY));
  const setDisplay = useCurrency((s) => s.setDisplay);

  useEffect(() => {
    syncCurrency();
  }, []);

  return (
    <div role="group" aria-label="Currency" className={cn("inline-flex rounded-full border border-ink/15 p-0.5 text-xs font-medium", className)}>
      {DISPLAY_CURRENCIES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setDisplay(code)}
          aria-pressed={display === code}
          className={cn("rounded-full px-2.5 py-1 transition", display === code ? "bg-ink text-white" : "text-ink/60 hover:text-ink")}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
