"use client";

import L from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import MarkerClusterGroup from "../map/MarkerClusterGroup";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getPhotoLabel } from "@/lib/photoLabels";
import type { PhotoWithMetadata } from "@/types/observation";
import ClusterMarker from "../icons/ClusterMarker";
import MapMarkerWithLabel from "../icons/MapMarkerWithLabel";

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom icons - larger observation marker
const observationIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [35, 57],
  iconAnchor: [17, 57],
  popupAnchor: [1, -50],
  shadowSize: [57, 57],
});

interface MapComponentProps {
  center: { latitude: number; longitude: number };
  photos?: PhotoWithMetadata[];
  observationLocation?: { latitude: number; longitude: number } | null;
  onMapClick?: (lat: number, lng: number) => void;
  onPhotoDelete?: (photoId: string) => void;
  onPhotoLocationChange?: (photoId: string, lat: number, lng: number) => void;
  onSetObservationLocation?: (lat: number, lng: number) => void;
  editingPhotoId?: string | null;
  onSelectPhotoLocation?: (photoId: string) => void;
  onStartEditingPhoto?: (photoId: string) => void;
}

function MapClickHandler({
  onMapClick,
  editingPhotoId,
  onPhotoLocationChange,
}: {
  onMapClick?: (lat: number, lng: number) => void;
  editingPhotoId?: string | null;
  onPhotoLocationChange?: (photoId: string, lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (editingPhotoId && onPhotoLocationChange) {
        onPhotoLocationChange(editingPhotoId, e.latlng.lat, e.latlng.lng);
      } else if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

function FitBounds({
  photos,
  observationLocation,
}: {
  photos: PhotoWithMetadata[];
  observationLocation?: { latitude: number; longitude: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    const points: L.LatLngExpression[] = [];

    // Add photo locations
    photos.forEach((photo) => {
      if (photo.location) {
        points.push([photo.location.latitude, photo.location.longitude]);
      }
    });

    // Add observation location
    if (observationLocation) {
      points.push([
        observationLocation.latitude,
        observationLocation.longitude,
      ]);
    }

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);

      // Fit bounds with padding and maxZoom to prevent zooming in too far
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 15, // Don't zoom in further than level 15
      });
    }
  }, [map, photos, observationLocation]);

  return null;
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
  onStartEditingPhoto,
}: MapComponentProps) {
  const photosWithLocation = photos.filter((p) => p.location);

  // Create custom cluster icon
  const createClusterCustomIcon = (cluster: any) => {
    const count = cluster.getChildCount();

    // Determine color based on count
    const getClusterColor = (count: number) => {
      if (count < 10) return "#3b82f6"; // blue
      if (count < 50) return "#8b5cf6"; // purple
      if (count < 100) return "#f97316"; // orange
      return "#ef4444"; // red
    };

    const color = getClusterColor(count);

    // Render React component to HTML string
    const iconHtml = renderToStaticMarkup(
      <ClusterMarker count={count} color={color} />,
    );

    return L.divIcon({
      html: iconHtml,
      className: "custom-cluster-icon",
      iconSize: L.point(40, 40, true),
    });
  };

  return (
    <div className="relative">
      {editingPhotoId && (
        <div className="absolute top-0 left-0 right-0 z-[1000] bg-yellow-900 border-2 border-yellow-600 rounded-t-lg p-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <svg
              className="w-5 h-5 text-yellow-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="font-medium text-yellow-200">
              Click anywhere on the map to set the new location for Photo{" "}
              {photos.find((p) => p.id === editingPhotoId) &&
                getPhotoLabel(
                  photos.indexOf(photos.find((p) => p.id === editingPhotoId)!),
                )}
            </span>
          </div>
        </div>
      )}
      <div
        className={`h-96 w-full rounded-lg overflow-hidden border border-gray-600 ${editingPhotoId ? "rounded-t-none" : ""}`}
      >
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
          <FitBounds
            photos={photosWithLocation}
            observationLocation={observationLocation}
          />

          {/* Photo markers with clustering */}
          <MarkerClusterGroup
            chunkedLoading
            iconCreateFunction={createClusterCustomIcon}
            showCoverageOnHover={false}
            spiderfyOnMaxZoom={true}
            maxClusterRadius={120}
          >
            {photosWithLocation.map((photo) => {
              const label = getPhotoLabel(photos.indexOf(photo));

              // Create custom labeled icon for this photo
              const labeledIconHtml = renderToStaticMarkup(
                <MapMarkerWithLabel
                  label={label}
                  size={40}
                  color="#3b82f6"
                  labelColor="#000000"
                  labelBgColor="#ffffff"
                />,
              );

              const labeledIcon = L.divIcon({
                html: labeledIconHtml,
                className: "custom-photo-marker",
                iconSize: L.point(40, 40, true),
                iconAnchor: L.point(20, 40),
                popupAnchor: L.point(0, -40),
              });

              return (
                <Marker
                  key={photo.id}
                  position={[
                    photo.location!.latitude,
                    photo.location!.longitude,
                  ]}
                  icon={labeledIcon}
                  eventHandlers={{
                    add: (e) => {
                      // Store photoId on the marker when it's added to the map
                      e.target.options.photoId = photo.id;
                    },
                  }}
                >
                  <Popup maxWidth={250}>
                    <div className="p-2">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-blue-600">
                          {label}
                        </span>
                        <span className="text-xs text-gray-500">
                          Photo {label}
                        </span>
                      </div>
                      <img
                        src={photo.preview}
                        alt="Photo preview"
                        className="w-full h-32 object-cover rounded mb-2"
                      />
                      <p className="text-sm mb-2 text-gray-800">
                        {photo.description || "No description"}
                      </p>
                      <p className="text-xs text-gray-600 mb-3">
                        {photo.location!.latitude.toFixed(6)},{" "}
                        {photo.location!.longitude.toFixed(6)}
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
                        {onPhotoLocationChange &&
                          onStartEditingPhoto &&
                          !onSetObservationLocation && (
                            <button
                              onClick={() => onStartEditingPhoto(photo.id)}
                              className="text-xs bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 transition"
                            >
                              {editingPhotoId === photo.id
                                ? "Editing..."
                                : "Edit Location"}
                            </button>
                          )}
                        {onPhotoDelete && !onSetObservationLocation && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onPhotoDelete(photo.id);
                            }}
                            className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                          >
                            Delete Photo
                          </button>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>

          {/* Observation location marker (not clustered) */}
          {observationLocation && (
            <Marker
              position={[
                observationLocation.latitude,
                observationLocation.longitude,
              ]}
              icon={observationIcon}
            >
              <Popup>
                <div className="p-2">
                  <p className="font-semibold text-gray-800 mb-1">
                    Observation Location
                  </p>
                  <p className="text-xs text-gray-600">
                    {observationLocation.latitude.toFixed(6)},{" "}
                    {observationLocation.longitude.toFixed(6)}
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
    </div>
  );
}
