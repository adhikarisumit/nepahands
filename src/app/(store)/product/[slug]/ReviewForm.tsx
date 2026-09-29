"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import toast from "react-hot-toast";
import { submitReview } from "@/app/(store)/actions";

const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

type Props = { productId: string; slug: string; onCancel: () => void; onDone: () => void };

export default function ReviewForm({ productId, slug, onCancel, onDone }: Props) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [pending, start] = useTransition();
  const shown = hover || rating;

  return (
    <form
      className="rounded-lg border border-ink/10 bg-white p-5 sm:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!rating) return void toast.error("Please choose a star rating");
        start(async () => {
          const res = await submitReview({ productId, slug, rating, comment });
          if (res.error) return void toast.error(res.error);
          toast.success("Thanks for your review!");
          onDone();
        });
      }}
    >
      <h3 className="font-semibold">Write a review</h3>
      <div className="mt-4 flex items-center gap-3">
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              type="button"
              key={i}
              onClick={() => setRating(i)}
              onMouseEnter={() => setHover(i)}
              aria-label={`${i} star${i > 1 ? "s" : ""}`}
              aria-pressed={rating === i}
            >
              <Star size={26} className={i <= shown ? "fill-clay-600 text-clay-600" : "fill-ink/10 text-transparent"} />
            </button>
          ))}
        </div>
        <span className="text-sm text-ink/60">{LABELS[shown] || "Select a rating"}</span>
      </div>
      <label className="label mt-5" htmlFor="review-comment">Your review</label>
      <textarea
        id="review-comment"
        className="input min-h-28"
        placeholder="What did you like about it? How was the quality?"
        value={comment}
        maxLength={2000}
        onChange={(e) => setComment(e.target.value)}
      />
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn-primary px-6" disabled={pending}>{pending ? "Submitting…" : "Submit review"}</button>
      </div>
    </form>
  );
}
