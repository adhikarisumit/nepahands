/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets a verification build use its own folder without touching a running dev server's .next
  distDir: process.env.NEXT_DIST_DIR || ".next",
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
    // Keep recently visited pages in the browser's router cache for 30s, so pressing
    // Back (e.g. product → shop) shows the page instantly without a refetch or loading
    // skeleton. Admin saves still refresh immediately (revalidatePath clears this cache).
    staleTimes: { dynamic: 30, static: 180 },
  },
  images: {
    // Serve modern formats; next/image resizes per device (see components/SmartImage.tsx)
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
};

export default nextConfig;
