"use client";

import { useState, useTransition } from "react";
import { ArrowRight, ExternalLink, Images, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import ImageUpload from "@/components/ImageUpload";
import Modal from "@/components/Modal";
import { useConfirm } from "@/components/ConfirmDialog";
import { saveHero } from "../actions";
import type { Hero } from "@/lib/homepage";
import { cn } from "@/lib/utils";

type Photo = { src: string; product: string; slug: string; key: string };
type Props = { initial: Hero; defaults: Hero; photos: Photo[]; links: { label: string; href: string }[]; customised: boolean };

export default function HeroForm({ initial, defaults, photos, links, customised }: Props) {
  const [hero, setHero] = useState<Hero>(initial);
  const [picking, setPicking] = useState<"image_1" | "image_2" | null>(null);
  const [pending, start] = useTransition();
  const [dirty, setDirty] = useState(false);
  const confirm = useConfirm();

  const set = <K extends keyof Hero>(k: K, v: Hero[K]) => {
    setHero((h) => ({ ...h, [k]: v }));
    setDirty(true);
  };

  const save = () => {
    const fd = new FormData();
    (Object.keys(hero) as (keyof Hero)[]).forEach((k) => fd.set(k, hero[k]));
    start(async () => {
      const res = await saveHero(fd);
      if (res.error) return void toast.error(res.error);
      toast.success("Homepage updated");
      setDirty(false);
    });
  };

  const reset = async () => {
    const ok = await confirm({
      title: "Reset the homepage hero?",
      message: "Your headline, buttons and featured photos go back to the default content. Your uploaded photos stay in storage.",
      confirmLabel: "Reset",
    });
    if (!ok) return;
    const fd = new FormData();
    fd.set("reset", "1");
    start(async () => {
      const res = await saveHero(fd);
      if (res.error) return void toast.error(res.error);
      setHero(defaults);
      setDirty(false);
      toast.success("Hero reset to default");
    });
  };

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* Form */}
      <div className="space-y-6">
        <section className="card space-y-4 p-5 sm:p-6">
          <h2 className="font-semibold">Text</h2>
          <Field label="Small heading" hint="Short line above the headline, e.g. “Handmade in Nepal”. Leave blank to hide.">
            <input className="input" maxLength={80} value={hero.eyebrow} onChange={(e) => set("eyebrow", e.target.value)} />
          </Field>
          <Field label="Headline *">
            <textarea className="input min-h-[72px]" rows={2} maxLength={160} value={hero.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Intro text">
            <textarea className="input min-h-[72px]" rows={3} maxLength={400} value={hero.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
          </Field>
        </section>

        <section className="card space-y-4 p-5 sm:p-6">
          <h2 className="font-semibold">Buttons</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Main button label *">
              <input className="input" maxLength={40} value={hero.cta_label} onChange={(e) => set("cta_label", e.target.value)} />
            </Field>
            <Field label="Main button link" hint="Pick a suggestion or type a page like /shop">
              <input className="input" list="hero-links" value={hero.cta_link} onChange={(e) => set("cta_link", e.target.value.trim())} />
            </Field>
            <Field label="Second button label" hint="Leave blank to hide the second button.">
              <input className="input" maxLength={40} value={hero.secondary_label} onChange={(e) => set("secondary_label", e.target.value)} />
            </Field>
            <Field label="Second button link">
              <input className="input" list="hero-links" value={hero.secondary_link} onChange={(e) => set("secondary_link", e.target.value.trim())} />
            </Field>
          </div>
          <datalist id="hero-links">
            {links.map((l) => (
              <option key={l.href} value={l.href}>{l.label}</option>
            ))}
          </datalist>
        </section>

        <section className="card space-y-5 p-5 sm:p-6">
          <div>
            <h2 className="font-semibold">Featured photos</h2>
            <p className="text-sm text-ink/60">Portrait photos (3:4) look best. Upload new ones or pick from your product photos.</p>
          </div>
          {(["image_1", "image_2"] as const).map((k, i) => (
            <ImageUpload
              key={k}
              name={k}
              label={`Photo ${i + 1}`}
              folder="homepage"
              previewClass="h-24 w-[72px]"
              value={hero[k]}
              onChange={(v) => set(k, v)}
              actions={
                <button type="button" className="btn-outline px-3 py-1.5 text-xs" onClick={() => setPicking(k)} disabled={!photos.length}>
                  <Images size={14} /> Choose from products
                </button>
              }
            />
          ))}
        </section>

        <div className="sticky bottom-0 z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 bg-[#f7f4f1]/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
          <div className="flex items-center gap-2">
            <button type="button" className="btn-ghost text-sm" onClick={reset} disabled={pending || (!customised && !dirty)}>
              <RotateCcw size={14} /> Reset to default
            </button>
            <a href="/" target="_blank" rel="noopener noreferrer" className="btn-ghost text-sm">
              <ExternalLink size={14} /> <span className="hidden sm:inline">View homepage</span>
            </a>
          </div>
          <div className="flex items-center gap-3">
            {dirty && <span className="text-xs text-amber-700">Unsaved changes</span>}
            <button type="button" className="btn-primary px-8" onClick={save} disabled={pending || !dirty}>
              {pending ? "Saving…" : "Save homepage"}
            </button>
          </div>
        </div>
      </div>

      {/* Live preview */}
      <div className="xl:sticky xl:top-8">
        <p className="eyebrow mb-2">Live preview</p>
        <div className="card overflow-hidden bg-clay-50 p-6">
          <div className="grid items-center gap-6 sm:grid-cols-2">
            <div className="min-w-0">
              {hero.eyebrow && <p className="text-[10px] uppercase tracking-[0.2em] text-clay-600">{hero.eyebrow}</p>}
              <p className="mt-2 break-words text-2xl font-semibold leading-tight">{hero.title || "Your headline"}</p>
              {hero.subtitle && <p className="mt-3 whitespace-pre-line text-xs text-ink/70">{hero.subtitle}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-clay-700 px-3 py-1.5 text-[11px] font-medium text-white">
                  {hero.cta_label || "Button"} <ArrowRight size={11} />
                </span>
                {hero.secondary_label && (
                  <span className="rounded-md border border-ink/15 bg-white px-3 py-1.5 text-[11px] font-medium">{hero.secondary_label}</span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[hero.image_1, hero.image_2].map((src, i) => (
                <div key={i} className={cn("relative aspect-[3/4] overflow-hidden rounded-xl bg-clay-100", i === 1 && "mt-6")}>
                  {src && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Product photo picker */}
      <Modal open={picking !== null} onClose={() => setPicking(null)} title="Choose a product photo" size="xl">
        {photos.length === 0 ? (
          <p className="text-sm text-ink/60">Your products don&apos;t have any photos yet.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            {photos.map((p) => {
              const selected = picking && hero[picking] === p.src;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => {
                    if (picking) set(picking, p.src);
                    setPicking(null);
                  }}
                  className={cn(
                    "group overflow-hidden rounded-lg border text-left transition",
                    selected ? "border-ink ring-2 ring-ink" : "border-ink/10 hover:border-ink/40"
                  )}
                >
                  <div className="aspect-[3/4] bg-clay-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.src} alt="" className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
                  </div>
                  <p className="truncate px-2 py-1.5 text-[11px] text-ink/70">{p.product}</p>
                </button>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-ink/50">{hint}</p>}
    </div>
  );
}
