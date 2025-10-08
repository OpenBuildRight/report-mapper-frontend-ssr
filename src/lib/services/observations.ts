import { getObservationRevisionsCollection } from '../db'
import { ObservationRevisionDocument, ImageReference } from '@/types/models'
import { v4 as uuidv4 } from 'uuid'
import {
  getNextObservationRevisionId,
  getPublishedObservationRevision as getPublishedObservationRevisionInternal,
  getLatestObservationRevision as getLatestObservationRevisionInternal,
  publishObservationRevision as publishObservationRevisionInternal,
  submitObservationForReview as submitObservationForReviewInternal,
  deleteAllObservationRevisions,
} from './revision-simple'

export interface CreateObservationInput {
  description?: string
  location?: {
    latitude: number
    longitude: number
  }
  imageIds?: ImageReference[]
  owner: string
  autoPublish?: boolean
  submitted?: boolean
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
    id: observationId,
    observation_id: observationId,
    revision_id: 0,
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
    submitted: input.submitted ?? true, // Default to true if not specified
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
  const currentRevision = await getPublishedObservationRevisionInternal(collection, observationId)
  if (!currentRevision) {
    throw new Error('Observation not found')
  }

  // Verify ownership
  if (currentRevision.owner !== owner) {
    throw new Error('Cannot create revision for observation owned by another user')
  }

  const now = new Date()
  const nextRevisionId = await getNextObservationRevisionId(collection, observationId)

  const revision: ObservationRevisionDocument = {
    id: observationId,
    observation_id: observationId,
    revision_id: nextRevisionId,
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
    submitted: false,
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
) {
  const collection = await getObservationRevisionsCollection()
  return await getPublishedObservationRevisionInternal(collection, observationId)
}

/**
 * Get latest revision of an observation (published or unpublished)
 */
export async function getLatestObservationRevision(
  observationId: string
) {
  const collection = await getObservationRevisionsCollection()
  return await getLatestObservationRevisionInternal(collection, observationId)
}

/**
 * Get all revisions for an observation
 */
export async function getObservationRevisions(
  observationId: string
) {
  const collection = await getObservationRevisionsCollection()
  return await collection
    .find({ observation_id: observationId })
    .sort({ revision_id: -1 })
    .toArray()
}

/**
 * Get specific revision of an observation
 */
export async function getObservationRevision(
  observationId: string,
  revisionId: number
) {
  const collection = await getObservationRevisionsCollection()
  return await collection.findOne({
    observation_id: observationId,
    revision_id: revisionId,
  })
}

/**
 * Get observations with flexible filtering
 */
export async function getObservationsFiltered(
  filters: import('./observation-filters').ObservationFilters,
  context: import('./observation-filters').FilterContext
) {
  const { buildObservationQuery, buildSortCriteria } = await import('./observation-filters')
  const collection = await getObservationRevisionsCollection()

  const query = buildObservationQuery(filters, context)
  const sort = buildSortCriteria(filters)

  let cursor = collection.find(query).sort(sort)

  if (filters.skip) {
    cursor = cursor.skip(filters.skip)
  }

  if (filters.limit) {
    cursor = cursor.limit(filters.limit)
  }

  const results = await cursor.toArray()
  const total = await collection.countDocuments(query)

  return { results, total, query }
}

/**
 * Get all published observations (legacy - kept for backwards compatibility)
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
) {
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
) {
  const collection = await getObservationRevisionsCollection()

  const query: any = { owner }

  if (!includeUnpublished) {
    query.published = true
  }

  return await collection.find(query).toArray()
}

/**
 * Publish an observation revision
 * Also publishes all associated images per REQUIREMENTS.md line 114
 */
export async function publishObservationRevision(
  observationId: string,
  revisionId: number
): Promise<void> {
  const collection = await getObservationRevisionsCollection()

  // Get the observation revision to find its images
  const observation = await collection.findOne({
    observation_id: observationId,
    revision_id: revisionId,
  })

  if (!observation) {
    throw new Error('Observation revision not found')
  }

  // Publish the observation revision
  await publishObservationRevisionInternal(collection, observationId, revisionId)

  // Publish all associated images
  if (observation.image_ids && observation.image_ids.length > 0) {
    const { publishImageRevision } = await import('./images')

    for (const imageRef of observation.image_ids) {
      try {
        await publishImageRevision(imageRef.id, imageRef.revision_id)
      } catch (error) {
        console.error(`Failed to publish image ${imageRef.id} revision ${imageRef.revision_id}:`, error)
        // Continue publishing other images even if one fails
      }
    }
  }
}

/**
 * Submit observation revision for review
 */
export async function submitObservationForReview(
  observationId: string,
  revisionId: number
): Promise<void> {
  const collection = await getObservationRevisionsCollection()
  await submitObservationForReviewInternal(collection, observationId, revisionId)
}

/**
 * Update observation revision metadata
 */
export async function updateObservationRevision(
  observationId: string,
  revisionId: number,
  input: {
    description?: string
    location?: { latitude: number; longitude: number }
    imageIds?: Array<{ id: string; revision_id: number }>
  }
): Promise<void> {
  const collection = await getObservationRevisionsCollection()

  const updateFields: any = {
    updated_at: new Date(),
    revision_updated_at: new Date(),
  }

  if (input.description !== undefined) {
    updateFields.description = input.description
  }

  if (input.location !== undefined) {
    updateFields.location = {
      type: 'Point',
      coordinates: [input.location.longitude, input.location.latitude],
    }
  }

  if (input.imageIds !== undefined) {
    updateFields.image_ids = input.imageIds
  }

  await collection.updateOne(
    { observation_id: observationId, revision_id: revisionId },
    { $set: updateFields }
  )
}

/**
 * Delete a specific observation revision
 */
export async function deleteObservationRevision(
  observationId: string,
  revisionId: number
): Promise<void> {
  const collection = await getObservationRevisionsCollection()
  await collection.deleteOne({
    observation_id: observationId,
    revision_id: revisionId,
  })
}

/**
 * Delete an observation (all revisions)
 */
export async function deleteObservation(observationId: string): Promise<void> {
  const collection = await getObservationRevisionsCollection()
  await deleteAllObservationRevisions(collection, observationId)
}
