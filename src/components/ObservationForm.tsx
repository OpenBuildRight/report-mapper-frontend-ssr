'use client'

import { useState } from 'react'
import { PhotoWithMetadata, ObservationFormData } from '@/types/observation'
import PhotoUploadStep from './observation-form/PhotoUploadStep'
import LocationStep from './observation-form/LocationStep'
import DescriptionStep from './observation-form/DescriptionStep'
import ReviewStep from './observation-form/ReviewStep'
import Button from './Button'

type FormStep = 'photos' | 'location' | 'description' | 'review'

export default function ObservationForm() {
  const [currentStep, setCurrentStep] = useState<FormStep>('photos')
  const [formData, setFormData] = useState<ObservationFormData>({
    description: '',
    location: null,
    photos: []
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updatePhotos = (photos: PhotoWithMetadata[]) => {
    setFormData(prev => ({ ...prev, photos }))
  }

  const updateLocation = (location: { latitude: number; longitude: number } | null) => {
    setFormData(prev => ({ ...prev, location }))
  }

  const updateDescription = (description: string) => {
    setFormData(prev => ({ ...prev, description }))
  }

  const updatePhotoLocation = (photoId: string, location: { latitude: number; longitude: number } | null) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.map(photo =>
        photo.id === photoId ? { ...photo, location: location || undefined } : photo
      )
    }))
  }

  const handleNext = () => {
    if (currentStep === 'photos') {
      setCurrentStep('location')
    } else if (currentStep === 'location') {
      setCurrentStep('description')
    } else if (currentStep === 'description') {
      setCurrentStep('review')
    }
  }

  const handleBack = () => {
    if (currentStep === 'review') {
      setCurrentStep('description')
    } else if (currentStep === 'description') {
      setCurrentStep('location')
    } else if (currentStep === 'location') {
      setCurrentStep('photos')
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      // Step 1: Upload each photo to /api/images
      const imageIds: { id: string; revision_id: number }[] = []

      for (const photo of formData.photos) {
        const photoFormData = new FormData()
        photoFormData.append('file', photo.file)
        photoFormData.append('description', photo.description)

        if (photo.location) {
          photoFormData.append('latitude', photo.location.latitude.toString())
          photoFormData.append('longitude', photo.location.longitude.toString())
        }

        const imageResponse = await fetch('/api/images', {
          method: 'POST',
          body: photoFormData
        })

        if (!imageResponse.ok) {
          throw new Error('Failed to upload photo')
        }

        const imageResult = await imageResponse.json()
        imageIds.push({
          id: imageResult.id,
          revision_id: imageResult.revisionId
        })
      }

      // Step 2: Create observation with image references
      const observationData = {
        description: formData.description,
        location: formData.location,
        imageIds
      }

      const response = await fetch('/api/observations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(observationData)
      })

      if (!response.ok) {
        throw new Error('Failed to submit observation')
      }

      const result = await response.json()

      // Redirect or show success message
      window.location.href = `/observations/${result.id || ''}`
    } catch (error) {
      console.error('Error submitting observation:', error)
      alert('Failed to submit observation. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceed = () => {
    if (currentStep === 'photos') {
      return formData.photos.length > 0
    }
    if (currentStep === 'location') {
      return formData.location !== null
    }
    if (currentStep === 'description') {
      return formData.description.trim().length > 0
    }
    return true
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-8 border border-gray-700">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <div className={`text-sm font-medium ${currentStep === 'photos' ? 'text-blue-400' : 'text-gray-400'}`}>
            1. Photos
          </div>
          <div className={`text-sm font-medium ${currentStep === 'location' ? 'text-blue-400' : 'text-gray-400'}`}>
            2. Location
          </div>
          <div className={`text-sm font-medium ${currentStep === 'description' ? 'text-blue-400' : 'text-gray-400'}`}>
            3. Description
          </div>
          <div className={`text-sm font-medium ${currentStep === 'review' ? 'text-blue-400' : 'text-gray-400'}`}>
            4. Review
          </div>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: currentStep === 'photos' ? '25%' : currentStep === 'location' ? '50%' : currentStep === 'description' ? '75%' : '100%'
            }}
          />
        </div>
      </div>

      {/* Form steps */}
      {currentStep === 'photos' && (
        <PhotoUploadStep photos={formData.photos} onPhotosChange={updatePhotos} />
      )}

      {currentStep === 'location' && (
        <LocationStep
          photos={formData.photos}
          location={formData.location}
          onLocationChange={updateLocation}
          onPhotoLocationChange={updatePhotoLocation}
        />
      )}

      {currentStep === 'description' && (
        <DescriptionStep
          description={formData.description}
          onDescriptionChange={updateDescription}
        />
      )}

      {currentStep === 'review' && (
        <ReviewStep formData={formData} />
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8 pt-6 border-t">
        <Button
          variant="secondary"
          onClick={handleBack}
          disabled={currentStep === 'photos'}
        >
          Back
        </Button>

        {currentStep !== 'review' ? (
          <Button
            variant="primary"
            onClick={handleNext}
            disabled={!canProceed()}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Observation'}
          </Button>
        )}
      </div>
    </div>
  )
}
