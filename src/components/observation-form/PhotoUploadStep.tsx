'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { PhotoWithMetadata } from '@/types/observation'
import { extractGPSFromImage } from '@/lib/exif'
import { getPhotoLabel } from '@/lib/photoLabels'
import PhotoCard from './PhotoCard'

const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false })

interface PhotoUploadStepProps {
  photos: PhotoWithMetadata[]
  onPhotosChange: (photos: PhotoWithMetadata[]) => void
}

export default function PhotoUploadStep({ photos, onPhotosChange }: PhotoUploadStepProps) {
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    const newPhotos = await Promise.all(
      files.map(async (file) => {
        const preview = URL.createObjectURL(file)
        const location = await extractGPSFromImage(file)

        return {
          id: `${Date.now()}-${Math.random()}`,
          file,
          preview,
          description: '',
          location: location || undefined
        }
      })
    )

    onPhotosChange([...photos, ...newPhotos])
  }

  const handleRemovePhoto = (photoId: string) => {
    const photoToRemove = photos.find(p => p.id === photoId)
    if (photoToRemove) {
      URL.revokeObjectURL(photoToRemove.preview)
    }
    onPhotosChange(photos.filter(p => p.id !== photoId))
  }

  const handleUpdateDescription = (photoId: string, description: string) => {
    onPhotosChange(
      photos.map(p => p.id === photoId ? { ...p, description } : p)
    )
  }

  const handlePhotoLocationChange = (photoId: string, lat: number, lng: number) => {
    onPhotosChange(
      photos.map(p => p.id === photoId ? { ...p, location: { latitude: lat, longitude: lng } } : p)
    )
    setEditingPhotoId(null)
  }

  const photosWithLocation = photos.filter(p => p.location)
  const defaultCenter = photosWithLocation.length > 0
    ? photosWithLocation[0].location!
    : { latitude: 0, longitude: 0 }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-gray-100">Upload Photos</h2>
      <p className="text-gray-400 mb-6">
        Add photos of your observation. We'll automatically extract location data if available.
      </p>

      <label className="block mb-6">
        <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition bg-gray-900">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="text-gray-400">
            <svg className="mx-auto h-12 w-12 text-gray-500 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-lg font-medium text-gray-300">Click to upload photos</p>
            <p className="text-sm text-gray-500">or drag and drop</p>
          </div>
        </div>
      </label>

      {photos.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-200">Uploaded Photos ({photos.length})</h3>

          {photosWithLocation.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-300 mb-3">Photo Locations</h4>
              <MapComponent
                center={defaultCenter}
                photos={photos}
                onPhotoDelete={handleRemovePhoto}
                onPhotoLocationChange={handlePhotoLocationChange}
                onStartEditingPhoto={setEditingPhotoId}
                editingPhotoId={editingPhotoId}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {photos.map((photo, index) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                label={getPhotoLabel(index)}
                onRemove={handleRemovePhoto}
                onUpdateDescription={handleUpdateDescription}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
