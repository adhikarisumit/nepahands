"use client";

import { useState } from "react";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** One set of password rules for sign-up, reset and change-password. */
export const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Upper and lower case letters", test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: "At least one number", test: (p: string) => /\d/.test(p) },
  { label: "At least one symbol", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const LEVELS = [
  { label: "Too weak", bar: "bg-red-500", text: "text-red-700" },
  { label: "Weak", bar: "bg-red-500", text: "text-red-700" },
  { label: "Fair", bar: "bg-amber-500", text: "text-amber-700" },
  { label: "Good", bar: "bg-emerald-500", text: "text-emerald-700" },
  { label: "Strong", bar: "bg-emerald-600", text: "text-emerald-700" },
];

export const passedRules = (p: string) => PASSWORD_RULES.filter((r) => r.test(p)).length;
/** Minimum to accept: 8+ characters and at least 3 of the 4 rules. */
export const isStrongEnough = (p: string) => PASSWORD_RULES[0].test(p) && passedRules(p) >= 3;

export function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        className="input pr-11"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink/40 hover:text-ink"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}

export function StrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const passed = passedRules(password);
  const level = LEVELS[passed];
  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i <= passed ? level.bar : "bg-ink/10")} />
        ))}
      </div>
      <p className={cn("mt-1 text-xs font-medium", level.text)}>{level.label}</p>
    </div>
  );
}

export function MatchHint({ password, confirm }: { password: string; confirm: string }) {
  if (!confirm) return null;
  const ok = confirm === password;
  return (
    <p className={cn("mt-2 flex items-center gap-1 text-xs", ok ? "text-emerald-700" : "text-red-700")} aria-live="polite">
      {ok ? <Check size={13} /> : <X size={13} />} {ok ? "Passwords match" : "Passwords don't match"}
    </p>
  );
}

export function RuleChecklist({ password, className, children }: { password: string; className?: string; children?: React.ReactNode }) {
  return (
    <ul className={cn("grid gap-x-6 gap-y-1.5 rounded-md bg-clay-50 px-4 py-3 text-xs", className)}>
      {PASSWORD_RULES.map((r) => {
        const ok = r.test(password);
        return (
          <li key={r.label} className={cn("flex items-center gap-2", ok ? "text-emerald-700" : "text-ink/55")}>
            <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-full", ok ? "bg-emerald-100" : "bg-ink/5")}>
              {ok ? <Check size={11} /> : <span className="h-1 w-1 rounded-full bg-ink/30" />}
            </span>
            {r.label}
          </li>
        );
      })}
      {children}
    </ul>
  );
}
