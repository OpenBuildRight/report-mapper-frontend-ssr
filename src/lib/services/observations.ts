import { getObservationRevisionsCollection, getNextObservationRevisionId } from '../db'
import { ObservationRevisionDocument, ImageReference } from '@/types/models'
import { v4 as uuidv4 } from 'uuid'
import { canReadObservation, canEditObservation, canDeleteObservation, canPublishObservation } from '../rbac'
import { Role } from '@/types/rbac'

export interface CreateObservationInput {
  description?: string
  location?: {
    latitude: number
    longitude: number
  }
  imageIds?: ImageReference[]
  owner: string
  autoPublish?: boolean // For validated users
}

export interface UpdateObservationInput {
  description?: string
  location?: {
    latitude: number
    longitude: number
  }
  imageIds?: ImageReference[]
}

/**
 * Create a new observation with its first revision
 */
export async function createObservation(
  input: CreateObservationInput
): Promise<ObservationRevisionDocument> {
  const collection = await getObservationRevisionsCollection()

  const now = new Date()
  const observationId = uuidv4()

  const revision: ObservationRevisionDocument = {
    revision_id: 0,
    observation_id: observationId,
    description: input.description,
    location: input.location ? {
      type: 'Point',
      coordinates: [input.location.longitude, input.location.latitude],
    } : undefined,
    image_ids: input.imageIds,
    created_at: now,
    updated_at: now,
    revision_created_at: now,
    revision_updated_at: now,
    published: input.autoPublish || false,
    submitted: input.autoPublish || false,
    owner: input.owner,
  }

  await collection.insertOne(revision)
  return revision
}

/**
 * Create a new revision for an existing observation
 */
export async function createObservationRevision(
  observationId: string,
  input: UpdateObservationInput,
  owner: string
): Promise<ObservationRevisionDocument> {
  const collection = await getObservationRevisionsCollection()

  // Get the current published revision to use as base
  const currentRevision = await getPublishedObservationRevision(observationId)
  if (!currentRevision) {
    throw new Error('Observation not found')
  }

  // Verify ownership
  if (currentRevision.owner !== owner) {
    throw new Error('Cannot create revision for observation owned by another user')
  }

  const now = new Date()
  const nextRevisionId = await getNextObservationRevisionId(observationId)

  const revision: ObservationRevisionDocument = {
    revision_id: nextRevisionId,
    observation_id: observationId,
    description: input.description ?? currentRevision.description,
    location: input.location ? {
      type: 'Point',
      coordinates: [input.location.longitude, input.location.latitude],
    } : currentRevision.location,
    image_ids: input.imageIds ?? currentRevision.image_ids,
    created_at: currentRevision.created_at,
    updated_at: now,
    revision_created_at: now,
    revision_updated_at: now,
    published: false,
    submitted: false, // Will be set to true when submitted for review
    owner,
  }

  await collection.insertOne(revision)
  return revision
}

/**
 * Get published revision of an observation
 */
export async function getPublishedObservationRevision(
  observationId: string
): Promise<ObservationRevisionDocument | null> {
  const collection = await getObservationRevisionsCollection()
  return await collection.findOne({
    observation_id: observationId,
    published: true,
  })
}

/**
 * Get latest revision of an observation (published or unpublished)
 */
export async function getLatestObservationRevision(
  observationId: string
): Promise<ObservationRevisionDocument | null> {
  const collection = await getObservationRevisionsCollection()
  const revisions = await collection
    .find({ observation_id: observationId })
    .sort({ revision_id: -1 })
    .limit(1)
    .toArray()

  return revisions.length > 0 ? revisions[0] : null
}

/**
 * Get all published observations
 */
export async function getPublishedObservations(
  filter?: {
    limit?: number
    skip?: number
    boundingBox?: {
      minLat: number
      maxLat: number
      minLng: number
      maxLng: number
    }
  }
): Promise<ObservationRevisionDocument[]> {
  const collection = await getObservationRevisionsCollection()

  let query: any = { published: true }

  // Add geospatial filter if bounding box provided
  if (filter?.boundingBox) {
    const { minLat, maxLat, minLng, maxLng } = filter.boundingBox
    query.location = {
      $geoWithin: {
        $box: [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
      },
    }
  }

  const cursor = collection.find(query)

  if (filter?.skip) {
    cursor.skip(filter.skip)
  }

  if (filter?.limit) {
    cursor.limit(filter.limit)
  }

  return await cursor.toArray()
}

/**
 * Get observations by owner
 */
export async function getObservationsByOwner(
  owner: string,
  includeUnpublished = false
): Promise<ObservationRevisionDocument[]> {
  const collection = await getObservationRevisionsCollection()

  const query: any = { owner }

  if (!includeUnpublished) {
    query.published = true
  }

  return await collection.find(query).toArray()
}

/**
 * Publish an observation revision
 */
export async function publishObservationRevision(
  observationId: string,
  revisionId: number
): Promise<void> {
  const collection = await getObservationRevisionsCollection()

  // Unpublish all other revisions
  await collection.updateMany(
    { observation_id: observationId, published: true },
    { $set: { published: false, updated_at: new Date() } }
  )

  // Publish the specified revision
  await collection.updateOne(
    { observation_id: observationId, revision_id: revisionId },
    { $set: { published: true, submitted: true, updated_at: new Date() } }
  )
}

/**
 * Submit observation revision for review
 */
export async function submitObservationForReview(
  observationId: string,
  revisionId: number
): Promise<void> {
  const collection = await getObservationRevisionsCollection()

  await collection.updateOne(
    { observation_id: observationId, revision_id: revisionId },
    { $set: { submitted: true, updated_at: new Date() } }
  )
}

/**
 * Delete an observation (mark all revisions as deleted or actually delete)
 */
export async function deleteObservation(observationId: string): Promise<void> {
  const collection = await getObservationRevisionsCollection()

  // Actually delete all revisions
  await collection.deleteMany({ observation_id: observationId })
}
