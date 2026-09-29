import { Star } from "lucide-react";

export default function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="flex" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} className={i <= Math.round(value) ? "fill-clay-600 text-clay-600" : "fill-ink/10 text-transparent"} />
      ))}
    </span>
  );
}
