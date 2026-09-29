"use client";

import { useEffect, useState } from "react";
import { MailCheck } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "@/components/Modal";
import { createClient } from "@/lib/supabase/client";

type Props = { open: boolean; onClose: () => void; email: string };

/** Sends a password-reset link to the signed-in user's email address. */
export default function ForgotPasswordModal({ open, onClose, email }: Props) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (open) setSent(false);
  }, [open]);

  const send = async () => {
    setSending(true);
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setSending(false);
    if (error) {
      toast.error(/rate|security purposes/i.test(error.message) ? "Please wait a minute before requesting another link." : error.message);
      return;
    }
    setSent(true);
  };

  return (
    <Modal open={open} onClose={onClose} title={sent ? "Check your inbox" : "Reset your password"}>
      {sent ? (
        <div className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <MailCheck size={26} />
          </span>
          <p className="mt-4 text-sm text-ink/70">
            We&apos;ve sent a password reset link to <strong className="text-ink">{email}</strong>. Open it on this device to choose a new
            password.
          </p>
          <p className="mt-3 text-xs text-ink/50">The link expires after an hour. Didn&apos;t get it? Check your spam folder or send it again.</p>
          <div className="mt-6 flex justify-center gap-2">
            <button type="button" className="btn-ghost" onClick={send} disabled={sending}>
              {sending ? "Sending…" : "Send again"}
            </button>
            <button type="button" className="btn-primary px-6" onClick={onClose}>Done</button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm text-ink/70">
            Forgotten your current password? We&apos;ll email you a secure link to set a new one.
          </p>
          <label className="label mt-5" htmlFor="reset-email">Email address</label>
          <input id="reset-email" className="input bg-clay-50 text-ink/70" value={email} readOnly />
          <p className="mt-1.5 text-xs text-ink/50">The link is sent to the email address on your account.</p>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            <button type="button" className="btn-primary px-6" onClick={send} disabled={sending || !email}>
              {sending ? "Sending…" : "Send reset link"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
