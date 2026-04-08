export default function AdminLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-48 mx-5 mt-5 mb-4" />
      <div className="mx-5 space-y-3">
        <div className="h-10 bg-gray-200 rounded max-w-3xl" />
        <div className="h-10 bg-gray-100 rounded max-w-3xl" />
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-50 rounded" />
        ))}
      </div>
    </div>
  );
}
