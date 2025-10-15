"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { getPhotoLabel } from "@/lib/photoLabels";
import type { Observation } from "@/types/observation";

const MapComponent = dynamic(() => import("./observation-form/MapComponent"), {
  ssr: false,
});

interface ObservationPopupProps {
  observation: Observation;
  onClose: () => void;
}

export default function ObservationPopup({
  observation,
  onClose,
}: ObservationPopupProps) {
  const photosWithLocation = observation.photos.filter((p) => p.location);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm bg-gray-900 bg-opacity-40"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-100">
              Observation Details
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              By {observation.createdBy.name} •{" "}
              {new Date(observation.createdAt).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Observation Description */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-200 mb-2">
              Description
            </h3>
            <p className="text-gray-300">{observation.description}</p>
          </div>

          {/* Location */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-200 mb-2">
              Location
            </h3>
            <p className="text-gray-400 text-sm">
              {observation.location.latitude.toFixed(6)},{" "}
              {observation.location.longitude.toFixed(6)}
            </p>
          </div>

          {/* Map */}
          {photosWithLocation.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-200 mb-3">Map</h3>
              <MapComponent
                center={observation.location}
                photos={observation.photos.map((p) => ({
                  id: p.id,
                  preview: p.url,
                  description: p.description,
                  location: p.location,
                  file: new File([], ""), // Dummy file for type compatibility
                }))}
                observationLocation={observation.location}
              />
            </div>
          )}

          {/* Photos */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-200 mb-3">
              Photos ({observation.photos.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {observation.photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700"
                >
                  <div className="relative">
                    <img
                      src={photo.url}
                      alt={photo.description || `Photo ${getPhotoLabel(index)}`}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                      {getPhotoLabel(index)}
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm text-gray-300">
                      {photo.description || "No description"}
                    </p>
                    {photo.location && (
                      <p className="text-xs text-gray-500 mt-1">
                        📍 {photo.location.latitude.toFixed(6)},{" "}
                        {photo.location.longitude.toFixed(6)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 transition"
          >
            Close
          </button>
          {observation.canEdit && (
            <Link
              href={`/observations/${observation.id}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Edit Observation
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
