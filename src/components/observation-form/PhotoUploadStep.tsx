'use client'

import { PhotoWithMetadata } from '@/types/observation'
import { extractGPSFromImage } from '@/lib/exif'
import PhotoCard from './PhotoCard'

interface PhotoUploadStepProps {
  photos: PhotoWithMetadata[]
  onPhotosChange: (photos: PhotoWithMetadata[]) => void
}

export default function PhotoUploadStep({ photos, onPhotosChange }: PhotoUploadStepProps) {
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

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Upload Photos</h2>
      <p className="text-gray-600 mb-6">
        Add photos of your observation. We'll automatically extract location data if available.
      </p>

      <label className="block mb-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="text-gray-600">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-lg font-medium">Click to upload photos</p>
            <p className="text-sm text-gray-500">or drag and drop</p>
          </div>
        </div>
      </label>

      {photos.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Uploaded Photos ({photos.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {photos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
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
