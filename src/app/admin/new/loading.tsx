export default function NewItemLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-10 bg-slate-200 p-5 mb-4" />
      <div className="p-5 max-w-2xl space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
            <div className="h-10 bg-gray-100 rounded" />
          </div>
        ))}
        <div className="flex space-x-4 mt-5">
          <div className="h-10 bg-gray-200 rounded w-36" />
          <div className="h-10 bg-gray-200 rounded w-56" />
        </div>
      </div>
    </div>
  );
}
