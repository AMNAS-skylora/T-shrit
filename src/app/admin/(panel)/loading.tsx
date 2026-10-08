export default function AdminLoading() {
  return (
    <div role="status" aria-live="polite" className="space-y-5">
      <span className="sr-only">Loading admin page…</span>
      <div className="h-8 w-48 rounded-lg bg-black/5" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-28 rounded-2xl bg-white ring-1 ring-black/5" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-white ring-1 ring-black/5" />
    </div>
  );
}
