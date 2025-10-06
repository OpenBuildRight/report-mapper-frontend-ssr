import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth, handleAuthError } from '@/lib/middleware/auth'
import { createObservation, getObservationsFiltered } from '@/lib/services/observations'
import { parseFiltersFromSearchParams } from '@/lib/services/observation-filters'
import { canEditObservation, canDeleteObservation, canPublishObservation } from '@/lib/rbac'
import { validateBody } from '@/lib/validation/validate'
import { createObservationSchema } from '@/lib/validation/schemas'

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
    const context = await requireAuth(request)
    const body = await request.json()

    // Validate request body
    const validation = await validateBody(body, createObservationSchema)
    if (!validation.success) {
      return validation.response
    }

    const { description, location, imageIds } = validation.data

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
