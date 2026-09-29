"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { isStrongEnough, MatchHint, PasswordInput, RuleChecklist, StrengthMeter } from "@/components/PasswordFields";
import ForgotPasswordModal from "./ForgotPasswordModal";

export default function PasswordForm({ email }: { email: string }) {
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const matches = confirm.length > 0 && confirm === password;
  const sameAsCurrent = password.length > 0 && password === current;
  const canSubmit = !!current && isStrongEnough(password) && matches && !sameAsCurrent && !loading;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    const supabase = createClient();
    try {
      // Confirm it's really the account owner before changing the password.
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password: current });
      if (authError) {
        toast.error("Your current password is incorrect");
        return;
      }
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Password updated");
      setCurrent("");
      setPassword("");
      setConfirm("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={submit} className="card overflow-hidden">
        <div className="space-y-5 p-5 sm:p-6">
          <div className="max-w-md">
            <div className="flex items-baseline justify-between gap-3">
              <label className="label" htmlFor="current-password">Current password</label>
              <button type="button" onClick={() => setForgotOpen(true)} className="text-xs font-medium text-clay-700 underline-offset-4 hover:underline">
                Forgot your password?
              </button>
            </div>
            <PasswordInput id="current-password" value={current} onChange={setCurrent} autoComplete="current-password" />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="label" htmlFor="new-password">New password</label>
              <PasswordInput id="new-password" value={password} onChange={setPassword} autoComplete="new-password" />
              <StrengthMeter password={password} />
            </div>
            <div>
              <label className="label" htmlFor="confirm-password">Confirm new password</label>
              <PasswordInput id="confirm-password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
              <MatchHint password={password} confirm={confirm} />
            </div>
          </div>

          <RuleChecklist password={password} className="sm:grid-cols-2">
            {sameAsCurrent && <li className="text-red-700 sm:col-span-2">Your new password must be different from your current one.</li>}
          </RuleChecklist>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-ink/10 bg-[#fbf9f7] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="flex items-center gap-2 text-xs text-ink/50">
            <KeyRound size={14} /> You&apos;ll stay signed in on this device after changing it.
          </p>
          <button className="btn-primary px-6" disabled={!canSubmit}>
            {loading ? "Updating…" : "Update password"}
          </button>
        </div>
      </form>

      <ForgotPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} email={email} />
    </>
  );
}
