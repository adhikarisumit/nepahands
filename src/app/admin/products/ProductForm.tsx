"use client";

import { useState, useTransition } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { saveProduct } from "../actions";
import type { Category, Product } from "@/lib/types";
import { slugify } from "@/lib/utils";

type Props = { product?: Product | null; categories: Category[]; onDone: () => void; onCancel: () => void };

/** Product create/edit form, rendered inside a Modal on the Products page. */
export default function ProductForm({ product, categories, onDone, onCancel }: Props) {
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [pending, start] = useTransition();

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    const supabase = createClient();
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("product-images").upload(path, file, { cacheControl: "31536000" });
        if (error) throw error;
        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        setImages((imgs) => [...imgs, data.publicUrl]);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const move = (i: number, dir: -1 | 1) =>
    setImages((imgs) => {
      const next = [...imgs];
      const j = i + dir;
      if (j < 0 || j >= next.length) return imgs;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const addUrl = () => {
    if (/^https?:\/\//.test(urlInput.trim())) {
      setImages((imgs) => [...imgs, urlInput.trim()]);
      setUrlInput("");
    } else toast.error("Paste a full image URL starting with https://");
  };

  return (
    <form
      action={(fd) => {
        fd.set("images", JSON.stringify(images));
        start(async () => {
          const res = await saveProduct(product?.id ?? null, fd);
          if (res.error) return void toast.error(res.error);
          toast.success(product ? "Product updated" : "Product created");
          onDone();
        });
      }}
    >
      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        {/* Left: details + images */}
        <div className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input
              name="name"
              className="input"
              required
              autoFocus
              defaultValue={product?.name ?? ""}
              onChange={(e) => {
                if (!product) setSlug(slugify(e.target.value));
              }}
            />
          </div>
          <div>
            <label className="label">URL slug</label>
            <input name="slug" className="input" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto-generated" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea name="description" className="input min-h-28" defaultValue={product?.description ?? ""} />
          </div>

          <div>
            <label className="label">Images</label>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {images.map((src, i) => (
                <div key={src + i} className="group relative aspect-square overflow-hidden rounded-lg bg-clay-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  {i === 0 && <span className="badge absolute left-1 top-1 bg-white/90 text-[10px]">Main</span>}
                  <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 p-1 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
                    <button type="button" className="px-1 text-xs text-white" onClick={() => move(i, -1)} aria-label="Move left">←</button>
                    <button type="button" className="text-white" onClick={() => setImages(images.filter((_, j) => j !== i))} aria-label="Remove">
                      <X size={14} />
                    </button>
                    <button type="button" className="px-1 text-xs text-white" onClick={() => move(i, 1)} aria-label="Move right">→</button>
                  </div>
                </div>
              ))}
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-clay-200 text-xs text-ink/50 hover:border-clay-400">
                {uploading ? <Loader2 className="animate-spin" size={18} /> : <ImagePlus size={18} />}
                Upload
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
              </label>
            </div>
            <div className="mt-2 flex gap-2">
              <input
                className="input"
                placeholder="…or paste an image URL"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addUrl();
                  }
                }}
              />
              <button type="button" className="btn-outline shrink-0" onClick={addUrl}>Add</button>
            </div>
          </div>
        </div>

        {/* Right: status, pricing, inventory, maker info */}
        <div className="space-y-4">
          <div className="space-y-3 rounded-xl bg-clay-50 p-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="active" defaultChecked={product?.active ?? true} /> Active (visible in store)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="featured" defaultChecked={product?.featured ?? false} /> Featured on homepage
            </label>
          </div>
          <div>
            <label className="label">Category</label>
            <select name="category_id" className="input" defaultValue={product?.category_id ?? ""}>
              <option value="">— None —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Price *</label>
              <input name="price" type="number" step="0.01" min="0" required className="input" defaultValue={product?.price ?? ""} />
            </div>
            <div>
              <label className="label">Compare-at</label>
              <input name="compare_at_price" type="number" step="0.01" min="0" className="input" defaultValue={product?.compare_at_price ?? ""} />
            </div>
            <div>
              <label className="label">Stock</label>
              <input name="stock" type="number" min="0" className="input" defaultValue={product?.stock ?? 1} />
            </div>
            <div>
              <label className="label">SKU</label>
              <input name="sku" className="input" defaultValue={product?.sku ?? ""} />
            </div>
          </div>
          <div>
            <label className="label">Artisan / maker</label>
            <input name="artisan" className="input" defaultValue={product?.artisan ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Material</label>
              <input name="material" className="input" defaultValue={product?.material ?? ""} />
            </div>
            <div>
              <label className="label">Origin</label>
              <input name="origin" className="input" defaultValue={product?.origin ?? ""} />
            </div>
          </div>
        </div>
      </div>

      {/* Actions stay visible while the modal scrolls */}
      <div className="sticky bottom-0 -mx-6 -mb-6 mt-6 flex justify-end gap-2 border-t border-clay-100 bg-white px-6 py-4">
        <button type="button" className="btn-outline" onClick={onCancel}>Cancel</button>
        <button className="btn-primary px-6" disabled={pending || uploading}>
          {pending ? "Saving…" : product ? "Save changes" : "Create product"}
        </button>
      </div>
    </form>
  );
}
