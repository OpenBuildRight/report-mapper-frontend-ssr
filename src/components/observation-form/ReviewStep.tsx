'use client'

import { ObservationFormData } from '@/types/observation'
import dynamic from 'next/dynamic'

const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false })

interface ReviewStepProps {
  formData: ObservationFormData
}

export default function ReviewStep({ formData }: ReviewStepProps) {
  const defaultCenter = formData.location || formData.photos.find(p => p.location)?.location || { latitude: 0, longitude: 0 }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-gray-100">Review Your Observation</h2>
      <p className="text-gray-400 mb-6">
        Please review all details before submitting.
      </p>

      <div className="space-y-6">
        {/* Description */}
        <div>
          <h3 className="text-lg font-medium mb-2 text-gray-200">Description</h3>
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
            <p className="text-gray-300 whitespace-pre-wrap">{formData.description}</p>
          </div>
        </div>

        {/* Location */}
        {formData.location && (
          <div>
            <h3 className="text-lg font-medium mb-2 text-gray-200">Location</h3>
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4">
              <p className="text-gray-300">
                <span className="font-medium">Coordinates:</span>{' '}
                {formData.location.latitude.toFixed(6)}, {formData.location.longitude.toFixed(6)}
              </p>
            </div>
            <MapComponent
              center={defaultCenter}
              photos={formData.photos}
              observationLocation={formData.location}
            />
          </div>
        )}

        {/* Photos */}
        <div>
          <h3 className="text-lg font-medium mb-2 text-gray-200">Photos ({formData.photos.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.photos.map((photo) => (
              <div key={photo.id} className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
                <div className="relative aspect-video bg-gray-800">
                  <img
                    src={photo.preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  {photo.description && (
                    <p className="text-sm text-gray-300 mb-2">{photo.description}</p>
                  )}
                  {photo.location && (
                    <p className="text-xs text-gray-400">
                      <svg className="inline w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {photo.location.latitude.toFixed(6)}, {photo.location.longitude.toFixed(6)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
