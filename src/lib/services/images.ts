import { getImageRevisionsCollection, getNextImageRevisionId } from '../db'
import { ImageRevisionDocument } from '@/types/models'
import { v4 as uuidv4 } from 'uuid'

export interface CreateImageInput {
  imageKey: string // Path in object store
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
    revision_id: 0,
    id: imageId,
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
  const currentRevision = await getPublishedImageRevision(imageId)
  if (!currentRevision) {
    throw new Error('Image not found')
  }

  // Verify ownership
  if (currentRevision.owner !== owner) {
    throw new Error('Cannot create revision for image owned by another user')
  }

  const now = new Date()
  const nextRevisionId = await getNextImageRevisionId(imageId)

  const revision: ImageRevisionDocument = {
    revision_id: nextRevisionId,
    id: imageId,
    image_key: currentRevision.image_key, // Image file itself doesn't change
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
): Promise<ImageRevisionDocument | null> {
  const collection = await getImageRevisionsCollection()
  return await collection.findOne({
    id: imageId,
    published: true,
  })
}

/**
 * Get specific image revision
 */
export async function getImageRevision(
  imageId: string,
  revisionId: number
): Promise<ImageRevisionDocument | null> {
  const collection = await getImageRevisionsCollection()
  return await collection.findOne({
    id: imageId,
    revision_id: revisionId,
  })
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

  // Unpublish all other revisions
  await collection.updateMany(
    { id: imageId, published: true },
    { $set: { published: false, updated_at: new Date() } }
  )

  // Publish the specified revision
  await collection.updateOne(
    { id: imageId, revision_id: revisionId },
    { $set: { published: true, submitted: true, updated_at: new Date() } }
  )
}

/**
 * Submit image revision for review
 */
export async function submitImageForReview(
  imageId: string,
  revisionId: number
): Promise<void> {
  const collection = await getImageRevisionsCollection()

  await collection.updateOne(
    { id: imageId, revision_id: revisionId },
    { $set: { submitted: true, updated_at: new Date() } }
  )
}

/**
 * Delete an image (all revisions)
 */
export async function deleteImage(imageId: string): Promise<void> {
  const collection = await getImageRevisionsCollection()
  await collection.deleteMany({ id: imageId })
}
