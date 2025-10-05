'use client'

import { PhotoWithMetadata } from '@/types/observation'
import Button from '../Button'

interface PhotoCardProps {
  photo: PhotoWithMetadata
  label: string
  onRemove: (photoId: string) => void
  onUpdateDescription: (photoId: string, description: string) => void
}

export default function PhotoCard({ photo, label, onRemove, onUpdateDescription }: PhotoCardProps) {
  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
      <div className="relative aspect-video bg-gray-800">
        <img
          src={photo.preview}
          alt="Preview"
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 left-2 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg">
          {label}
        </div>
        <button
          onClick={() => onRemove(photo.id)}
          className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition"
          title="Remove photo"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-4">
        <textarea
          value={photo.description}
          onChange={(e) => onUpdateDescription(photo.id, e.target.value)}
          placeholder="Add a description for this photo..."
          className="w-full border border-gray-600 bg-gray-800 text-gray-100 rounded-md p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
          rows={3}
        />
        {photo.location && (
          <div className="mt-2 text-xs text-gray-400">
            <svg className="inline w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Location: {photo.location.latitude.toFixed(6)}, {photo.location.longitude.toFixed(6)}
          </div>
        )}
      </div>
    </div>
  )
}
