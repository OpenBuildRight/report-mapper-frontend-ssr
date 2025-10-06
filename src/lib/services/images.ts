import { getImageRevisionsCollection } from '../db'
import { ImageRevisionDocument } from '@/types/models'
import { v4 as uuidv4 } from 'uuid'
import {
  getNextImageRevisionId,
  getPublishedImageRevision as getPublishedImageRevisionInternal,
  getImageRevision as getImageRevisionInternal,
  publishImageRevision as publishImageRevisionInternal,
  submitImageForReview as submitImageForReviewInternal,
  deleteAllImageRevisions,
} from './revision-simple'

export interface CreateImageInput {
  imageKey: string
  description?: string
  location?: {
    latitude: number
    longitude: number
  }
  metadata?: {
    createdAt?: Date
  }
  owner: string
  autoPublish?: boolean
}

export interface UpdateImageInput {
  description?: string
  location?: {
    latitude: number
    longitude: number
  }
}

/**
 * Create a new image with its first revision
 */
export async function createImage(
  input: CreateImageInput
): Promise<ImageRevisionDocument> {
  const collection = await getImageRevisionsCollection()

  const now = new Date()
  const imageId = uuidv4()

  const revision: ImageRevisionDocument = {
    id: imageId,
    revision_id: 0,
    image_key: input.imageKey,
    description: input.description,
    image_metadata_location: input.location ? {
      type: 'Point',
      coordinates: [input.location.longitude, input.location.latitude],
    } : undefined,
    image_metadata_created_at: input.metadata?.createdAt,
    created_at: now,
    updated_at: now,
    revision_created_at: now,
    published: input.autoPublish || false,
    submitted: input.autoPublish || false,
    owner: input.owner,
  }

  await collection.insertOne(revision)
  return revision
}

/**
 * Create a new revision for an existing image
 */
export async function createImageRevision(
  imageId: string,
  input: UpdateImageInput,
  owner: string
): Promise<ImageRevisionDocument> {
  const collection = await getImageRevisionsCollection()

  // Get the current published revision
  const currentRevision = await getPublishedImageRevisionInternal(collection, imageId)
  if (!currentRevision) {
    throw new Error('Image not found')
  }

  // Verify ownership
  if (currentRevision.owner !== owner) {
    throw new Error('Cannot create revision for image owned by another user')
  }

  const now = new Date()
  const nextRevisionId = await getNextImageRevisionId(collection, imageId)

  const revision: ImageRevisionDocument = {
    id: imageId,
    revision_id: nextRevisionId,
    image_key: currentRevision.image_key,
    description: input.description ?? currentRevision.description,
    image_metadata_location: input.location ? {
      type: 'Point',
      coordinates: [input.location.longitude, input.location.latitude],
    } : currentRevision.image_metadata_location,
    image_metadata_created_at: currentRevision.image_metadata_created_at,
    created_at: currentRevision.created_at,
    updated_at: now,
    revision_created_at: now,
    published: false,
    submitted: false,
    owner,
  }

  await collection.insertOne(revision)
  return revision
}

/**
 * Get published revision of an image
 */
export async function getPublishedImageRevision(
  imageId: string
) {
  const collection = await getImageRevisionsCollection()
  return await getPublishedImageRevisionInternal(collection, imageId)
}

/**
 * Get all revisions for an image
 */
export async function getImageRevisions(imageId: string) {
  const collection = await getImageRevisionsCollection()
  return await collection
    .find({ id: imageId })
    .sort({ revision_id: -1 })
    .toArray()
}

/**
 * Get specific image revision
 */
export async function getImageRevision(
  imageId: string,
  revisionId: number
) {
  const collection = await getImageRevisionsCollection()
  return await getImageRevisionInternal(collection, imageId, revisionId)
}

/**
 * Get multiple published images by IDs
 */
export async function getPublishedImagesByIds(
  imageIds: string[]
): Promise<ImageRevisionDocument[]> {
  const collection = await getImageRevisionsCollection()
  return await collection.find({
    id: { $in: imageIds },
    published: true,
  }).toArray()
}

/**
 * Publish an image revision
 */
export async function publishImageRevision(
  imageId: string,
  revisionId: number
): Promise<void> {
  const collection = await getImageRevisionsCollection()
  await publishImageRevisionInternal(collection, imageId, revisionId)
}

/**
 * Submit image revision for review
 */
export async function submitImageForReview(
  imageId: string,
  revisionId: number
): Promise<void> {
  const collection = await getImageRevisionsCollection()
  await submitImageForReviewInternal(collection, imageId, revisionId)
}

/**
 * Delete a specific image revision
 */
export async function deleteImageRevision(
  imageId: string,
  revisionId: number
): Promise<void> {
  const collection = await getImageRevisionsCollection()
  await collection.deleteOne({ id: imageId, revision_id: revisionId })
}

/**
 * Delete an image (all revisions)
 */
export async function deleteImage(imageId: string): Promise<void> {
  const collection = await getImageRevisionsCollection()
  await deleteAllImageRevisions(collection, imageId)
}

/**
 * Update image revision metadata
 */
export async function updateImageRevision(
  imageId: string,
  revisionId: number,
  input: UpdateImageInput
): Promise<void> {
  const collection = await getImageRevisionsCollection()

  const updateDoc: any = {
    updated_at: new Date(),
  }

  if (input.description !== undefined) {
    updateDoc.description = input.description
  }

  if (input.location !== undefined) {
    updateDoc.image_metadata_location = {
      type: 'Point',
      coordinates: [input.location.longitude, input.location.latitude],
    }
  }

  await collection.updateOne(
    { id: imageId, revision_id: revisionId },
    { $set: updateDoc }
  )
}
