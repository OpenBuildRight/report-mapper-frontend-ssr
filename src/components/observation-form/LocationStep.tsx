"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { getUserLocation } from "@/lib/exif";
import type { PhotoWithMetadata } from "@/types/observation";
import Button from "../Button";

const MapComponent = dynamic(() => import("./MapComponent"), { ssr: false });

interface LocationStepProps {
  photos: PhotoWithMetadata[];
  location: { latitude: number; longitude: number } | null;
  onLocationChange: (
    location: { latitude: number; longitude: number } | null,
  ) => void;
  onPhotoLocationChange: (
    photoId: string,
    location: { latitude: number; longitude: number } | null,
  ) => void;
}

export default function LocationStep({
  photos,
  location,
  onLocationChange,
  onPhotoLocationChange,
}: LocationStepProps) {
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);

  useEffect(() => {
    // Auto-populate location on mount
    if (!location) {
      autoPopulateLocation();
    }
  }, []);

  const autoPopulateLocation = async () => {
    setIsLoadingLocation(true);

    // Calculate centroid of all photos with GPS data
    const photosWithLocation = photos.filter((p) => p.location);
    if (photosWithLocation.length > 0) {
      const avgLat =
        photosWithLocation.reduce((sum, p) => sum + p.location!.latitude, 0) /
        photosWithLocation.length;
      const avgLng =
        photosWithLocation.reduce((sum, p) => sum + p.location!.longitude, 0) /
        photosWithLocation.length;
      onLocationChange({ latitude: avgLat, longitude: avgLng });
      setIsLoadingLocation(false);
      return;
    }

    // Fallback to user's device location
    const userLocation = await getUserLocation();
    if (userLocation) {
      onLocationChange(userLocation);
    }

    setIsLoadingLocation(false);
  };

  const handleMapClick = (lat: number, lng: number) => {
    onLocationChange({ latitude: lat, longitude: lng });
  };

  const handleSelectPhotoLocation = (photoId: string) => {
    const photo = photos.find((p) => p.id === photoId);
    if (photo?.location) {
      onLocationChange(photo.location);
    }
  };

  const handlePhotoLocationEdit = (
    photoId: string,
    lat: number,
    lng: number,
  ) => {
    onPhotoLocationChange(photoId, { latitude: lat, longitude: lng });
    setEditingPhotoId(null);
  };

  const handlePhotoDelete = (photoId: string) => {
    // This will be handled by the parent component through the form
    // For now, we just alert - the actual deletion happens in PhotoUploadStep
    alert("Photo deletion should be done in the photo upload step");
  };

  const defaultCenter = location ||
    photos.find((p) => p.location)?.location || { latitude: 0, longitude: 0 };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-gray-100">
        Set Observation Location
      </h2>
      <p className="text-gray-400 mb-6">
        The location has been set to the center point of your photos. Click on
        the map or a photo marker to adjust it.
      </p>

      {isLoadingLocation && (
        <div className="text-center py-4">
          <p className="text-gray-400">Loading location...</p>
        </div>
      )}

      {location && (
        <div className="mb-6">
          <div className="bg-blue-900 border border-blue-700 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-blue-300">
              Current observation location:
            </p>
            <p className="text-lg font-semibold text-blue-200">
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </p>
            <div className="mt-3 space-y-1">
              <p className="text-xs text-blue-300 flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                  />
                </svg>
                Click anywhere on the map to adjust the observation location
              </p>
              <p className="text-xs text-blue-300 flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Click a photo marker to use that photo's location
              </p>
            </div>
          </div>

          <MapComponent
            center={defaultCenter}
            photos={photos}
            observationLocation={location}
            onMapClick={handleMapClick}
            onSelectPhotoLocation={handleSelectPhotoLocation}
            onPhotoLocationChange={handlePhotoLocationEdit}
            onStartEditingPhoto={setEditingPhotoId}
            onPhotoDelete={handlePhotoDelete}
            editingPhotoId={editingPhotoId}
          />
        </div>
      )}

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
  );
}
