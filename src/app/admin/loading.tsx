// Instant feedback while an admin page loads.
export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Loading">
      <div className="h-9 w-48 rounded-lg bg-clay-100" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="card h-24" />
        ))}
      </div>
      <div className="card space-y-3 p-5">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-10 rounded-lg bg-clay-50" />
        ))}
      </div>
    </div>
  );
}
