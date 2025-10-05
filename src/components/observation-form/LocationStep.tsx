'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { PhotoWithMetadata } from '@/types/observation'
import { getUserLocation } from '@/lib/exif'
import Button from '../Button'

const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false })

interface LocationStepProps {
  photos: PhotoWithMetadata[]
  location: { latitude: number; longitude: number } | null
  onLocationChange: (location: { latitude: number; longitude: number } | null) => void
  onPhotoLocationChange: (photoId: string, location: { latitude: number; longitude: number } | null) => void
}

export default function LocationStep({
  photos,
  location,
  onLocationChange,
  onPhotoLocationChange
}: LocationStepProps) {
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [manualLatitude, setManualLatitude] = useState('')
  const [manualLongitude, setManualLongitude] = useState('')

  useEffect(() => {
    // Auto-populate location on mount
    if (!location) {
      autoPopulateLocation()
    }
  }, [])

  const autoPopulateLocation = async () => {
    setIsLoadingLocation(true)

    // First, try to get location from first photo with GPS data
    const photoWithLocation = photos.find(p => p.location)
    if (photoWithLocation?.location) {
      onLocationChange(photoWithLocation.location)
      setIsLoadingLocation(false)
      return
    }

    // Fallback to user's device location
    const userLocation = await getUserLocation()
    if (userLocation) {
      onLocationChange(userLocation)
    }

    setIsLoadingLocation(false)
  }

  const handleManualLocationSubmit = () => {
    const lat = parseFloat(manualLatitude)
    const lng = parseFloat(manualLongitude)

    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      onLocationChange({ latitude: lat, longitude: lng })
      setManualLatitude('')
      setManualLongitude('')
    } else {
      alert('Please enter valid coordinates (Latitude: -90 to 90, Longitude: -180 to 180)')
    }
  }

  const handleMapClick = (lat: number, lng: number) => {
    onLocationChange({ latitude: lat, longitude: lng })
  }

  const photoLocations = photos
    .filter(p => p.location)
    .map(p => ({ id: p.id, ...p.location! }))

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Set Observation Location</h2>
      <p className="text-gray-600 mb-6">
        The location has been auto-populated from your photos or device. You can override it by clicking on the map or entering coordinates manually.
      </p>

      {isLoadingLocation && (
        <div className="text-center py-4">
          <p className="text-gray-600">Loading location...</p>
        </div>
      )}

      {location && (
        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-blue-900">Current observation location:</p>
            <p className="text-lg font-semibold text-blue-700">
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </p>
          </div>

          <MapComponent
            center={location}
            markers={[
              { id: 'observation', latitude: location.latitude, longitude: location.longitude, isObservation: true },
              ...photoLocations.map(loc => ({ ...loc, isObservation: false }))
            ]}
            onMapClick={handleMapClick}
          />
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-lg font-medium mb-3">Override Location Manually</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Latitude
            </label>
            <input
              type="number"
              step="any"
              value={manualLatitude}
              onChange={(e) => setManualLatitude(e.target.value)}
              placeholder="-90 to 90"
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Longitude
            </label>
            <input
              type="number"
              step="any"
              value={manualLongitude}
              onChange={(e) => setManualLongitude(e.target.value)}
              placeholder="-180 to 180"
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={handleManualLocationSubmit}
          className="mt-3"
        >
          Set Manual Location
        </Button>
      </div>

      <div className="mt-6">
        <Button
          variant="secondary"
          onClick={autoPopulateLocation}
          disabled={isLoadingLocation}
        >
          Reset to Auto-detected Location
        </Button>
      </div>
    </div>
  )
}
