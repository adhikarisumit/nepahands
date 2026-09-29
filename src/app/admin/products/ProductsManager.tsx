"use client";

import { useCallback, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Boxes, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "@/components/Modal";
import ProductForm from "./ProductForm";
import { deleteProduct, toggleProduct } from "../actions";
import type { Category, Product } from "@/lib/types";
import { formatPrice, PLACEHOLDER_IMG } from "@/lib/utils";

type Props = { products: Product[]; categories: Category[]; query?: string; initialOpen?: string };

export default function ProductsManager({ products, categories, query, initialOpen }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  // undefined = closed, null = creating, Product = editing.
  // ?new=1 or ?edit=<id> (used by old links/redirects) opens the form on load.
  const [editing, setEditing] = useState<Product | null | undefined>(() =>
    initialOpen === "new" ? null : initialOpen ? products.find((p) => p.id === initialOpen) : undefined
  );
  const [pending, start] = useTransition();

  const close = useCallback(() => {
    setEditing(undefined);
    if (sp.get("new") || sp.get("edit")) {
      const params = new URLSearchParams(sp.toString());
      params.delete("new");
      params.delete("edit");
      router.replace(params.size ? `${pathname}?${params}` : pathname, { scroll: false });
    }
  }, [sp, pathname, router]);

  const run = (fn: () => Promise<{ error?: string }>, msg: string) =>
    start(async () => {
      const res = await fn();
      if (res.error) toast.error(res.error);
      else toast.success(msg);
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Products</h1>
          <p className="mt-1 text-sm text-ink/60">
            {products.length} product{products.length === 1 ? "" : "s"}
            {query && <> matching “{query}”</>}
          </p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <form className="flex-1 sm:flex-none">
            <input name="q" defaultValue={query} placeholder="Search products…" className="input sm:w-56" />
          </form>
          <button className="btn-primary shrink-0" onClick={() => setEditing(null)}>
            <Plus size={16} /> <span className="hidden sm:inline">Add product</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="table-x">
          <thead>
            <tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Active</th><th>Featured</th><th className="w-32"></th></tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-clay-50/60">
                <td>
                  <button className="flex items-center gap-3 text-left hover:text-clay-700" onClick={() => setEditing(p)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.images?.[0] || PLACEHOLDER_IMG} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                    <span className="font-medium">{p.name}</span>
                  </button>
                </td>
                <td>{p.categories?.name ?? "—"}</td>
                <td>
                  {formatPrice(p.price)}
                  {p.compare_at_price && Number(p.compare_at_price) > Number(p.price) && (
                    <span className="ml-1 text-xs text-ink/40 line-through">{formatPrice(p.compare_at_price)}</span>
                  )}
                </td>
                <td className={p.stock === 0 ? "font-semibold text-red-600" : p.stock <= 3 ? "font-semibold text-clay-700" : ""}>{p.stock}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={p.active}
                    disabled={pending}
                    onChange={(e) => run(() => toggleProduct(p.id, "active", e.target.checked), e.target.checked ? "Product is live" : "Product hidden")}
                    aria-label="Active"
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={p.featured}
                    disabled={pending}
                    onChange={(e) => run(() => toggleProduct(p.id, "featured", e.target.checked), "Updated")}
                    aria-label="Featured"
                  />
                </td>
                <td>
                  <div className="flex justify-end gap-1">
                    <a href={`/product/${p.slug}`} target="_blank" rel="noopener noreferrer" className="btn-ghost p-2" title="View in store">
                      <ExternalLink size={16} />
                    </a>
                    <button className="btn-ghost p-2" title="Edit" onClick={() => setEditing(p)}><Pencil size={16} /></button>
                    <button
                      className="btn-ghost p-2 text-red-600"
                      title="Delete"
                      disabled={pending}
                      onClick={() => confirm(`Delete "${p.name}" permanently?`) && run(() => deleteProduct(p.id), "Product deleted")}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <Boxes className="mx-auto text-clay-300" size={32} />
                  <p className="mt-3 text-ink/60">{query ? "No products match your search." : "No products yet."}</p>
                  {!query && (
                    <button className="btn-primary mt-4" onClick={() => setEditing(null)}><Plus size={16} /> Add your first product</button>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={editing !== undefined} onClose={close} title={editing ? `Edit ${editing.name}` : "New product"} size="xl">
        <ProductForm key={editing?.id ?? "new"} product={editing} categories={categories} onDone={close} onCancel={close} />
      </Modal>
    </div>
  );
}
