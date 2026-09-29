import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/utils";
import DeleteReviewButton from "./DeleteReviewButton";

export const metadata = { title: "Reviews" };

type Row = {
  id: string;
  rating: number;
  comment: string | null;
  author_name: string | null;
  created_at: string;
  products: { name: string; slug: string } | null;
};

export default async function AdminReviews() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("reviews")
    .select("id, rating, comment, author_name, created_at, products(name, slug)")
    .order("created_at", { ascending: false })
    .limit(200);
  const reviews = (data ?? []) as unknown as Row[];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Reviews</h1>
      <div className="card overflow-x-auto">
        <table className="table-x">
          <thead><tr><th>Product</th><th>Rating</th><th>Review</th><th>Author</th><th>Date</th><th></th></tr></thead>
          <tbody>
            {reviews.map((r) => (
              <tr key={r.id}>
                <td>{r.products ? <Link href={`/product/${r.products.slug}`} className="hover:text-clay-700">{r.products.name}</Link> : "—"}</td>
                <td className="whitespace-nowrap text-clay-600">{"★".repeat(r.rating)}<span className="text-clay-200">{"★".repeat(5 - r.rating)}</span></td>
                <td className="max-w-md text-ink/70">{r.comment}</td>
                <td>{r.author_name}</td>
                <td className="whitespace-nowrap">{formatDate(r.created_at)}</td>
                <td><DeleteReviewButton id={r.id} /></td>
              </tr>
            ))}
            {reviews.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-ink/50">No reviews yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
