export default function AdminLoading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-64 animate-pulse rounded-md bg-gray-200" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="h-28 animate-pulse rounded-lg border border-gray-200 bg-white"
          />
        ))}
      </div>
    </div>
  );
}
