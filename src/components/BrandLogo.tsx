import { BRAND } from "@/lib/branding";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  /** Emblem image shown beside the name. Empty = name only. */
  logoUrl?: string | null;
  /** Show the full stacked logo (emblem + wordmark) instead, e.g. in the footer. */
  full?: boolean;
  className?: string;
};

export default function BrandLogo({ name, logoUrl, full, className }: Props) {
  if (full && BRAND.logo_full_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={BRAND.logo_full_url} alt={name} className={cn("h-20 w-auto", className)} width={800} height={663} />;
  }
  return (
    <span className={cn("flex min-w-0 items-center gap-2", className)}>
      {logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" aria-hidden className="h-9 w-auto shrink-0 sm:h-10" width={209} height={200} />
      )}
      <span className="truncate font-serif text-xl font-semibold tracking-tight text-[#45221b] sm:text-2xl">{name}</span>
    </span>
  );
}
