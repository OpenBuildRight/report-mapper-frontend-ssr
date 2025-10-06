import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, handleAuthError } from '@/lib/middleware/auth'
import {
  getLatestObservationRevision,
  createObservationRevision,
  publishObservationRevision,
  submitObservationForReview,
} from '@/lib/services/observations'
import { canEditObservation, canPublishObservation } from '@/lib/rbac'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * POST /api/observations/[id]/revisions
 * Create a new revision of an existing observation
 *
 * This endpoint is specifically for creating a new revision from an existing observation.
 * Access control: Only the owner with edit permission can create a revision.
 *
 * Immutable properties (copied from base observation):
 * - observation_id (stays the same)
 * - created_at (original creation date)
 * - owner (cannot change ownership)
 *
 * Mutable properties (can be changed in the new revision):
 * - description
 * - location
 * - imageIds
 * - published status
 * - submitted status
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const context = await requireAuth(request)
    const body = await request.json()

    // Get the latest revision to check permissions and copy immutable properties
    const baseRevision = await getLatestObservationRevision(id)

    if (!baseRevision) {
      return NextResponse.json(
        { error: 'Observation not found' },
        { status: 404 }
      )
    }

    // Check edit permission - only owner with edit permission can create revisions
    if (!canEditObservation(context.roles, baseRevision, context.userId)) {
      return NextResponse.json(
        {
          error: 'Forbidden - only the owner with edit permission can create a revision of this observation',
          details: {
            isOwner: baseRevision.owner === context.userId,
            hasEditPermission: canEditObservation(context.roles, baseRevision, context.userId),
          }
        },
        { status: 403 }
      )
    }

    const { description, location, imageIds } = body

    // Validate that immutable properties are not being changed
    if (body.observationId && body.observationId !== id) {
      return NextResponse.json(
        { error: 'Cannot change observation ID when creating a revision' },
        { status: 400 }
      )
    }

    if (body.owner && body.owner !== baseRevision.owner) {
      return NextResponse.json(
        { error: 'Cannot change ownership when creating a revision' },
        { status: 400 }
      )
    }

    if (body.createdAt) {
      return NextResponse.json(
        { error: 'Cannot change original creation date when creating a revision' },
        { status: 400 }
      )
    }

    // Create new revision with only mutable properties
    const newRevision = await createObservationRevision(
      id,
      {
        description,
        location,
        imageIds,
      },
      context.userId! // Must be the owner
    )

    // Handle publish/submit actions
    if (body.publish && canPublishObservation(context.roles, baseRevision, context.userId)) {
      await publishObservationRevision(id, newRevision.revision_id)
      newRevision.published = true
    } else if (body.submit) {
      await submitObservationForReview(id, newRevision.revision_id)
      newRevision.submitted = true
    }

    return NextResponse.json({
      id: newRevision.observation_id,
      revisionId: newRevision.revision_id,
      published: newRevision.published,
      submitted: newRevision.submitted,
      message: newRevision.published
        ? 'New revision created and published'
        : newRevision.submitted
          ? 'New revision created and submitted for review'
          : 'New revision created',
      immutableProperties: {
        observationId: newRevision.observation_id,
        createdAt: newRevision.created_at.toISOString(),
        owner: newRevision.owner,
      },
      mutableProperties: {
        description: newRevision.description,
        location: newRevision.location ? {
          latitude: newRevision.location.coordinates[1],
          longitude: newRevision.location.coordinates[0],
        } : undefined,
        imageIds: newRevision.image_ids,
      },
    }, { status: 201 })
  } catch (error) {
    return handleAuthError(error)
  }
}
