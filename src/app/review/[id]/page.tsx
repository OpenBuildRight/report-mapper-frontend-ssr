'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Button from '@/components/Button'
import Link from 'next/link'

interface Observation {
  id: string
  revisionId: number
  description?: string
  location?: {
    latitude: number
    longitude: number
  }
  imageIds?: any[]
  createdAt: string
  revisionCreatedAt: string
  published: boolean
  submitted: boolean
  owner: string
  canPublish?: boolean
}

export default function ReviewObservationPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = params.id as string
  const revisionId = searchParams.get('revision')

  const [observation, setObservation] = useState<Observation | null>(null)
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchObservation()
  }, [id])

  async function fetchObservation() {
    try {
      const response = await fetch(`/api/observations/${id}${revisionId ? `?revisionId=${revisionId}` : ''}`)

      if (!response.ok) {
        throw new Error('Failed to fetch observation')
      }

      const data = await response.json()
      setObservation(data)
    } catch (err) {
      setError('Failed to load observation')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handlePublish() {
    if (!observation) return

    if (!confirm('Are you sure you want to publish this observation? This will make it visible to all users.')) {
      return
    }

    setPublishing(true)

    try {
      const response = await fetch(`/api/observations/${id}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          revisionId: observation.revisionId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to publish observation')
      }

      alert('Observation published successfully!')
      router.push('/review')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to publish observation')
      console.error(err)
    } finally {
      setPublishing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-400">Loading observation...</p>
        </div>
      </div>
    )
  }

  if (error || !observation) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="max-w-md mx-auto p-8 bg-gray-800 rounded-lg border border-gray-700">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Error</h1>
          <p className="text-gray-300 mb-6">{error || 'Observation not found'}</p>
          <Link href="/review">
            <Button variant="primary">Back to Review List</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <Link href="/review">
              <Button variant="secondary">
                ← Back to Review List
              </Button>
            </Link>
          </div>

          <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                {observation.published ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-900 text-green-200">
                    Published
                  </span>
                ) : observation.submitted ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-900 text-yellow-200">
                    Pending Review
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-700 text-gray-300">
                    Draft
                  </span>
                )}
                <span className="text-sm text-gray-500">
                  Revision #{observation.revisionId}
                </span>
              </div>

              <h1 className="text-3xl font-bold text-gray-100 mb-2">Review Observation</h1>
              <p className="text-gray-400">
                Observation ID: {observation.id}
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-200 mb-2">Description</h2>
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <p className="text-gray-300">
                    {observation.description || 'No description provided'}
                  </p>
                </div>
              </div>

              {observation.location && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-200 mb-2">Location</h2>
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                    <p className="text-gray-300">
                      Latitude: {observation.location.latitude.toFixed(6)}
                    </p>
                    <p className="text-gray-300">
                      Longitude: {observation.location.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-lg font-semibold text-gray-200 mb-2">Photos</h2>
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <p className="text-gray-300">
                    {observation.imageIds?.length || 0} photo(s) attached
                  </p>
                  {!observation.imageIds?.length && (
                    <p className="text-sm text-gray-500 mt-2">
                      No photos attached to this observation
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-200 mb-2">Metadata</h2>
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 space-y-2">
                  <p className="text-gray-300">
                    <span className="text-gray-500">Owner:</span> {observation.owner}
                  </p>
                  <p className="text-gray-300">
                    <span className="text-gray-500">Created:</span>{' '}
                    {new Date(observation.createdAt).toLocaleString()}
                  </p>
                  <p className="text-gray-300">
                    <span className="text-gray-500">This Revision:</span>{' '}
                    {new Date(observation.revisionCreatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-700 flex gap-4">
              {!observation.published && observation.canPublish !== false && (
                <Button
                  variant="primary"
                  onClick={handlePublish}
                  disabled={publishing}
                  className="flex-1"
                >
                  {publishing ? 'Publishing...' : 'Publish Observation'}
                </Button>
              )}
              {observation.published && (
                <div className="flex-1 bg-green-900 border border-green-700 rounded-lg p-4 text-center">
                  <p className="text-green-200 font-medium">
                    This observation is already published
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
