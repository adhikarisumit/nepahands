"use client";

import { useRef, useState, useTransition } from "react";
import { Check, Copy, RefreshCw, ShieldCheck, UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import { createUser, setRole } from "../actions";
import { formatDate } from "@/lib/utils";

type AdminRow = { id: string; email: string | null; full_name: string | null; created_at: string };

/** Strong random password without look-alike characters (0/O, 1/l/I). */
function generatePassword(length = 14) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*?";
  const bytes = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export default function UsersPanel({ admins, currentUserId }: { admins: AdminRow[]; currentUserId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [created, setCreated] = useState<{ email: string; password: string; role: string } | null>(null);
  const [pending, start] = useTransition();

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy — select it manually");
    }
  };

  return (
    <div className="space-y-6">
      {/* Create user */}
      <form
        ref={formRef}
        className="card space-y-5 p-6"
        action={(fd) => {
          const role = String(fd.get("role"));
          const pw = String(fd.get("password") ?? "");
          start(async () => {
            const res = await createUser(fd);
            if (res.error) return void toast.error(res.error);
            toast.success(role === "admin" ? "Admin account created" : "Customer account created");
            setCreated({ email: res.email ?? "", password: pw, role });
            setPassword("");
            formRef.current?.reset();
          });
        }}
      >
        <div className="flex items-center gap-2">
          <UserPlus size={18} className="text-clay-700" />
          <h3 className="font-semibold">Create a user</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label" htmlFor="new-name">Full name</label>
            <input id="new-name" name="full_name" className="input" required maxLength={120} autoComplete="off" />
          </div>
          <div>
            <label className="label" htmlFor="new-email">Email</label>
            <input id="new-email" name="email" type="email" className="input" required autoComplete="off" />
          </div>
          <div>
            <label className="label" htmlFor="new-role">Role</label>
            <select id="new-role" name="role" className="input" defaultValue="customer">
              <option value="customer">Customer</option>
              <option value="admin">Admin — full access to this panel</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="new-password">Temporary password</label>
            <div className="flex gap-2">
              <input
                id="new-password"
                name="password"
                type="text"
                className="input font-mono"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
              <button type="button" className="btn-outline shrink-0 px-3" onClick={() => setPassword(generatePassword())} title="Generate a strong password">
                <RefreshCw size={15} /> <span className="hidden sm:inline">Generate</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-xs text-ink/50">
          The account is confirmed straight away. Share the email and temporary password with the person privately — they can change it in
          Profile &amp; security after signing in.
        </p>

        <div className="flex justify-end">
          <button className="btn-primary px-6" disabled={pending}>{pending ? "Creating…" : "Create user"}</button>
        </div>
      </form>

      {/* One-time summary so the admin can pass the details on */}
      {created && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-sm">
          <p className="font-medium text-emerald-900">
            {created.role === "admin" ? "Admin" : "Customer"} account ready for {created.email}
          </p>
          <p className="mt-1 text-emerald-900/80">Copy these sign-in details now — the password won&apos;t be shown again.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="rounded bg-white px-3 py-1.5 font-mono text-xs">
              {created.email} · {created.password}
            </code>
            <button
              type="button"
              className="btn-outline bg-white px-3 py-1.5 text-xs"
              onClick={() => copy(`Email: ${created.email}\nTemporary password: ${created.password}\nSign in: ${window.location.origin}/login`)}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />} Copy details
            </button>
            <button type="button" className="text-xs text-emerald-900/70 underline" onClick={() => setCreated(null)}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Admins */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-ink/10 px-6 py-4">
          <ShieldCheck size={18} className="text-clay-700" />
          <h3 className="font-semibold">Admins</h3>
          <span className="text-sm text-ink/50">({admins.length})</span>
        </div>
        <ul className="divide-y divide-ink/10">
          {admins.map((a) => (
            <AdminItem key={a.id} admin={a} isSelf={a.id === currentUserId} />
          ))}
        </ul>
        <p className="border-t border-ink/10 px-6 py-3 text-xs text-ink/50">
          To make an existing customer an admin, use the Role menu on the Customers page.
        </p>
      </div>
    </div>
  );
}

function AdminItem({ admin, isSelf }: { admin: AdminRow; isSelf: boolean }) {
  const [pending, start] = useTransition();
  return (
    <li className="flex flex-wrap items-center gap-3 px-6 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-clay-100 text-xs font-semibold text-clay-800">
        {(admin.full_name || admin.email || "?").slice(0, 2).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {admin.full_name || "—"} {isSelf && <span className="text-xs font-normal text-ink/50">(you)</span>}
        </p>
        <p className="truncate text-xs text-ink/50">
          {admin.email} · since {formatDate(admin.created_at)}
        </p>
      </div>
      {!isSelf && (
        <button
          className="btn-ghost px-3 py-1.5 text-xs text-red-600"
          disabled={pending}
          onClick={() =>
            confirm(`Remove admin access for ${admin.email}? They'll keep their account as a customer.`) &&
            start(async () => {
              const res = await setRole(admin.id, "customer");
              if (res.error) toast.error(res.error);
              else toast.success("Admin access removed");
            })
          }
        >
          Remove admin
        </button>
      )}
    </li>
  );
}
