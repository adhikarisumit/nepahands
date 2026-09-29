"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MailCheck } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { isStrongEnough, MatchHint, PasswordInput, RuleChecklist, StrengthMeter } from "./PasswordFields";

type Mode = "login" | "signup" | "forgot" | "reset";

const TITLES: Record<Mode, string> = {
  login: "Welcome back",
  signup: "Create your account",
  forgot: "Reset your password",
  reset: "Choose a new password",
};

const SUBTITLES: Record<Mode, string> = {
  login: "Sign in to see your orders, wishlist and coupons.",
  signup: "Track orders, save favourites and check out faster.",
  forgot: "Enter your email and we'll send you a link to reset your password.",
  reset: "Pick a strong password you don't use on other websites.",
};

export default function AuthForm({ mode, next }: { mode: Mode; next?: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  // Only allow same-site relative redirects.
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";

  // Sign-up and reset set a NEW password: require confirmation + minimum strength.
  const settingPassword = mode === "signup" || mode === "reset";
  const matches = confirm.length > 0 && confirm === password;
  const passwordOk = !settingPassword || (isStrongEnough(password) && matches);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (settingPassword) {
      if (!isStrongEnough(password)) return void toast.error("Please choose a stronger password");
      if (password !== confirm) return void toast.error("Passwords don't match");
    }
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(/invalid/i.test(error.message) ? "Incorrect email or password" : error.message);
        router.push(safeNext);
        router.refresh();
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`,
          },
        });
        if (error) throw error;
        if (data.session) {
          router.push(safeNext);
          router.refresh();
        } else setSent(true);
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        });
        if (error) throw error;
        setSent(true);
      } else {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        toast.success("Password updated");
        router.push("/account");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="container-x py-20">
        <div className="card mx-auto max-w-md p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <MailCheck size={26} />
          </span>
          <h1 className="mt-4 text-2xl font-semibold">Check your email</h1>
          <p className="mt-3 text-sm text-ink/70">
            We sent a link to <strong className="text-ink">{email}</strong>.{" "}
            {mode === "signup" ? "Click it to confirm your account." : "Open it on this device to set a new password."}
          </p>
          <p className="mt-3 text-xs text-ink/50">Can&apos;t find it? Check your spam folder.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-x py-12 sm:py-16">
      <form onSubmit={submit} className="card mx-auto max-w-md space-y-5 p-6 sm:p-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold sm:text-3xl">{TITLES[mode]}</h1>
          <p className="mt-2 text-sm text-ink/60">{SUBTITLES[mode]}</p>
        </div>

        {mode === "signup" && (
          <div>
            <label className="label" htmlFor="auth-name">Full name</label>
            <input id="auth-name" className="input" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        )}

        {mode !== "reset" && (
          <div>
            <label className="label" htmlFor="auth-email">Email</label>
            <input id="auth-email" className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        )}

        {mode === "login" && (
          <div>
            <div className="flex items-baseline justify-between">
              <label className="label" htmlFor="auth-password">Password</label>
              <Link href="/forgot-password" className="text-xs font-medium text-clay-700 hover:underline">Forgot password?</Link>
            </div>
            <PasswordInput id="auth-password" value={password} onChange={setPassword} autoComplete="current-password" />
          </div>
        )}

        {settingPassword && (
          <>
            <div>
              <label className="label" htmlFor="auth-new-password">{mode === "reset" ? "New password" : "Password"}</label>
              <PasswordInput id="auth-new-password" value={password} onChange={setPassword} autoComplete="new-password" />
              <StrengthMeter password={password} />
            </div>
            <div>
              <label className="label" htmlFor="auth-confirm-password">Confirm password</label>
              <PasswordInput id="auth-confirm-password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
              <MatchHint password={password} confirm={confirm} />
            </div>
            <RuleChecklist password={password} />
          </>
        )}

        <button className="btn-primary w-full py-3" disabled={loading || !passwordOk}>
          {loading ? "Please wait…" : mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Update password"}
        </button>

        {mode === "signup" && (
          <p className="text-center text-xs text-ink/50">
            By creating an account you agree to our <Link href="/terms" className="underline hover:text-clay-700">Terms of Service</Link> and{" "}
            <Link href="/privacy-policy" className="underline hover:text-clay-700">Privacy Policy</Link>.
          </p>
        )}

        <p className="border-t border-ink/10 pt-5 text-center text-sm text-ink/60">
          {mode === "login" ? (
            <>
              New here?{" "}
              <Link href={`/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-medium text-clay-700 underline">
                Create an account
              </Link>
            </>
          ) : (
            <>
              Already have an account? <Link href="/login" className="font-medium text-clay-700 underline">Sign in</Link>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
