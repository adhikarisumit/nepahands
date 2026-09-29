"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Upload } from "lucide-react";
import toast from "react-hot-toast";

type Props = { orderId: string; submittedReference: string | null; proofSubmitted: boolean };

export default function PaymentProofForm({ orderId, submittedReference, proofSubmitted }: Props) {
  const router = useRouter();
  const [reference, setReference] = useState(submittedReference ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(!!submittedReference || proofSubmitted);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim() && !file) return void toast.error("Add a transaction ID or a screenshot");
    if (file && file.size > 5 * 1024 * 1024) return void toast.error("Screenshot must be under 5 MB");
    setLoading(true);
    const fd = new FormData();
    fd.set("reference", reference.trim());
    if (file) fd.set("file", file);
    const res = await fetch(`/api/orders/${orderId}/payment-proof`, { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return void toast.error(data.error || "Upload failed");
    toast.success("Thanks! We'll confirm your payment shortly.");
    setDone(true);
    setFile(null);
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold">Already paid?</h3>
          <p className="text-sm text-ink/60">Share your transaction ID or a screenshot so we can confirm faster.</p>
        </div>
        {done && (
          <span className="badge shrink-0 gap-1 bg-green-100 text-green-800">
            <CheckCircle2 size={12} /> Submitted
          </span>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <input
          className="input"
          placeholder="Transaction ID / reference"
          value={reference}
          maxLength={120}
          onChange={(e) => setReference(e.target.value)}
        />
        <label className="btn-outline cursor-pointer">
          <Upload size={16} /> <span className="max-w-[140px] truncate">{file ? file.name : "Screenshot"}</span>
          <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <button className="btn-primary" disabled={loading}>{loading ? "Sending…" : done ? "Update" : "Submit"}</button>
      </div>
    </form>
  );
}
