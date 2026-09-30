"use client";

import { useState, useTransition } from "react";
import { FolderTree, Pencil, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "@/components/Modal";
import ImageUpload from "@/components/ImageUpload";
import { deleteOptions, useConfirm } from "@/components/ConfirmDialog";
import { deleteCategory, saveCategory } from "../actions";
import type { Category } from "@/lib/types";
import { PLACEHOLDER_IMG } from "@/lib/utils";

export default function CategoryManager({ categories, counts }: { categories: Category[]; counts: Record<string, number> }) {
  // undefined = closed, null = creating, Category = editing
  const [editing, setEditing] = useState<Category | null | undefined>(undefined);
  const [pending, start] = useTransition();
  const confirm = useConfirm();
  const close = () => setEditing(undefined);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Categories</h1>
          <p className="mt-1 text-sm text-ink/60">{categories.length} categor{categories.length === 1 ? "y" : "ies"}</p>
        </div>
        <button className="btn-primary" onClick={() => setEditing(null)}>
          <Plus size={16} /> Add category
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="table-x">
          <thead>
            <tr><th>Category</th><th>Slug</th><th>Description</th><th>Products</th><th className="w-24"></th></tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="hover:bg-clay-50/60">
                <td>
                  <button className="flex items-center gap-3 text-left hover:text-clay-700" onClick={() => setEditing(c)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.image_url || PLACEHOLDER_IMG} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                    <span className="font-medium">{c.name}</span>
                  </button>
                </td>
                <td className="text-ink/60">{c.slug}</td>
                <td className="max-w-md truncate text-ink/60">{c.description || "—"}</td>
                <td>{counts[c.id] ?? 0}</td>
                <td>
                  <div className="flex justify-end gap-1">
                    <button className="btn-ghost p-2" title="Edit" onClick={() => setEditing(c)}><Pencil size={16} /></button>
                    <button
                      className="btn-ghost p-2 text-red-600"
                      title="Delete"
                      disabled={pending}
                      onClick={async () => {
                        const n = counts[c.id] ?? 0;
                        const ok = await confirm(
                          deleteOptions(
                            `the "${c.name}" category`,
                            n > 0
                              ? `Its ${n} product${n === 1 ? "" : "s"} won't be deleted — they'll just have no category. This can't be undone.`
                              : "This can't be undone."
                          )
                        );
                        if (!ok) return;
                        start(async () => {
                          const res = await deleteCategory(c.id);
                          if (res.error) toast.error(res.error);
                          else toast.success("Category deleted");
                        });
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <FolderTree className="mx-auto text-clay-300" size={32} />
                  <p className="mt-3 text-ink/60">No categories yet.</p>
                  <button className="btn-primary mt-4" onClick={() => setEditing(null)}><Plus size={16} /> Add your first category</button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={editing !== undefined} onClose={close} title={editing ? `Edit ${editing.name}` : "New category"}>
        <form
          key={editing?.id ?? "new"}
          className="space-y-4"
          action={(fd) =>
            start(async () => {
              const res = await saveCategory(editing?.id ?? null, fd);
              if (res.error) return void toast.error(res.error);
              toast.success(editing ? "Category updated" : "Category created");
              close();
            })
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Name *</label>
              <input name="name" className="input" required autoFocus defaultValue={editing?.name} />
            </div>
            <div>
              <label className="label">Slug</label>
              <input name="slug" className="input" defaultValue={editing?.slug} placeholder="auto-generated" />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea name="description" className="input min-h-20" defaultValue={editing?.description ?? ""} />
          </div>
          <ImageUpload name="image_url" label="Image" folder="categories" defaultValue={editing?.image_url ?? ""} previewClass="h-20 w-28" />
          <div className="flex justify-end gap-2 border-t border-clay-100 pt-4">
            <button type="button" className="btn-outline" onClick={close}>Cancel</button>
            <button className="btn-primary px-6" disabled={pending}>{pending ? "Saving…" : editing ? "Save changes" : "Create category"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
