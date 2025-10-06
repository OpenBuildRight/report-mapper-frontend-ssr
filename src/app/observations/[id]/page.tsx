import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import Button from '@/components/Button'
import Link from 'next/link'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

async function getObservation(id: string) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/observations/${id}`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching observation:', error)
    return null
  }
}

export default async function ObservationPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/api/auth/signin')
  }

  const { id } = await params
  const observation = await getObservation(id)

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800 rounded-lg shadow-md p-8 border border-gray-700">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-900 rounded-full mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-100 mb-2">Observation Submitted!</h1>
              <p className="text-gray-400">
                Your observation has been successfully submitted.
              </p>
              {observation?.published ? (
                <p className="text-sm text-green-400 mt-2">
                  ✓ Published and visible to all users
                </p>
              ) : (
                <p className="text-sm text-yellow-400 mt-2">
                  ⏳ Awaiting review by a moderator
                </p>
              )}
            </div>

            {observation && (
              <div className="border-t border-gray-700 pt-6 mt-6">
                <h2 className="text-xl font-semibold text-gray-200 mb-4">Observation Details</h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-1">Description</h3>
                    <p className="text-gray-200">{observation.description || 'No description provided'}</p>
                  </div>

                  {observation.location && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-1">Location</h3>
                      <p className="text-gray-200">
                        {observation.location.latitude.toFixed(6)}, {observation.location.longitude.toFixed(6)}
                      </p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-1">Photos</h3>
                    <p className="text-gray-200">
                      {observation.imageIds?.length || 0} photo(s) attached
                    </p>
                    {!observation.imageIds?.length && (
                      <p className="text-sm text-gray-500 mt-1">
                        Note: Photo upload will be available once MinIO is configured
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-1">Submitted</h3>
                    <p className="text-gray-200">
                      {new Date(observation.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-gray-700 pt-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-200 mb-4">What would you like to do next?</h2>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/" className="flex-1">
                  <Button variant="primary" className="w-full">
                    Return to Map
                  </Button>
                </Link>
                <Link href="/observations/new" className="flex-1">
                  <Button variant="secondary" className="w-full">
                    Submit Another Observation
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
