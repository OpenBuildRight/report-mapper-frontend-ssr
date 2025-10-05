'use client'

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import MarkerClusterGroup from './map/MarkerClusterGroup'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { renderToStaticMarkup } from 'react-dom/server'
import { Observation } from '@/types/observation'
import ClusterMarker from './icons/ClusterMarker'
import { useEffect } from 'react'

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Observation marker icon (green)
const observationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

interface ObservationMapProps {
  observations: Observation[]
  center?: { latitude: number; longitude: number }
  zoom?: number
}

function FitBounds({ observations }: { observations: Observation[] }) {
  const map = useMap()

  useEffect(() => {
    if (observations.length > 0) {
      const bounds = L.latLngBounds(
        observations.map(obs => [obs.location.latitude, obs.location.longitude])
      )
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 15
      })
    }
  }, [map, observations])

  return null
}

export default function ObservationMap({
  observations,
  center = { latitude: 0, longitude: 0 },
  zoom = 2
}: ObservationMapProps) {

  // Create custom cluster icon
  const createClusterCustomIcon = (cluster: any) => {
    const count = cluster.getChildCount()

    const getClusterColor = (count: number) => {
      if (count < 10) return '#10b981' // green
      if (count < 50) return '#3b82f6' // blue
      if (count < 100) return '#8b5cf6' // purple
      return '#ef4444' // red
    }

    const color = getClusterColor(count)

    const iconHtml = renderToStaticMarkup(
      <ClusterMarker count={count} color={color} />
    )

    return L.divIcon({
      html: iconHtml,
      className: 'custom-cluster-icon',
      iconSize: L.point(40, 40, true),
    })
  }

  const defaultCenter = observations.length > 0
    ? observations[0].location
    : center

  return (
    <div className="relative h-screen w-full">
      <div className="absolute inset-0">
        <MapContainer
          center={[defaultCenter.latitude, defaultCenter.longitude]}
          zoom={zoom}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {observations.length > 0 && <FitBounds observations={observations} />}

          <MarkerClusterGroup
            chunkedLoading
            iconCreateFunction={createClusterCustomIcon}
            showCoverageOnHover={false}
            spiderfyOnMaxZoom={true}
            maxClusterRadius={120}
          >
            {observations.map((observation) => (
              <Marker
                key={observation.id}
                position={[observation.location.latitude, observation.location.longitude]}
                icon={observationIcon}
              >
                <Popup maxWidth={400}>
                  <div className="p-2">
                    <p className="font-semibold text-gray-800 mb-2">
                      {observation.description}
                    </p>
                    <p className="text-xs text-gray-600 mb-2">
                      By {observation.createdBy.name} • {new Date(observation.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      📍 {observation.location.latitude.toFixed(6)}, {observation.location.longitude.toFixed(6)}
                    </p>

                    {/* Photo thumbnails */}
                    {observation.photos.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-700 font-semibold mb-1">
                          Photos ({observation.photos.length})
                        </p>
                        <div className="grid grid-cols-3 gap-1">
                          {observation.photos.slice(0, 6).map((photo) => (
                            <img
                              key={photo.id}
                              src={photo.url}
                              alt={photo.description || 'Photo'}
                              className="w-full h-20 object-cover rounded"
                            />
                          ))}
                        </div>
                        {observation.photos.length > 6 && (
                          <p className="text-xs text-gray-500 mt-1">
                            +{observation.photos.length - 6} more
                          </p>
                        )}
                      </div>
                    )}

                    {observation.canEdit && (
                      <button
                        onClick={() => window.location.href = `/observations/${observation.id}/edit`}
                        className="mt-2 text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition w-full"
                      >
                        Edit Observation
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      </div>
    </div>
  )
}
