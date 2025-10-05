'use client'

import { useSession } from 'next-auth/react'
import ObservationForm from '@/components/ObservationForm'

export default function ReportObservation() {
  const { status } = useSession()

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2 text-yellow-200">Authentication Required</h2>
          <p className="text-yellow-300">Please sign in to report observations.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-gray-100">Report Observation</h1>
      <ObservationForm />
    </div>
  )
}
