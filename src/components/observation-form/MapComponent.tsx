'use client'

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { renderToStaticMarkup } from 'react-dom/server'
import { PhotoWithMetadata } from '@/types/observation'
import ClusterMarker from '../icons/ClusterMarker'

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Custom icons - larger observation marker
const observationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [35, 57],
  iconAnchor: [17, 57],
  popupAnchor: [1, -50],
  shadowSize: [57, 57]
})

const photoIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

interface MapComponentProps {
  center: { latitude: number; longitude: number }
  photos?: PhotoWithMetadata[]
  observationLocation?: { latitude: number; longitude: number } | null
  onMapClick?: (lat: number, lng: number) => void
  onPhotoDelete?: (photoId: string) => void
  onPhotoLocationChange?: (photoId: string, lat: number, lng: number) => void
  onSetObservationLocation?: (lat: number, lng: number) => void
  editingPhotoId?: string | null
  onSelectPhotoLocation?: (photoId: string) => void
  onStartEditingPhoto?: (photoId: string) => void
}

function MapClickHandler({
  onMapClick,
  editingPhotoId,
  onPhotoLocationChange
}: {
  onMapClick?: (lat: number, lng: number) => void
  editingPhotoId?: string | null
  onPhotoLocationChange?: (photoId: string, lat: number, lng: number) => void
}) {
  useMapEvents({
    click(e) {
      if (editingPhotoId && onPhotoLocationChange) {
        onPhotoLocationChange(editingPhotoId, e.latlng.lat, e.latlng.lng)
      } else if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng)
      }
    },
  })
  return null
}

export default function MapComponent({
  center,
  photos = [],
  observationLocation,
  onMapClick,
  onPhotoDelete,
  onPhotoLocationChange,
  onSetObservationLocation,
  editingPhotoId,
  onSelectPhotoLocation,
  onStartEditingPhoto
}: MapComponentProps) {
  const photosWithLocation = photos.filter(p => p.location)

  // Create custom cluster icon
  const createClusterCustomIcon = (cluster: any) => {
    const count = cluster.getChildCount()

    // Determine color based on count
    const getClusterColor = (count: number) => {
      if (count < 10) return '#3b82f6' // blue
      if (count < 50) return '#8b5cf6' // purple
      if (count < 100) return '#f97316' // orange
      return '#ef4444' // red
    }

    const color = getClusterColor(count)

    // Render React component to HTML string
    const iconHtml = renderToStaticMarkup(
      <ClusterMarker count={count} color={color} />
    )

    return L.divIcon({
      html: iconHtml,
      className: 'custom-cluster-icon',
      iconSize: L.point(40, 40, true),
    })
  }

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden border border-gray-600">
      <MapContainer
        center={[center.latitude, center.longitude]}
        zoom={13}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler
          onMapClick={onMapClick}
          editingPhotoId={editingPhotoId}
          onPhotoLocationChange={onPhotoLocationChange}
        />

        {/* Photo markers with clustering */}
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterCustomIcon}
        >
          {photosWithLocation.map((photo) => (
          <Marker
            key={photo.id}
            position={[photo.location!.latitude, photo.location!.longitude]}
            icon={photoIcon}
          >
            <Popup maxWidth={250}>
              <div className="p-2">
                <img
                  src={photo.preview}
                  alt="Photo preview"
                  className="w-full h-32 object-cover rounded mb-2"
                />
                <p className="text-sm mb-2 text-gray-800">
                  {photo.description || 'No description'}
                </p>
                <p className="text-xs text-gray-600 mb-3">
                  {photo.location!.latitude.toFixed(6)}, {photo.location!.longitude.toFixed(6)}
                </p>

                <div className="flex flex-col gap-2">
                  {onSelectPhotoLocation && (
                    <button
                      onClick={() => onSelectPhotoLocation(photo.id)}
                      className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                    >
                      Use as Observation Location
                    </button>
                  )}
                  {onPhotoLocationChange && onStartEditingPhoto && (
                    <button
                      onClick={() => onStartEditingPhoto(photo.id)}
                      className="text-xs bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 transition"
                    >
                      {editingPhotoId === photo.id ? 'Editing...' : 'Edit Location'}
                    </button>
                  )}
                  {onPhotoDelete && (
                    <button
                      onClick={() => onPhotoDelete(photo.id)}
                      className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                    >
                      Delete Photo
                    </button>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        </MarkerClusterGroup>

        {/* Observation location marker (not clustered) */}
        {observationLocation && (
          <Marker
            position={[observationLocation.latitude, observationLocation.longitude]}
            icon={observationIcon}
          >
            <Popup>
              <div className="p-2">
                <p className="font-semibold text-gray-800 mb-1">Observation Location</p>
                <p className="text-xs text-gray-600">
                  {observationLocation.latitude.toFixed(6)}, {observationLocation.longitude.toFixed(6)}
                </p>
                {onSetObservationLocation && (
                  <p className="text-xs text-gray-500 mt-2">
                    Click on the map to change location
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}
