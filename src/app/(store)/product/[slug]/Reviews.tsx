"use client";

import Link from "next/link";
import { useState } from "react";
import type { Review } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import Stars from "./Stars";
import ReviewForm from "./ReviewForm";

type Props = {
  productId: string;
  slug: string;
  reviews: Review[];
  average: number;
  isLoggedIn: boolean;
  hasReviewed: boolean;
  /** True when the viewer has a delivered order containing this product. */
  canReview: boolean;
};

const PAGE = 5;

export default function Reviews({ productId, slug, reviews, average, isLoggedIn, hasReviewed, canReview }: Props) {
  const [writing, setWriting] = useState(false);
  const [shown, setShown] = useState(PAGE);
  const counts = [5, 4, 3, 2, 1].map((star) => ({ star, n: reviews.filter((r) => r.rating === star).length }));

  return (
    <section id="reviews" className="mt-20 scroll-mt-24 border-t border-ink/10 pt-12">
      <h2 className="text-2xl font-semibold tracking-tight">Customer reviews</h2>

      <div className="mt-8 grid gap-10 lg:grid-cols-[300px_1fr] lg:gap-16">
        {/* Summary */}
        <div>
          {reviews.length > 0 ? (
            <>
              <div className="flex items-end gap-3">
                <span className="text-5xl font-semibold tabular-nums leading-none">{average.toFixed(1)}</span>
                <div className="pb-1">
                  <Stars value={average} size={16} />
                  <p className="mt-1 text-xs text-ink/50">
                    Based on {reviews.length} review{reviews.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <ul className="mt-6 space-y-2">
                {counts.map(({ star, n }) => (
                  <li key={star} className="flex items-center gap-3 text-xs text-ink/60">
                    <span className="w-8 tabular-nums">{star} ★</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/10">
                      <span className="block h-full rounded-full bg-clay-600" style={{ width: `${(n / reviews.length) * 100}%` }} />
                    </span>
                    <span className="w-6 text-right tabular-nums">{n}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-ink/60">No reviews yet.</p>
          )}

          <div className="mt-6">
            {hasReviewed ? (
              <p className="rounded-md bg-clay-50 px-4 py-3 text-sm text-ink/60">Thanks — you&apos;ve reviewed this product.</p>
            ) : canReview ? (
              !writing && (
                <button className="btn-outline w-full" onClick={() => setWriting(true)}>
                  Write a review
                </button>
              )
            ) : (
              <p className="rounded-md bg-clay-50 px-4 py-3 text-xs leading-relaxed text-ink/60">
                Reviews come from verified buyers only. You can review this piece once your order has been delivered.
                {!isLoggedIn && (
                  <>
                    {" "}
                    <Link href={`/login?next=/product/${slug}#reviews`} className="font-medium text-ink underline underline-offset-2">
                      Sign in
                    </Link>{" "}
                    if you&apos;ve already received it.
                  </>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Form + list */}
        <div className="min-w-0">
          {writing && canReview && !hasReviewed && (
            <div className="mb-8">
              <ReviewForm productId={productId} slug={slug} onCancel={() => setWriting(false)} onDone={() => setWriting(false)} />
            </div>
          )}

          {reviews.length > 0 && (
            <ul className="divide-y divide-ink/10 border-t border-ink/10">
              {reviews.slice(0, shown).map((r) => (
                <li key={r.id} className="py-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Stars value={r.rating} />
                    <time className="text-xs text-ink/40" dateTime={r.created_at}>{formatDate(r.created_at)}</time>
                  </div>
                  {r.comment && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink/80">{r.comment}</p>}
                  <p className="mt-3 text-xs font-medium text-ink/60">{r.author_name || "Customer"}</p>
                </li>
              ))}
            </ul>
          )}
          {reviews.length > shown && (
            <button className="btn-outline mt-4" onClick={() => setShown((s) => s + PAGE)}>
              Show more reviews
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
