'use client'

import { PhotoWithMetadata } from '@/types/observation'
import Button from '../Button'

interface PhotoCardProps {
  photo: PhotoWithMetadata
  onRemove: (photoId: string) => void
  onUpdateDescription: (photoId: string, description: string) => void
}

export default function PhotoCard({ photo, onRemove, onUpdateDescription }: PhotoCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="relative aspect-video bg-gray-100">
        <img
          src={photo.preview}
          alt="Preview"
          className="w-full h-full object-cover"
        />
        <button
          onClick={() => onRemove(photo.id)}
          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition"
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
          className="w-full border border-gray-300 rounded-md p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
        {photo.location && (
          <div className="mt-2 text-xs text-gray-500">
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
