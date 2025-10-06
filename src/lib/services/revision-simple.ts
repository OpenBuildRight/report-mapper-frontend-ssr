import { Collection, Filter, UpdateFilter } from 'mongodb'
import { ImageRevisionDocument, ObservationRevisionDocument } from '@/types/models'

/**
 * Simple revision management without complex generics
 * Concrete functions for each entity type
 */

// ============================================
// Observation Revision Functions
// ============================================

export async function getNextObservationRevisionId(
  collection: Collection<ObservationRevisionDocument>,
  observationId: string
): Promise<number> {
  const filter: Filter<ObservationRevisionDocument> = { observation_id: observationId }

  const lastRevision = await collection
    .find(filter)
    .sort({ revision_id: -1 })
    .limit(1)
    .toArray()

  return lastRevision.length > 0 ? lastRevision[0].revision_id + 1 : 0
}

export async function getPublishedObservationRevision(
  collection: Collection<ObservationRevisionDocument>,
  observationId: string
) {
  const filter: Filter<ObservationRevisionDocument> = {
    observation_id: observationId,
    published: true,
  }

  return await collection.findOne(filter)
}

export async function getLatestObservationRevision(
  collection: Collection<ObservationRevisionDocument>,
  observationId: string
) {
  const filter: Filter<ObservationRevisionDocument> = { observation_id: observationId }

  const revisions = await collection
    .find(filter)
    .sort({ revision_id: -1 })
    .limit(1)
    .toArray()

  return revisions.length > 0 ? revisions[0] : null
}

export async function publishObservationRevision(
  collection: Collection<ObservationRevisionDocument>,
  observationId: string,
  revisionId: number
): Promise<void> {
  const unpublishFilter: Filter<ObservationRevisionDocument> = {
    observation_id: observationId,
    published: true
  }

  const unpublishUpdate: UpdateFilter<ObservationRevisionDocument> = {
    $set: { published: false, updated_at: new Date() }
  }

  await collection.updateMany(unpublishFilter, unpublishUpdate)

  const publishFilter: Filter<ObservationRevisionDocument> = {
    observation_id: observationId,
    revision_id: revisionId
  }

  const publishUpdate: UpdateFilter<ObservationRevisionDocument> = {
    $set: { published: true, submitted: true, updated_at: new Date() }
  }

  await collection.updateOne(publishFilter, publishUpdate)
}

export async function submitObservationForReview(
  collection: Collection<ObservationRevisionDocument>,
  observationId: string,
  revisionId: number
): Promise<void> {
  const filter: Filter<ObservationRevisionDocument> = {
    observation_id: observationId,
    revision_id: revisionId
  }

  const update: UpdateFilter<ObservationRevisionDocument> = {
    $set: { submitted: true, updated_at: new Date() }
  }

  await collection.updateOne(filter, update)
}

export async function deleteAllObservationRevisions(
  collection: Collection<ObservationRevisionDocument>,
  observationId: string
): Promise<void> {
  const filter: Filter<ObservationRevisionDocument> = { observation_id: observationId }
  await collection.deleteMany(filter)
}

// ============================================
// Image Revision Functions
// ============================================

export async function getNextImageRevisionId(
  collection: Collection<ImageRevisionDocument>,
  imageId: string
): Promise<number> {
  const filter: Filter<ImageRevisionDocument> = { id: imageId }

  const lastRevision = await collection
    .find(filter)
    .sort({ revision_id: -1 })
    .limit(1)
    .toArray()

  return lastRevision.length > 0 ? lastRevision[0].revision_id + 1 : 0
}

export async function getPublishedImageRevision(
  collection: Collection<ImageRevisionDocument>,
  imageId: string
) {
  const filter: Filter<ImageRevisionDocument> = {
    id: imageId,
    published: true,
  }

  return await collection.findOne(filter)
}

export async function getImageRevision(
  collection: Collection<ImageRevisionDocument>,
  imageId: string,
  revisionId: number
) {
  const filter: Filter<ImageRevisionDocument> = {
    id: imageId,
    revision_id: revisionId,
  }

  return await collection.findOne(filter)
}

export async function publishImageRevision(
  collection: Collection<ImageRevisionDocument>,
  imageId: string,
  revisionId: number
): Promise<void> {
  const unpublishFilter: Filter<ImageRevisionDocument> = {
    id: imageId,
    published: true
  }

  const unpublishUpdate: UpdateFilter<ImageRevisionDocument> = {
    $set: { published: false, updated_at: new Date() }
  }

  await collection.updateMany(unpublishFilter, unpublishUpdate)

  const publishFilter: Filter<ImageRevisionDocument> = {
    id: imageId,
    revision_id: revisionId
  }

  const publishUpdate: UpdateFilter<ImageRevisionDocument> = {
    $set: { published: true, submitted: true, updated_at: new Date() }
  }

  await collection.updateOne(publishFilter, publishUpdate)
}

export async function submitImageForReview(
  collection: Collection<ImageRevisionDocument>,
  imageId: string,
  revisionId: number
): Promise<void> {
  const filter: Filter<ImageRevisionDocument> = {
    id: imageId,
    revision_id: revisionId
  }

  const update: UpdateFilter<ImageRevisionDocument> = {
    $set: { submitted: true, updated_at: new Date() }
  }

  await collection.updateOne(filter, update)
}

export async function deleteAllImageRevisions(
  collection: Collection<ImageRevisionDocument>,
  imageId: string
): Promise<void> {
  const filter: Filter<ImageRevisionDocument> = { id: imageId }
  await collection.deleteMany(filter)
}
