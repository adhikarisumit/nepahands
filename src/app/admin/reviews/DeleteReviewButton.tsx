"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { deleteReview } from "../actions";
import { deleteOptions, useConfirm } from "@/components/ConfirmDialog";

export default function DeleteReviewButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const confirm = useConfirm();
  return (
    <button
      className="btn-ghost p-2 text-red-600"
      disabled={pending}
      title="Delete review"
      onClick={async () => {
        const ok = await confirm(deleteOptions("this review", "It will be removed from the product page permanently. This can't be undone."));
        if (!ok) return;
        start(async () => {
          const res = await deleteReview(id);
          if (res.error) toast.error(res.error);
          else toast.success("Review deleted");
        });
      }}
    >
      <Trash2 size={16} />
    </button>
  );
}
