export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">Welcome to Report Mapper</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-lg text-gray-700 mb-4">
          This is the home page. Use the navigation bar above to access different sections of the application.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-2">Report Observation</h2>
            <p className="text-gray-600">
              Navigate to the Report Observation page to view and manage observations.
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-2">Getting Started</h2>
            <p className="text-gray-600">
              Sign in using the button in the navigation bar to access all features.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
