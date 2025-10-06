import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth, handleAuthError } from '@/lib/middleware/auth'
import {
  getPublishedObservationRevision,
  getLatestObservationRevision,
  createObservationRevision,
  deleteObservation,
  publishObservationRevision,
  submitObservationForReview,
} from '@/lib/services/observations'
import { getObservationRevisionsCollection } from '@/lib/db'
import { canReadObservation, canEditObservation, canDeleteObservation, canPublishObservation } from '@/lib/rbac'
import { Permission } from '@/types/rbac'
import { hasPermission } from '@/lib/rbac'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/observations/[id]
 * Get a specific observation
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const context = await getAuthContext()
    const { searchParams } = new URL(request.url)
    const revisionIdParam = searchParams.get('revisionId')

    let observation

    if (revisionIdParam) {
      // Get specific revision if requested
      const revisionId = parseInt(revisionIdParam)
      const collection = await getObservationRevisionsCollection()
      observation = await collection.findOne({
        observation_id: id,
        revision_id: revisionId,
      })
    } else {
      // Try to get published version first
      observation = await getPublishedObservationRevision(id)

      // If not found or user has permission, try latest
      if (!observation && context.isAuthenticated) {
        observation = await getLatestObservationRevision(id)
      }
    }

    if (!observation) {
      return NextResponse.json(
        { error: 'Observation not found' },
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
  } catch (error) {
    return handleAuthError(error)
  }
}

/**
 * PUT /api/observations/[id]
 * Update an observation (creates a new revision)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const context = await requireAuth()
    const body = await request.json()

    // Get current observation to check permissions
    const current = await getPublishedObservationRevision(id)
    if (!current) {
      return NextResponse.json(
        { error: 'Observation not found' },
        { status: 404 }
      )
    }

    // Check edit permission
    if (!canEditObservation(context.roles, current, context.userId)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { description, location, imageIds } = body

    // Create new revision
    const revision = await createObservationRevision(
      id,
      { description, location, imageIds },
      context.userId!
    )

    // If user can publish, optionally auto-publish
    if (body.publish && canPublishObservation(context.roles, current, context.userId)) {
      await publishObservationRevision(id, revision.revision_id)
    } else if (body.submit) {
      await submitObservationForReview(id, revision.revision_id)
    }

    return NextResponse.json({
      id: revision.observation_id,
      revisionId: revision.revision_id,
      published: revision.published,
      submitted: revision.submitted,
      message: revision.published ? 'Observation updated and published' : 'Revision created',
    })
  } catch (error) {
    return handleAuthError(error)
  }
}

/**
 * DELETE /api/observations/[id]
 * Delete an observation
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const context = await requireAuth()

    // Get observation to check permissions
    const observation = await getPublishedObservationRevision(id)
    if (!observation) {
      return NextResponse.json(
        { error: 'Observation not found' },
        { status: 404 }
      )
    }

    // Check delete permission
    if (!canDeleteObservation(context.roles, observation, context.userId)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    await deleteObservation(id)

    return NextResponse.json({
      success: true,
      message: 'Observation deleted',
    })
  } catch (error) {
    return handleAuthError(error)
  }
}
