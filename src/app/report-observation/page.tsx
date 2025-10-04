'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'
import '@app/globals.css'

export default function ReportObservation() {
  const { data: session, status } = useSession()
  const [observations, setObservations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchObservations = async () => {
    setLoading(true)
    setError(null)

    try {
      // Call through BFF proxy - token automatically added server-side
      const response = await fetch('/api/backend/observations')

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`)
      }

      const data = await response.json()
      setObservations(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-gray-700">Please sign in to view report observations.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">Report Observation</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">BFF Pattern Demo</h2>
        <p className="text-gray-700 mb-4">
          This page demonstrates the Backend-for-Frontend (BFF) pattern. When you click the button below:
        </p>
        <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
          <li>Frontend calls <code className="bg-gray-100 px-2 py-1 rounded">/api/backend/observations</code></li>
          <li>Next.js API route retrieves Keycloak token from encrypted server-side session</li>
          <li>Token added to <code className="bg-gray-100 px-2 py-1 rounded">Authorization</code> header</li>
          <li>Request forwarded to Java backend at <code className="bg-gray-100 px-2 py-1 rounded">{'{BACKEND_API_URL}'}/api/observations</code></li>
          <li><strong>OAuth tokens never exposed to browser</strong></li>
        </ul>

        <button
          onClick={fetchObservations}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-gray-400"
        >
          {loading ? 'Loading...' : 'Fetch Observations from Java Backend'}
        </button>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-semibold">Error:</p>
            <p className="text-red-700">{error}</p>
            <p className="text-sm text-red-600 mt-2">
              Make sure your Java backend is running and configured to accept requests from this application.
            </p>
          </div>
        )}

        {observations.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-3">Observations:</h3>
            <div className="space-y-2">
              {observations.map((obs, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 overflow-x-auto">
                    {JSON.stringify(obs, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2">Session Info (for debugging)</h3>
        <p className="text-sm text-gray-700 mb-2">
          <strong>User:</strong> {session?.user?.name || session?.user?.email || 'Unknown'}
        </p>
        <p className="text-sm text-gray-700">
          <strong>Status:</strong> Authenticated via Keycloak
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Note: Access token is stored server-side and never exposed to the browser.
        </p>
      </div>
    </div>
  )
}
