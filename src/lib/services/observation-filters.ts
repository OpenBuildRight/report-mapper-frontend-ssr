import { Role } from '@/types/rbac'
import { hasPermission } from '@/lib/rbac'
import { Permission } from '@/types/rbac'

export interface ObservationFilters {
  // Ownership & permissions
  owner?: string
  published?: boolean
  submitted?: boolean

  // Revision specific
  revisionId?: number
  latestOnly?: boolean

  // Geospatial
  nearPoint?: {
    latitude: number
    longitude: number
    maxDistanceMeters?: number
  }
  boundingBox?: {
    minLat: number
    maxLat: number
    minLng: number
    maxLng: number
  }

  // Pagination
  limit?: number
  skip?: number

  // Sorting
  sortBy?: 'created' | 'updated' | 'revisionCreated'
  sortOrder?: 'asc' | 'desc'
}

export interface FilterContext {
  userId?: string
  roles: Role[]
}

/**
 * Build MongoDB query from filters, respecting user permissions
 */
export function buildObservationQuery(
  filters: ObservationFilters,
  context: FilterContext
): any {
  const query: any = {}

  // Apply ownership filter
  if (filters.owner !== undefined) {
    query.owner = filters.owner
  }

  // Apply published filter
  if (filters.published !== undefined) {
    query.published = filters.published
  } else {
    // If no published filter specified, apply default based on permissions
    if (!hasPermission(context.roles, Permission.READ_ALL_OBSERVATIONS)) {
      // Non-moderators can only see published observations (unless they own them)
      if (context.userId && filters.owner === context.userId) {
        // Owner can see their own unpublished observations
      } else {
        query.published = true
      }
    }
  }

  // Apply submitted filter
  if (filters.submitted !== undefined) {
    query.submitted = filters.submitted
  }

  // Apply revision filter
  if (filters.revisionId !== undefined) {
    query.revision_id = filters.revisionId
  }

  // Apply geospatial filters
  if (filters.nearPoint) {
    const { latitude, longitude, maxDistanceMeters = 10000 } = filters.nearPoint
    query.location = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        $maxDistance: maxDistanceMeters,
      },
    }
  } else if (filters.boundingBox) {
    const { minLat, maxLat, minLng, maxLng } = filters.boundingBox
    query.location = {
      $geoWithin: {
        $box: [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
      },
    }
  }

  return query
}

/**
 * Parse filters from URL search params
 */
export function parseFiltersFromSearchParams(searchParams: URLSearchParams): ObservationFilters {
  const filters: ObservationFilters = {}

  // Ownership & permissions
  if (searchParams.has('owner')) {
    filters.owner = searchParams.get('owner')!
  }
  if (searchParams.has('published')) {
    filters.published = searchParams.get('published') === 'true'
  }
  if (searchParams.has('submitted')) {
    filters.submitted = searchParams.get('submitted') === 'true'
  }

  // Revision specific
  if (searchParams.has('revisionId')) {
    const revisionId = parseInt(searchParams.get('revisionId')!)
    if (!isNaN(revisionId)) {
      filters.revisionId = revisionId
    }
  }
  if (searchParams.has('latestOnly')) {
    filters.latestOnly = searchParams.get('latestOnly') === 'true'
  }

  // Geospatial - near point
  if (searchParams.has('lat') && searchParams.has('lng')) {
    const latitude = parseFloat(searchParams.get('lat')!)
    const longitude = parseFloat(searchParams.get('lng')!)
    if (!isNaN(latitude) && !isNaN(longitude)) {
      filters.nearPoint = { latitude, longitude }

      if (searchParams.has('maxDistance')) {
        const maxDistance = parseFloat(searchParams.get('maxDistance')!)
        if (!isNaN(maxDistance)) {
          filters.nearPoint.maxDistanceMeters = maxDistance
        }
      }
    }
  }

  // Geospatial - bounding box
  if (
    searchParams.has('minLat') &&
    searchParams.has('maxLat') &&
    searchParams.has('minLng') &&
    searchParams.has('maxLng')
  ) {
    const minLat = parseFloat(searchParams.get('minLat')!)
    const maxLat = parseFloat(searchParams.get('maxLat')!)
    const minLng = parseFloat(searchParams.get('minLng')!)
    const maxLng = parseFloat(searchParams.get('maxLng')!)

    if (!isNaN(minLat) && !isNaN(maxLat) && !isNaN(minLng) && !isNaN(maxLng)) {
      filters.boundingBox = { minLat, maxLat, minLng, maxLng }
    }
  }

  // Pagination
  if (searchParams.has('limit')) {
    const limit = parseInt(searchParams.get('limit')!)
    if (!isNaN(limit) && limit > 0) {
      filters.limit = Math.min(limit, 1000) // Cap at 1000
    }
  }
  if (searchParams.has('skip')) {
    const skip = parseInt(searchParams.get('skip')!)
    if (!isNaN(skip) && skip >= 0) {
      filters.skip = skip
    }
  }

  // Sorting
  if (searchParams.has('sortBy')) {
    const sortBy = searchParams.get('sortBy')
    if (sortBy === 'created' || sortBy === 'updated' || sortBy === 'revisionCreated') {
      filters.sortBy = sortBy
    }
  }
  if (searchParams.has('sortOrder')) {
    const sortOrder = searchParams.get('sortOrder')
    if (sortOrder === 'asc' || sortOrder === 'desc') {
      filters.sortOrder = sortOrder
    }
  }

  return filters
}

/**
 * Get sort criteria for MongoDB
 */
export function buildSortCriteria(filters: ObservationFilters): any {
  const sortBy = filters.sortBy || 'created'
  const sortOrder = filters.sortOrder === 'asc' ? 1 : -1

  const sortField = {
    created: 'created_at',
    updated: 'updated_at',
    revisionCreated: 'revision_created_at',
  }[sortBy]

  return { [sortField]: sortOrder }
}
