import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth, handleAuthError } from '@/lib/middleware/auth'
import { createObservation, getObservationsFiltered } from '@/lib/services/observations'
import { parseFiltersFromSearchParams } from '@/lib/services/observation-filters'
import { canEditObservation, canDeleteObservation, canPublishObservation } from '@/lib/rbac'

/**
 * GET /api/observations
 * Get observations with flexible filtering
 */
export async function GET(request: NextRequest) {
  try {
    const context = await getAuthContext(request)
    const { searchParams } = new URL(request.url)

    // Parse filters from search params
    const filters = parseFiltersFromSearchParams(searchParams)

    // Get observations using filter builder
    const { results: observations, total } = await getObservationsFiltered(filters, {
      userId: context.userId,
      roles: context.roles,
    })

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
      revisionCreatedAt: obs.revision_created_at.toISOString(),
      updatedAt: obs.updated_at.toISOString(),
      published: obs.published,
      submitted: obs.submitted,
      owner: obs.owner,
      canEdit: canEditObservation(context.roles, obs, context.userId),
      canDelete: canDeleteObservation(context.roles, obs, context.userId),
      canPublish: canPublishObservation(context.roles, obs, context.userId),
    }))

    return NextResponse.json({
      observations: apiObservations,
      total,
      count: apiObservations.length,
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

    // Handle both JSON and FormData
    if (contentType?.includes('application/json')) {
      const body = await request.json()
      description = body.description
      location = body.location
      imageIds = body.imageIds
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

    const observation = await createObservation({
      description,
      location,
      imageIds,
      owner: context.userId!,
      autoPublish: false,
    })

    return NextResponse.json({
      id: observation.observation_id,
      revisionId: observation.revision_id,
      published: observation.published,
      submitted: observation.submitted,
      message: 'Observation created',
    }, { status: 201 })
  } catch (error) {
    return handleAuthError(error)
  }
}
