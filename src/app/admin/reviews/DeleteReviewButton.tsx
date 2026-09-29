"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { deleteReview } from "../actions";

export default function DeleteReviewButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      className="btn-ghost p-2 text-red-600"
      disabled={pending}
      onClick={() =>
        confirm("Delete this review?") &&
        start(async () => {
          const res = await deleteReview(id);
          if (res.error) toast.error(res.error);
          else toast.success("Review deleted");
        })
      }
    >
      <Trash2 size={16} />
    </button>
  );
}
