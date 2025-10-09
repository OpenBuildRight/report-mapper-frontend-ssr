import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, handleAuthError } from '@/lib/middleware/auth'
import { Permission } from '@/types/rbac'
import { publishObservationRevision, getObservationRevision } from '@/lib/services/observations'
import { canPublishEntity } from '@/lib/rbac-generic'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * POST /api/observations/[id]/publish
 * Publish a specific revision of an observation
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const context = await requirePermission(Permission.PUBLISH_OWN_OBSERVATIONS, request)
    const { id } = await params
    const body = await request.json()
    const { revisionId } = body

    if (revisionId === undefined || revisionId === null) {
      return NextResponse.json(
        { error: 'revisionId is required' },
        { status: 400 }
      )
    }

    // Get the observation to check permissions
    const observation = await getObservationRevision(id, revisionId)

    if (!observation) {
      return NextResponse.json(
        { error: 'Observation not found' },
        { status: 404 }
      )
    }

    // Check if user can publish this specific observation
    if (!canPublishEntity(context.roles, observation, context.userId)) {
      return NextResponse.json(
        { error: 'You do not have permission to publish this observation' },
        { status: 403 }
      )
    }

    // Publish the revision
    await publishObservationRevision(id, revisionId)

    return NextResponse.json({
      success: true,
      message: 'Observation published successfully',
      id,
      revisionId,
    })
  } catch (error) {
    return handleAuthError(error)
  }
}
