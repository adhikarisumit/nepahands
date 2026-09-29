// Shown instantly while a store page loads, so navigation never feels frozen.
export default function StoreLoading() {
  return (
    <div className="container-x animate-pulse py-10" aria-busy="true" aria-label="Loading">
      <div className="h-9 w-56 rounded-lg bg-clay-100" />
      <div className="mt-3 h-4 w-40 rounded bg-clay-100" />
      <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i}>
            <div className="aspect-square rounded-2xl bg-clay-100" />
            <div className="mt-3 h-3 w-1/3 rounded bg-clay-100" />
            <div className="mt-2 h-4 w-2/3 rounded bg-clay-100" />
            <div className="mt-2 h-4 w-1/4 rounded bg-clay-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
