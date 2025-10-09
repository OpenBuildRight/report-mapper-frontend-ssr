import { ObservationRevisionDocument } from '@/types/models'
import { ImageRevisionDocument } from '@/types/models'
import { canEditObservation, canDeleteObservation, canPublishObservation } from '@/lib/rbac'
import { Role } from '@/types/rbac'

/**
 * Helper: Convert Date to ISO string
 */
const toISOString = (date?: Date) => date?.toISOString()

/**
 * Helper: Map GeoJSON Point to lat/lng object
 */
const mapLocation = (location?: { type: 'Point'; coordinates: [number, number] }) => {
  if (!location) return undefined
  return {
    latitude: location.coordinates[1],
    longitude: location.coordinates[0],
  }
}

/**
 * Map observation document to API response
 * Uses spread operator to only specify differences from source document
 */
export function mapObservation(
  obs: ObservationRevisionDocument,
  roles: Role[],
  userId?: string
) {
  return {
    ...obs,
    // Renamed fields
    id: obs.observation_id,
    revisionId: obs.revision_id,
    // Transformed fields
    location: mapLocation(obs.location),
    imageIds: obs.image_ids || [],
    createdAt: obs.created_at.toISOString(),
    revisionCreatedAt: obs.revision_created_at.toISOString(),
    updatedAt: obs.updated_at.toISOString(),
    // Computed fields
    imageUrls: (obs.image_ids || []).map((img: any) =>
      `/api/images/${img.id}/file?revisionId=${img.revision_id}`
    ),
    canEdit: canEditObservation(roles, obs, userId),
    canDelete: canDeleteObservation(roles, obs, userId),
    canPublish: canPublishObservation(roles, obs, userId),
    // Remove old field names
    observation_id: undefined,
    revision_id: undefined,
  }
}

/**
 * Map observation document to API response (for list view without imageUrls)
 * Uses spread operator to only specify differences from source document
 */
export function mapObservationListItem(
  obs: ObservationRevisionDocument,
  roles: Role[],
  userId?: string
) {
  return {
    ...obs,
    // Renamed fields
    id: obs.observation_id,
    revisionId: obs.revision_id,
    // Transformed fields
    location: mapLocation(obs.location),
    imageIds: obs.image_ids || [],
    createdAt: obs.created_at.toISOString(),
    revisionCreatedAt: obs.revision_created_at.toISOString(),
    updatedAt: obs.updated_at.toISOString(),
    // Computed fields
    canEdit: canEditObservation(roles, obs, userId),
    canDelete: canDeleteObservation(roles, obs, userId),
    canPublish: canPublishObservation(roles, obs, userId),
    // Remove old field names
    observation_id: undefined,
    revision_id: undefined,
  }
}

/**
 * Map image document to API response
 * Uses spread operator to only specify differences from source document
 */
export function mapImage(image: ImageRevisionDocument) {
  return {
    ...image,
    // Renamed fields
    revisionId: image.revision_id,
    imageKey: image.image_key,
    // Transformed fields
    location: mapLocation(image.image_metadata_location),
    metadataCreatedAt: toISOString(image.image_metadata_created_at),
    createdAt: image.created_at.toISOString(),
    updatedAt: image.updated_at.toISOString(),
    revisionCreatedAt: image.revision_created_at.toISOString(),
    // Remove old field names
    revision_id: undefined,
    image_key: undefined,
    image_metadata_location: undefined,
    image_metadata_created_at: undefined,
  }
}
