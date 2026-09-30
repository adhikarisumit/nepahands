"use client";

import { useState, useTransition } from "react";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
import { saveSettings } from "../actions";
import { useCloseSettingsModal } from "./SettingsSection";
import type { StoreSettings } from "@/lib/types";

export default function SettingsForm({ settings }: { settings: StoreSettings }) {
  const [pending, start] = useTransition();
  const closeModal = useCloseSettingsModal();
  const [rate, setRate] = useState(String(settings.shipping_flat ?? 0));
  const [minPrice, setMinPrice] = useState(String(settings.free_shipping_threshold ?? 0));
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
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="label" htmlFor="shipping_flat">Shipping charge (per order)</label>
            <input
              id="shipping_flat"
              name="shipping_flat"
              type="number"
              step="0.01"
              min="0"
              className="input"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="free_shipping_threshold">Charge shipping for products over</label>
            <input
              id="free_shipping_threshold"
              name="free_shipping_threshold"
              type="number"
              step="0.01"
              min="0"
              className="input"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <p className="mt-1 text-xs text-ink/50">Products at or under this price ship free. 0 = charge on every order.</p>
          </div>
          <div>
            <label className="label">Tax rate %</label>
            <input name="tax_rate" type="number" step="0.01" min="0" max="100" className="input" defaultValue={settings.tax_rate} />
            <p className="mt-1 text-xs text-ink/50">Stripe &amp; bank transfer. Paddle adds tax itself.</p>
          </div>
        </div>
        {/* The rule in plain words, updating as the admin types */}
        <p className="rounded-md bg-clay-50 px-4 py-3 text-sm text-ink/75">
          {Number(rate) <= 0 ? (
            <>Shipping is <strong>free on every order</strong>.</>
          ) : Number(minPrice) <= 0 ? (
            <>Every order pays <strong>{formatPrice(Number(rate))}</strong> shipping.</>
          ) : (
            <>
              Orders with a product priced over <strong>{formatPrice(Number(minPrice))}</strong> pay <strong>{formatPrice(Number(rate))}</strong> shipping
              (once per order). Orders with only products at {formatPrice(Number(minPrice))} or less ship <strong>free</strong>.
            </>
          )}
        </p>
      </div>

      <div className="flex justify-end border-t border-clay-100 pt-6">
        <button className="btn-primary px-8" disabled={pending}>{pending ? "Saving…" : "Save settings"}</button>
      </div>
    </form>
  );
}
