import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatPrice, PLACEHOLDER_IMG } from "@/lib/utils";
import SmartImage from "./SmartImage";

export default function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const onSale = product.compare_at_price && Number(product.compare_at_price) > Number(product.price);
  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-clay-100">
        <SmartImage
          src={product.images?.[0] || PLACEHOLDER_IMG}
          alt={product.name}
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          priority={priority}
          className="transition duration-500 group-hover:scale-105"
        />
        {onSale && <span className="badge absolute left-3 top-3 bg-clay-700 text-white">Sale</span>}
        {product.stock === 0 && <span className="badge absolute right-3 top-3 bg-ink/80 text-white">Sold out</span>}
      </div>
      <div className="mt-3">
        {product.artisan && <p className="text-xs uppercase tracking-wide text-ink/50">{product.artisan}</p>}
        <h3 className="mt-0.5 font-sans text-sm font-medium text-ink group-hover:text-clay-700">{product.name}</h3>
        <div className="mt-1 flex items-center gap-2 text-sm">
          <span className="font-semibold">{formatPrice(product.price)}</span>
          {onSale && <span className="text-ink/40 line-through">{formatPrice(product.compare_at_price!)}</span>}
        </div>
      </div>
    </Link>
  );
}
