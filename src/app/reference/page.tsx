import Link from 'next/link'

export default function ReferencePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 bg-white sticky top-16 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">API Documentation (Scalar UI)</h1>
            <p className="text-sm text-gray-600 mt-1">Modern API reference interface</p>
          </div>
          <Link
            href="/api-docs"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm"
          >
            Try Swagger UI
          </Link>
        </div>
      </div>
      <iframe
        src="/api/reference"
        className="w-full h-[calc(100vh-144px)] border-0"
        title="Scalar API Reference"
      />
    </div>
  )
}
