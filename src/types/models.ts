import { ObjectId } from 'mongodb'

// Base revision document interface (matches RevisionController)
export interface RevisionDocument {
  _id?: ObjectId
  itemId: string
  revisionId: number
  published: boolean
  submitted: boolean
  owner: string
  createdAt?: Date
  updatedAt?: Date
  revisionCreatedAt?: Date
}

/**
 * Image-specific fields
 */
export interface ImageFields {
  imageKey: string // Path to object store location
  description?: string
  location?: {
    type: 'Point'
    coordinates: [number, number] // [longitude, latitude]
  }
  metadataCreatedAt?: Date
}

/**
 * Image Revision - version controlled image entity
 */
export interface ImageRevisionDocument extends RevisionDocument, ImageFields {}

export interface ImageReference {
  id: string // Image UUID
  revisionId: number
}

/**
 * Observation-specific fields
 */
export interface ObservationFields {
  description?: string
  location?: {
    type: 'Point'
    coordinates: [number, number] // [longitude, latitude]
  }
  imageIds?: ImageReference[]
}

/**
 * Observation Revision - version controlled observation entity
 */
export interface ObservationRevisionDocument extends RevisionDocument, ObservationFields {}

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
