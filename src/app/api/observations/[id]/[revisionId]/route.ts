import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth, handleAuthError } from '@/lib/middleware/auth'
import {
  getObservationRevision,
  publishObservationRevision,
  submitObservationForReview,
} from '@/lib/services/observations'
import { getObservationRevisionsCollection } from '@/lib/db'
import { canReadObservation, canEditObservation, canDeleteObservation, canPublishObservation } from '@/lib/rbac'

interface RouteParams {
  params: Promise<{
    id: string
    revisionId: string
  }>
}

/**
 * GET /api/observations/[id]/[revisionId]
 * Get a specific revision of an observation
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, revisionId: revisionIdStr } = await params
    const context = await getAuthContext(request)
    const revisionId = parseInt(revisionIdStr)

    if (isNaN(revisionId)) {
      return NextResponse.json(
        { error: 'Invalid revision ID' },
        { status: 400 }
      )
    }

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
 * PUT /api/observations/[id]/[revisionId]
 * Update a specific revision (creates metadata update, not a new revision)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, revisionId: revisionIdStr } = await params
    const context = await requireAuth(request)
    const revisionId = parseInt(revisionIdStr)

    if (isNaN(revisionId)) {
      return NextResponse.json(
        { error: 'Invalid revision ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const revision = await getObservationRevision(id, revisionId)

    if (!revision) {
      return NextResponse.json(
        { error: 'Observation revision not found' },
        { status: 404 }
      )
    }

    // Check edit permission
    if (!canEditObservation(context.roles, revision, context.userId)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Update the revision metadata (description, location, images)
    const collection = await getObservationRevisionsCollection()
    const { description, location, imageIds } = body

    const updateFields: any = {
      updated_at: new Date(),
      revision_updated_at: new Date(),
    }

    if (description !== undefined) updateFields.description = description
    if (location !== undefined) {
      updateFields.location = {
        type: 'Point',
        coordinates: [location.longitude, location.latitude],
      }
    }
    if (imageIds !== undefined) updateFields.image_ids = imageIds

    await collection.updateOne(
      { observation_id: id, revision_id: revisionId },
      { $set: updateFields }
    )

    // Handle publish/submit if requested
    if (body.publish && canPublishObservation(context.roles, revision, context.userId)) {
      await publishObservationRevision(id, revisionId)
    } else if (body.submit) {
      await submitObservationForReview(id, revisionId)
    }

    return NextResponse.json({
      id,
      revisionId,
      message: 'Revision updated successfully',
    })
  } catch (error) {
    return handleAuthError(error)
  }
}

/**
 * DELETE /api/observations/[id]/[revisionId]
 * Delete a specific revision
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, revisionId: revisionIdStr } = await params
    const context = await requireAuth(request)
    const revisionId = parseInt(revisionIdStr)

    if (isNaN(revisionId)) {
      return NextResponse.json(
        { error: 'Invalid revision ID' },
        { status: 400 }
      )
    }

    const revision = await getObservationRevision(id, revisionId)

    if (!revision) {
      return NextResponse.json(
        { error: 'Observation revision not found' },
        { status: 404 }
      )
    }

    // Check delete permission
    if (!canDeleteObservation(context.roles, revision, context.userId)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const collection = await getObservationRevisionsCollection()
    await collection.deleteOne({
      observation_id: id,
      revision_id: revisionId,
    })

    return NextResponse.json({
      success: true,
      message: 'Revision deleted',
    })
  } catch (error) {
    return handleAuthError(error)
  }
}

/**
 * PATCH /api/observations/[id]/[revisionId]
 * Publish or submit a specific revision
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, revisionId: revisionIdStr } = await params
    const context = await requireAuth(request)
    const revisionId = parseInt(revisionIdStr)

    if (isNaN(revisionId)) {
      return NextResponse.json(
        { error: 'Invalid revision ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const revision = await getObservationRevision(id, revisionId)

    if (!revision) {
      return NextResponse.json(
        { error: 'Observation revision not found' },
        { status: 404 }
      )
    }

    // Handle publish action
    if (body.action === 'publish') {
      if (!canPublishObservation(context.roles, revision, context.userId)) {
        return NextResponse.json(
          { error: 'Forbidden - cannot publish this revision' },
          { status: 403 }
        )
      }

      await publishObservationRevision(id, revisionId)

      return NextResponse.json({
        id,
        revisionId,
        published: true,
        message: 'Revision published',
      })
    }

    // Handle submit action
    if (body.action === 'submit') {
      if (!canEditObservation(context.roles, revision, context.userId)) {
        return NextResponse.json(
          { error: 'Forbidden - cannot submit this revision' },
          { status: 403 }
        )
      }

      await submitObservationForReview(id, revisionId)

      return NextResponse.json({
        id,
        revisionId,
        submitted: true,
        message: 'Revision submitted for review',
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "publish" or "submit"' },
      { status: 400 }
    )
  } catch (error) {
    return handleAuthError(error)
  }
}
