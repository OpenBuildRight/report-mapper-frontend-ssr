import clientPromise from './mongodb'
import { COLLECTIONS, UserDocument, ObservationRevisionDocument, ImageRevisionDocument } from '@/types/models'
import { Db, Collection } from 'mongodb'

let cachedDb: Db | null = null
let initPromise: Promise<void> | null = null

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

  // Initialize database indexes on first access (idempotent)
  if (!initPromise) {
    initPromise = initializeDatabase()
  }

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
 * Initialize database indexes (idempotent - safe to call multiple times)
 * MongoDB's createIndex will not recreate if index already exists
 */
export async function initializeDatabase() {
  try {
    const db = await getDb()

    // Users collection indexes
    await db.collection(COLLECTIONS.USERS).createIndex({ id: 1 }, { unique: true })
    await db.collection(COLLECTIONS.USERS).createIndex({ email: 1 }, { unique: true })

    // Observation revisions indexes
    await db.collection(COLLECTIONS.OBSERVATION_REVISIONS).createIndex({ observation_id: 1, revision_id: 1 }, { unique: true })
    await db.collection(COLLECTIONS.OBSERVATION_REVISIONS).createIndex({ observation_id: 1, published: 1 })
    await db.collection(COLLECTIONS.OBSERVATION_REVISIONS).createIndex({ owner: 1 })
    await db.collection(COLLECTIONS.OBSERVATION_REVISIONS).createIndex({ published: 1 })
    await db.collection(COLLECTIONS.OBSERVATION_REVISIONS).createIndex({ submitted: 1, published: 1 })
    await db.collection(COLLECTIONS.OBSERVATION_REVISIONS).createIndex({ location: '2dsphere' }) // Geospatial index

    // Image revisions indexes
    await db.collection(COLLECTIONS.IMAGE_REVISIONS).createIndex({ id: 1, revision_id: 1 }, { unique: true })
    await db.collection(COLLECTIONS.IMAGE_REVISIONS).createIndex({ id: 1, published: 1 })
    await db.collection(COLLECTIONS.IMAGE_REVISIONS).createIndex({ owner: 1 })
    await db.collection(COLLECTIONS.IMAGE_REVISIONS).createIndex({ image_metadata_location: '2dsphere' }) // Geospatial index

    console.log('Database indexes initialized successfully')

    // Bootstrap users after indexes are created
    const { bootstrapUsers } = await import('./bootstrap')
    await bootstrapUsers()
  } catch (error) {
    console.error('Error initializing database indexes:', error)
    // Don't throw - allow app to continue even if index creation fails
  }
}

// Revision-specific functions have been moved to src/lib/services/revision.ts
// for DRY implementation across all revisioned entities
