import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, handleAuthError } from '@/lib/middleware/auth'
import { getLatestObservationRevision, publishObservationRevision } from '@/lib/services/observations'
import { canPublishObservation } from '@/lib/rbac'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * POST /api/observations/[id]/publish
 * Publish an observation revision
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const context = await requireAuth()
    const body = await request.json()

    const { revisionId } = body

    // Get the observation
    const observation = await getLatestObservationRevision(id)
    if (!observation) {
      return NextResponse.json(
        { error: 'Observation not found' },
        { status: 404 }
      )
    }

    // Check publish permission
    if (!canPublishObservation(context.roles, observation, context.userId)) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions to publish' },
        { status: 403 }
      )
    }

    // Publish the revision (defaults to latest if not specified)
    const revIdToPublish = revisionId ?? observation.revision_id
    await publishObservationRevision(id, revIdToPublish)

    return NextResponse.json({
      success: true,
      message: 'Observation published',
      observationId: id,
      revisionId: revIdToPublish,
    })
  } catch (error) {
    return handleAuthError(error)
  }
}
