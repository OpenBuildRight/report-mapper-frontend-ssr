export default function ObservationsListSkeleton() {
  return (
    <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg z-[1000]">
      <div className="flex items-center gap-2">
        <div className="animate-pulse h-4 w-4 bg-gray-300 rounded-full" />
        <span className="text-sm text-gray-600">Loading observations...</span>
      </div>
    </div>
  );
}
