import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { Suspense } from "react";
import { BRAND } from "@/lib/branding";
import ScrollRestorer from "@/components/ScrollRestorer";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const serif = Playfair_Display({ subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: { default: `${BRAND.name} — ${BRAND.tagline}`, template: `%s | ${BRAND.name}` },
  description: BRAND.meta_description,
  icons: BRAND.favicon_url ? { icon: BRAND.favicon_url } : undefined,
  openGraph: { siteName: BRAND.name, images: [BRAND.hero_image_1] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: browser extensions (e.g. Grammarly) inject attributes into <html>/<body>
    <html lang="en" className={`${sans.variable} ${serif.variable}`} suppressHydrationWarning>
      <body className="font-sans" suppressHydrationWarning>
        {children}
        <Toaster position="bottom-right" />
        {/* Suspense: ScrollRestorer reads search params on the client */}
        <Suspense fallback={null}>
          <ScrollRestorer />
        </Suspense>
      </body>
    </html>
  );
}
