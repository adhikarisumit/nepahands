import Link from "next/link";
import SmartImage from "@/components/SmartImage";
import { BRAND } from "@/lib/branding";

export const metadata = { title: "Our story" };

export default function AboutPage() {
  return (
    <div className="container-x max-w-3xl py-16">
      <p className="eyebrow text-clay-700">Our story</p>
      <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">Handmade felt from Nepal, made one piece at a time.</h1>
      <div className="relative my-10 aspect-[16/9] overflow-hidden rounded-lg bg-clay-50">
        <SmartImage src="/images/felt-coasters.jpg" alt="Handmade wool felt ball coasters" sizes="(min-width: 768px) 768px, 100vw" priority />
      </div>
      <div className="space-y-5 text-lg leading-relaxed text-ink/80">
        <p>
          {BRAND.name} brings handmade felt crafts from Nepal to homes in Australia and beyond — felt ball rugs, coasters, pouches and
          décor made by Nepali artisans.
        </p>
        <p>
          Felting is simple and slow: wool is rolled by hand with warm water and soap until it tightens into dense, soft balls and
          shapes, which are then dried, sorted by colour and stitched together one by one. A single rug can take many hours to
          finish.
        </p>
        <p>
          Because every piece is made by hand, no two are exactly alike. Small differences in colour, size and shape aren&apos;t
          flaws — they&apos;re the mark of the person who made it.
        </p>
      </div>
      <Link href="/shop" className="btn-primary mt-10 px-8 py-3">Shop felt crafts</Link>
    </div>
  );
}
