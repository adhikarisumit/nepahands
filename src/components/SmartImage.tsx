import Image from "next/image";
import { cn } from "@/lib/utils";

// Hosts allowed in next.config.mjs → images.remotePatterns
function isOptimizable(src: string) {
  // Files in /public (e.g. "/images/felt-coasters.jpg") are always optimizable
  if (src.startsWith("/") && !src.startsWith("//")) return true;
  try {
    const u = new URL(src);
    if (u.protocol !== "https:") return false;
    if (u.hostname === "images.unsplash.com") return true;
    return u.hostname.endsWith(".supabase.co") && u.pathname.startsWith("/storage/v1/object/public/");
  } catch {
    return false; // data: URLs, relative paths
  }
}

type Props = {
  src: string;
  alt: string;
  /** Rendered width hint for the browser, e.g. "(min-width: 1024px) 25vw, 50vw". */
  sizes: string;
  className?: string;
  /** Above-the-fold images: load immediately instead of lazily. */
  priority?: boolean;
};

/**
 * Fills its (relatively positioned, sized) parent. Known hosts go through next/image
 * (resized per device, WebP/AVIF, lazy by default); any other URL an admin pastes falls back
 * to a plain lazy <img> so it still works without extra config.
 */
export default function SmartImage({ src, alt, sizes, className, priority }: Props) {
  if (isOptimizable(src)) {
    return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={cn("object-cover", className)} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={cn("absolute inset-0 h-full w-full object-cover", className)}
    />
  );
}
