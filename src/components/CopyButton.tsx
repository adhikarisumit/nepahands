"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      title="Copy"
      className="text-ink/40 hover:text-clay-700"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard unavailable */
        }
      }}
    >
      {copied ? <Check size={14} className="text-sage-600" /> : <Copy size={14} />}
    </button>
  );
}
