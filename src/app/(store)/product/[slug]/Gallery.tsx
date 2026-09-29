"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SmartImage from "@/components/SmartImage";
import { cn, PLACEHOLDER_IMG } from "@/lib/utils";

export default function Gallery({ images, name }: { images: string[]; name: string }) {
  const list = images?.length ? images : [PLACEHOLDER_IMG];
  const [active, setActive] = useState(0);
  const multiple = list.length > 1;
  const go = (dir: -1 | 1) => setActive((i) => (i + dir + list.length) % list.length);

  return (
    <div className={cn("flex flex-col gap-3", multiple && "lg:flex-row-reverse lg:items-start")}>
      {/* Main image */}
      <div className="group relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-clay-50 sm:aspect-square lg:flex-1">
        <SmartImage src={list[active]} alt={name} sizes="(min-width: 1024px) 55vw, 100vw" priority />
        {multiple && (
          <>
            <button
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm transition hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm transition hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight size={18} />
            </button>
            <span className="absolute bottom-3 right-3 rounded bg-ink/70 px-2 py-0.5 text-xs tabular-nums text-white">
              {active + 1} / {list.length}
            </span>
          </>
        )}
      </div>

      {/* Thumbnails: row on phones, column on desktop */}
      {multiple && (
        <div className="flex gap-2 overflow-x-auto pb-1 lg:w-20 lg:shrink-0 lg:flex-col lg:overflow-visible lg:pb-0">
          {list.map((src, i) => (
            <button
              key={src + i}
              onClick={() => setActive(i)}
              className={cn(
                "relative aspect-square w-16 shrink-0 overflow-hidden rounded-md border transition sm:w-20 lg:w-full",
                i === active ? "border-ink ring-1 ring-ink" : "border-ink/10 opacity-70 hover:opacity-100"
              )}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === active}
            >
              <SmartImage src={src} alt="" sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
