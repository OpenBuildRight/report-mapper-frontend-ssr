import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, handleAuthError } from '@/lib/middleware/auth'
import { getObservationRevisions } from '@/lib/services/observations'
import { canReadObservation, canEditObservation, canDeleteObservation, canPublishObservation } from '@/lib/rbac'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/observations/[id]
 * Get all revisions for an observation
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const context = await getAuthContext(request)

    const { getObservationRevisions } = await import('@/lib/services/observations')
    const revisions = await getObservationRevisions(id)

    if (!revisions || revisions.length === 0) {
      return NextResponse.json(
        { error: 'Observation not found' },
        { status: 404 }
      )
    }

    // Filter revisions based on permissions
    const visibleRevisions = revisions.filter(rev =>
      canReadObservation(context.roles, rev, context.userId)
    )

    if (visibleRevisions.length === 0) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const formattedRevisions = visibleRevisions.map(observation => ({
      id: observation.observation_id,
      revisionId: observation.revision_id,
      description: observation.description,
      location: observation.location ? {
        latitude: observation.location.coordinates[1],
        longitude: observation.location.coordinates[0],
      } : undefined,
      imageIds: observation.image_ids || [],
      createdAt: observation.created_at.toISOString(),
      revisionCreatedAt: observation.revision_created_at.toISOString(),
      updatedAt: observation.updated_at.toISOString(),
      published: observation.published,
      submitted: observation.submitted,
      owner: observation.owner,
      canEdit: canEditObservation(context.roles, observation, context.userId),
      canDelete: canDeleteObservation(context.roles, observation, context.userId),
      canPublish: canPublishObservation(context.roles, observation, context.userId),
    }))

    return NextResponse.json({
      observationId: id,
      revisions: formattedRevisions,
      total: formattedRevisions.length,
    })
  } catch (error) {
    return handleAuthError(error)
  }
}

