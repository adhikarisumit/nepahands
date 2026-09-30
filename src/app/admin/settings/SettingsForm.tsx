"use client";

import { useTransition } from "react";
import toast from "react-hot-toast";
import { saveSettings } from "../actions";
import { useCloseSettingsModal } from "./SettingsSection";
import type { StoreSettings } from "@/lib/types";

export default function SettingsForm({ settings }: { settings: StoreSettings }) {
  const [pending, start] = useTransition();
  const closeModal = useCloseSettingsModal();
  return (
    <form
      className="card space-y-6 p-6"
      action={(fd) =>
        start(async () => {
          const res = await saveSettings(fd);
          if (res.error) toast.error(res.error);
          else {
            toast.success("Settings saved");
            closeModal();
          }
        })
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-semibold">Store</h3>
          <p className="text-xs text-ink/50">
            The store name and homepage content are set in the code (src/lib/branding.ts).
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Contact email</label>
            <input name="contact_email" type="email" className="input" defaultValue={settings.contact_email ?? ""} placeholder="nepahands@gmail.com" />
          </div>
          <div>
            <label className="label">Announcement bar</label>
            <input name="announcement" className="input" defaultValue={settings.announcement ?? ""} placeholder="Leave blank to hide" />
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t border-clay-100 pt-6">
        <h3 className="font-semibold">Shipping &amp; tax</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Shipping rate (per order)</label>
            <input name="shipping_flat" type="number" step="0.01" min="0" className="input" defaultValue={settings.shipping_flat} />
            <p className="mt-1 text-xs text-ink/50">Charged on every order. Use 0 to always ship free.</p>
          </div>
          <div>
            <label className="label">Tax rate %</label>
            <input name="tax_rate" type="number" step="0.01" min="0" max="100" className="input" defaultValue={settings.tax_rate} />
            <p className="mt-1 text-xs text-ink/50">Stripe &amp; bank transfer. Paddle adds tax itself.</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end border-t border-clay-100 pt-6">
        <button className="btn-primary px-8" disabled={pending}>{pending ? "Saving…" : "Save settings"}</button>
      </div>
    </form>
  );
}
