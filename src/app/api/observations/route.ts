import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth, requirePermission, handleAuthError } from '@/lib/middleware/auth'
import { createObservation, getPublishedObservations, getObservationsByOwner } from '@/lib/services/observations'
import { Permission } from '@/types/rbac'
import { hasPermission } from '@/lib/rbac'

/**
 * GET /api/observations
 * Get observations (published for public, own observations for authenticated users)
 */
export async function GET(request: NextRequest) {
  try {
    const context = await getAuthContext()
    const { searchParams } = new URL(request.url)

    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = parseInt(searchParams.get('skip') || '0')

    // Bounding box filter (optional)
    const minLat = searchParams.get('minLat')
    const maxLat = searchParams.get('maxLat')
    const minLng = searchParams.get('minLng')
    const maxLng = searchParams.get('maxLng')

    let boundingBox: any = undefined
    if (minLat && maxLat && minLng && maxLng) {
      boundingBox = {
        minLat: parseFloat(minLat),
        maxLat: parseFloat(maxLat),
        minLng: parseFloat(minLng),
        maxLng: parseFloat(maxLng),
      }
    }

    // Get observations based on permissions
    let observations

    if (searchParams.get('my') === 'true' && context.isAuthenticated) {
      // Get user's own observations
      const includeUnpublished = hasPermission(context.roles, Permission.READ_OWN_OBSERVATIONS)
      observations = await getObservationsByOwner(context.userId!, includeUnpublished)
    } else {
      // Get published observations (anyone can read)
      observations = await getPublishedObservations({
        limit,
        skip,
        boundingBox,
      })
    }

    // Convert to API format
    const apiObservations = observations.map(obs => ({
      id: obs.observation_id,
      revisionId: obs.revision_id,
      description: obs.description,
      location: obs.location ? {
        latitude: obs.location.coordinates[1],
        longitude: obs.location.coordinates[0],
      } : undefined,
      imageIds: obs.image_ids || [],
      createdAt: obs.created_at.toISOString(),
      updatedAt: obs.updated_at.toISOString(),
      published: obs.published,
      submitted: obs.submitted,
      owner: obs.owner,
      canEdit: context.userId === obs.owner,
    }))

    return NextResponse.json({
      observations: apiObservations,
      total: apiObservations.length,
    })
  } catch (error) {
    return handleAuthError(error)
  }
}

/**
 * POST /api/observations
 * Create a new observation
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth()
    const contentType = request.headers.get('content-type')

    let description: string | undefined
    let location: { latitude: number; longitude: number } | undefined
    let imageIds: any[] | undefined
    let autoPublish = false

    // Handle both JSON and FormData
    if (contentType?.includes('application/json')) {
      const body = await request.json()
      description = body.description
      location = body.location
      imageIds = body.imageIds
      autoPublish = body.autoPublish || false
    } else if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData()

      description = formData.get('description') as string

      const latitude = formData.get('latitude') as string
      const longitude = formData.get('longitude') as string

      if (latitude && longitude) {
        location = {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        }
      }

      // For now, we'll create a simple observation without images
      // In the future, files should be uploaded to /api/images first, then referenced here
      imageIds = []

      // TODO: Handle photo uploads - for now we're just ignoring them
      // The proper flow is:
      // 1. Client uploads photos to /api/images
      // 2. Gets back image IDs
      // 3. Submits observation with those image IDs
    }

    // Check if user can auto-publish
    const canAutoPublish = autoPublish && hasPermission(context.roles, Permission.PUBLISH_OWN_OBSERVATIONS)

    const observation = await createObservation({
      description,
      location,
      imageIds,
      owner: context.userId!,
      autoPublish: canAutoPublish,
    })

    return NextResponse.json({
      id: observation.observation_id,
      revisionId: observation.revision_id,
      published: observation.published,
      message: canAutoPublish ? 'Observation published' : 'Observation created, awaiting review',
    }, { status: 201 })
  } catch (error) {
    return handleAuthError(error)
  }
}
