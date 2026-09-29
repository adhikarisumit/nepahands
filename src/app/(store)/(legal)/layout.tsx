import LegalNav from "./LegalNav";

// Shared layout for the hard-coded legal pages: side navigation + readable text column.
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-x py-10 sm:py-14">
      <div className="grid gap-8 lg:grid-cols-[220px_1fr] lg:gap-14">
        <LegalNav />
        <article className="legal min-w-0 max-w-3xl">{children}</article>
      </div>
    </div>
  );
}
