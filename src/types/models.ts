import { ObjectId } from 'mongodb'
import { BaseRevision } from './revision'

// Database models matching the requirements

/**
 * Image Revision - version controlled image entity
 */
export interface ImageRevisionDocument extends BaseRevision {
  _id?: ObjectId
  image_key: string // Path to object store location
  description?: string
  image_metadata_location?: {
    type: 'Point'
    coordinates: [number, number] // [longitude, latitude]
  }
  image_metadata_created_at?: Date
}

export interface ImageReference {
  id: string // Image UUID
  revision_id: number
}

/**
 * Observation Revision - version controlled observation entity
 */
export interface ObservationRevisionDocument extends BaseRevision {
  _id?: ObjectId
  observation_id: string // UUID of observation (alias for 'id' field for clarity)
  description?: string
  location?: {
    type: 'Point'
    coordinates: [number, number] // [longitude, latitude]
  }
  image_ids?: ImageReference[]
  revision_updated_at: Date
}

export interface UserDocument {
  _id?: ObjectId
  id: string // UUID
  email: string
  name: string
  password_hash?: string // For local auth
  roles: string[] // Role enum values
  created_at: Date
  updated_at: Date
}

// Collection names
export const COLLECTIONS = {
  IMAGE_REVISIONS: 'image_revisions',
  OBSERVATION_REVISIONS: 'observation_revisions',
  USERS: 'users',
} as const
