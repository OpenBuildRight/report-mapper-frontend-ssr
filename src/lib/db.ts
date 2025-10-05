import clientPromise from './mongodb'
import { COLLECTIONS, UserDocument, ObservationRevisionDocument, ImageRevisionDocument } from '@/types/models'
import { Db, Collection } from 'mongodb'

let cachedDb: Db | null = null

/**
 * Get MongoDB database instance
 */
export async function getDb(): Promise<Db> {
  if (cachedDb) {
    return cachedDb
  }

  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DATABASE || 'reportmapper')
  cachedDb = db

  return db
}

/**
 * Get users collection
 */
export async function getUsersCollection(): Promise<Collection<UserDocument>> {
  const db = await getDb()
  return db.collection<UserDocument>(COLLECTIONS.USERS)
}

/**
 * Get observation revisions collection
 */
export async function getObservationRevisionsCollection(): Promise<Collection<ObservationRevisionDocument>> {
  const db = await getDb()
  return db.collection<ObservationRevisionDocument>(COLLECTIONS.OBSERVATION_REVISIONS)
}

/**
 * Get image revisions collection
 */
export async function getImageRevisionsCollection(): Promise<Collection<ImageRevisionDocument>> {
  const db = await getDb()
  return db.collection<ImageRevisionDocument>(COLLECTIONS.IMAGE_REVISIONS)
}

/**
 * Initialize database indexes
 */
export async function initializeDatabase() {
  const db = await getDb()

  // Users collection indexes
  await db.collection(COLLECTIONS.USERS).createIndex({ id: 1 }, { unique: true })
  await db.collection(COLLECTIONS.USERS).createIndex({ email: 1 }, { unique: true })

  // Observation revisions indexes
  await db.collection(COLLECTIONS.OBSERVATION_REVISIONS).createIndex({ observation_id: 1, revision_id: 1 }, { unique: true })
  await db.collection(COLLECTIONS.OBSERVATION_REVISIONS).createIndex({ observation_id: 1, published: 1 })
  await db.collection(COLLECTIONS.OBSERVATION_REVISIONS).createIndex({ owner: 1 })
  await db.collection(COLLECTIONS.OBSERVATION_REVISIONS).createIndex({ published: 1 })
  await db.collection(COLLECTIONS.OBSERVATION_REVISIONS).createIndex({ location: '2dsphere' }) // Geospatial index

  // Image revisions indexes
  await db.collection(COLLECTIONS.IMAGE_REVISIONS).createIndex({ id: 1, revision_id: 1 }, { unique: true })
  await db.collection(COLLECTIONS.IMAGE_REVISIONS).createIndex({ id: 1, published: 1 })
  await db.collection(COLLECTIONS.IMAGE_REVISIONS).createIndex({ owner: 1 })
  await db.collection(COLLECTIONS.IMAGE_REVISIONS).createIndex({ image_metadata_location: '2dsphere' }) // Geospatial index

  console.log('Database indexes initialized')
}

/**
 * Get next revision ID for an observation
 */
export async function getNextObservationRevisionId(observationId: string): Promise<number> {
  const collection = await getObservationRevisionsCollection()
  const lastRevision = await collection
    .find({ observation_id: observationId })
    .sort({ revision_id: -1 })
    .limit(1)
    .toArray()

  return lastRevision.length > 0 ? lastRevision[0].revision_id + 1 : 0
}

/**
 * Get next revision ID for an image
 */
export async function getNextImageRevisionId(imageId: string): Promise<number> {
  const collection = await getImageRevisionsCollection()
  const lastRevision = await collection
    .find({ id: imageId })
    .sort({ revision_id: -1 })
    .limit(1)
    .toArray()

  return lastRevision.length > 0 ? lastRevision[0].revision_id + 1 : 0
}
