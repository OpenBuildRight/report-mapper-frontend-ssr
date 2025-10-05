import { ObjectId } from 'mongodb'

// Database models matching the requirements

export interface ImageRevisionDocument {
  _id?: ObjectId
  revision_id: number // Auto increments from 0 for each image
  id: string // UUID of image
  image_key: string // Path to object store location
  description?: string
  image_metadata_location?: {
    type: 'Point'
    coordinates: [number, number] // [longitude, latitude]
  }
  image_metadata_created_at?: Date
  updated_at: Date
  created_at: Date
  revision_created_at: Date
  published: boolean
  submitted: boolean
  owner: string // user_id
}

export interface ImageReference {
  id: string // Image UUID
  revision_id: number
}

export interface ObservationRevisionDocument {
  _id?: ObjectId
  revision_id: number // Auto increments from 0 for each observation
  observation_id: string // UUID of observation
  description?: string
  location?: {
    type: 'Point'
    coordinates: [number, number] // [longitude, latitude]
  }
  image_ids?: ImageReference[]
  updated_at: Date
  created_at: Date
  revision_created_at: Date
  revision_updated_at: Date
  published: boolean
  submitted: boolean
  owner: string // user_id
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
