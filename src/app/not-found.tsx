import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-7xl font-bold text-clay-300">404</p>
      <h1 className="mt-4 text-3xl font-semibold">Page not found</h1>
      <p className="mt-2 text-ink/60">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <Link href="/" className="btn-primary mt-8">Back home</Link>
    </div>
  );
}
