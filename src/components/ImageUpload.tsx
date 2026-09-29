"use client";

import { useState } from "react";
import { ImagePlus, Link2, Loader2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  label: string;
  defaultValue?: string;
  hint?: string;
  folder?: string;
  previewClass?: string;
  onChange?: (url: string) => void;
  /** Controlled mode: when provided, the parent owns the value. */
  value?: string;
  /** Extra buttons shown next to Upload / URL (e.g. "Choose from products"). */
  actions?: React.ReactNode;
};

/** Uploads an image to Supabase Storage (admin-only bucket) and submits its public URL via a hidden input. */
export default function ImageUpload({ name, label, defaultValue = "", hint, folder = "branding", previewClass, onChange, value, actions }: Props) {
  const [inner, setInner] = useState(defaultValue);
  const url = value ?? inner;
  const [uploading, setUploading] = useState(false);
  const [showUrl, setShowUrl] = useState(false);

  const set = (v: string) => {
    if (value === undefined) setInner(v);
    onChange?.(v);
  };

  const upload = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return void toast.error("Choose an image file");
    if (file.size > 5 * 1024 * 1024) return void toast.error("Image must be under 5 MB");
    setUploading(true);
    const supabase = createClient();
    const path = `${folder}/${name}-${Date.now()}.${file.name.split(".").pop() || "png"}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { cacheControl: "31536000" });
    setUploading(false);
    if (error) return void toast.error(error.message);
    set(supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl);
  };

  return (
    <div>
      <label className="label">{label}</label>
      <input type="hidden" name={name} value={url} />
      <div className="flex items-center gap-4">
        <div className={cn("relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-clay-100 bg-clay-50", previewClass ?? "h-20 w-20")}>
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus size={20} className="text-ink/30" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="btn-outline cursor-pointer px-3 py-1.5 text-xs">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
            {url ? "Replace" : "Upload"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
          </label>
          {actions}
          <button type="button" className="btn-ghost px-3 py-1.5 text-xs" onClick={() => setShowUrl((s) => !s)}>
            <Link2 size={14} /> URL
          </button>
          {url && (
            <button type="button" className="btn-ghost px-3 py-1.5 text-xs text-red-600" onClick={() => set("")}>
              <Trash2 size={14} /> Remove
            </button>
          )}
        </div>
      </div>
      {showUrl && <input className="input mt-2" placeholder="https://…" value={url} onChange={(e) => set(e.target.value.trim())} />}
      {hint && <p className="mt-1 text-xs text-ink/50">{hint}</p>}
    </div>
  );
}
