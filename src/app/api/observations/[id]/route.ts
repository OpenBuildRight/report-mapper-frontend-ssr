import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth, handleAuthError } from '@/lib/middleware/auth'
import { getObservationRevisions, deleteObservation, updateObservationRevision, getObservationRevision } from '@/lib/services/observations'
import { canReadObservation, canEditObservation, canDeleteObservation, canPublishObservation } from '@/lib/rbac'
import { canEditEntity, canDeleteEntity } from '@/lib/rbac-generic'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/observations/[id]
 * Get observation revision(s)
 * - If ?revisionId query param provided: return single revision
 * - Otherwise: return all revisions
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const context = await getAuthContext(request)
    const { searchParams } = new URL(request.url)
    const revisionIdParam = searchParams.get('revisionId')

    // If specific revision requested
    if (revisionIdParam) {
      const revisionId = parseInt(revisionIdParam, 10)
      const observation = await getObservationRevision(id, revisionId)

      if (!observation) {
        return NextResponse.json(
          { error: 'Observation revision not found' },
          { status: 404 }
        )
      }

      // Check read permission
      if (!canReadObservation(context.roles, observation, context.userId)) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        )
      }

      return NextResponse.json({
        id: observation.observation_id,
        revisionId: observation.revision_id,
        description: observation.description,
        location: observation.location ? {
          latitude: observation.location.coordinates[1],
          longitude: observation.location.coordinates[0],
        } : undefined,
        imageIds: observation.image_ids || [],
        imageUrls: (observation.image_ids || []).map((img: any) =>
          `/api/images/${img.id}/file?revisionId=${img.revision_id}`
        ),
        createdAt: observation.created_at.toISOString(),
        revisionCreatedAt: observation.revision_created_at.toISOString(),
        updatedAt: observation.updated_at.toISOString(),
        published: observation.published,
        submitted: observation.submitted,
        owner: observation.owner,
        canEdit: canEditObservation(context.roles, observation, context.userId),
        canDelete: canDeleteObservation(context.roles, observation, context.userId),
        canPublish: canPublishObservation(context.roles, observation, context.userId),
      })
    }

    // Otherwise return all revisions
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
      imageUrls: (observation.image_ids || []).map((img: any) =>
        `/api/images/${img.id}/file?revisionId=${img.revision_id}`
      ),
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

/**
 * PATCH /api/observations/[id]
 * Update a specific revision of an observation
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const context = await requireAuth(request)
    const { id } = await params
    const body = await request.json()
    const { revisionId, description, location, imageIds } = body

    if (!revisionId) {
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

    // Check if user can edit this observation
    if (!canEditEntity(context.roles, observation, context.userId)) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this observation' },
        { status: 403 }
      )
    }

    // Update the observation
    await updateObservationRevision(id, revisionId, {
      description,
      location,
      imageIds,
    })

    const updated = await getObservationRevision(id, revisionId)

    return NextResponse.json({
      id: updated!.observation_id,
      revisionId: updated!.revision_id,
      message: 'Observation updated successfully',
    })
  } catch (error) {
    return handleAuthError(error)
  }
}

/**
 * DELETE /api/observations/[id]
 * Delete an observation (all revisions)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const context = await requireAuth(request)
    const { id } = await params

    // Get the latest revision to check permissions
    const revisions = await getObservationRevisions(id)

    if (!revisions || revisions.length === 0) {
      return NextResponse.json(
        { error: 'Observation not found' },
        { status: 404 }
      )
    }

    const latestRevision = revisions[0]

    // Check if user can delete this observation
    if (!canDeleteEntity(context.roles, latestRevision, context.userId)) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this observation' },
        { status: 403 }
      )
    }

    // Delete the observation
    await deleteObservation(id)

    return NextResponse.json({
      message: 'Observation deleted successfully',
      id,
    })
  } catch (error) {
    return handleAuthError(error)
  }
}
