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

export default async function ObservationPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/api/auth/signin')
  }

  const { id } = await params

  // TODO: Fetch the actual observation from the backend
  // For now, we'll show a success message with the ID

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
              {id && (
                <p className="text-sm text-gray-500 mt-2">
                  Observation ID: {id}
                </p>
              )}
            </div>

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

            {/* TODO: Display observation details here once we can fetch them */}
            <div className="mt-8 p-4 bg-blue-900 border border-blue-700 rounded-lg">
              <p className="text-sm text-blue-200">
                <strong>Note:</strong> Your observation has been sent to the backend for processing.
                Once the backend API is fully implemented, you'll be able to view the complete observation details here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
