import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getAuthContext, handleAuthError } from '@/lib/middleware/auth'
import {
  getImageRevision,
  updateImageRevision,
  deleteImageRevision,
  publishImageRevision,
  submitImageForReview,
} from '@/lib/services/images'
import { canReadObservation, canEditObservation, canDeleteObservation, canPublishObservation } from '@/lib/rbac'

interface RouteParams {
  params: Promise<{
    id: string
    revisionId: string
  }>
}

/**
 * GET /api/images/{id}/{revisionId}
 * Get a specific image revision
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, revisionId: revisionIdStr } = await params
    const revisionId = parseInt(revisionIdStr)
    const context = await getAuthContext(request)

    const revision = await getImageRevision(id, revisionId)

    if (!revision) {
      return NextResponse.json(
        { error: 'Image revision not found' },
        { status: 404 }
      )
    }

    // Check read permission
    if (!canReadObservation(context.roles, revision, context.userId)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      id: revision.id,
      revisionId: revision.revision_id,
      imageKey: revision.image_key,
      description: revision.description,
      location: revision.image_metadata_location ? {
        latitude: revision.image_metadata_location.coordinates[1],
        longitude: revision.image_metadata_location.coordinates[0],
      } : undefined,
      metadataCreatedAt: revision.image_metadata_created_at?.toISOString(),
      createdAt: revision.created_at.toISOString(),
      updatedAt: revision.updated_at.toISOString(),
      revisionCreatedAt: revision.revision_created_at.toISOString(),
      published: revision.published,
      submitted: revision.submitted,
      owner: revision.owner,
      canEdit: canEditObservation(context.roles, revision, context.userId),
      canDelete: canDeleteObservation(context.roles, revision, context.userId),
      canPublish: canPublishObservation(context.roles, revision, context.userId),
    })
  } catch (error) {
    return handleAuthError(error)
  }
}

/**
 * PUT /api/images/{id}/{revisionId}
 * Update a specific image revision's metadata
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, revisionId: revisionIdStr } = await params
    const revisionId = parseInt(revisionIdStr)
    const context = await requireAuth(request)
    const body = await request.json()

    const revision = await getImageRevision(id, revisionId)

    if (!revision) {
      return NextResponse.json(
        { error: 'Image revision not found' },
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

    // Cannot edit published revisions
    if (revision.published) {
      return NextResponse.json(
        { error: 'Cannot edit published revision' },
        { status: 400 }
      )
    }

    const { description, location } = body

    await updateImageRevision(id, revisionId, { description, location })

    const updated = await getImageRevision(id, revisionId)

    return NextResponse.json({
      id: updated!.id,
      revisionId: updated!.revision_id,
      description: updated!.description,
      location: updated!.image_metadata_location ? {
        latitude: updated!.image_metadata_location.coordinates[1],
        longitude: updated!.image_metadata_location.coordinates[0],
      } : undefined,
      updatedAt: updated!.updated_at.toISOString(),
    })
  } catch (error) {
    return handleAuthError(error)
  }
}

/**
 * DELETE /api/images/{id}/{revisionId}
 * Delete a specific image revision
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, revisionId: revisionIdStr } = await params
    const revisionId = parseInt(revisionIdStr)
    const context = await requireAuth(request)

    const revision = await getImageRevision(id, revisionId)

    if (!revision) {
      return NextResponse.json(
        { error: 'Image revision not found' },
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

    // Cannot delete published revisions
    if (revision.published) {
      return NextResponse.json(
        { error: 'Cannot delete published revision' },
        { status: 400 }
      )
    }

    await deleteImageRevision(id, revisionId)

    return NextResponse.json({
      success: true,
      message: 'Image revision deleted',
    })
  } catch (error) {
    return handleAuthError(error)
  }
}

/**
 * PATCH /api/images/{id}/{revisionId}
 * Publish or submit a specific image revision
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, revisionId: revisionIdStr } = await params
    const revisionId = parseInt(revisionIdStr)
    const context = await requireAuth(request)
    const body = await request.json()

    const revision = await getImageRevision(id, revisionId)

    if (!revision) {
      return NextResponse.json(
        { error: 'Image revision not found' },
        { status: 404 }
      )
    }

    if (body.action === 'publish') {
      // Check publish permission
      if (!canPublishObservation(context.roles, revision, context.userId)) {
        return NextResponse.json(
          { error: 'Forbidden - insufficient permissions to publish' },
          { status: 403 }
        )
      }

      await publishImageRevision(id, revisionId)

      return NextResponse.json({
        id,
        revisionId,
        published: true,
        message: 'Image revision published',
      })
    }

    if (body.action === 'submit') {
      // Check edit permission (must be owner)
      if (!canEditObservation(context.roles, revision, context.userId)) {
        return NextResponse.json(
          { error: 'Forbidden - only owner can submit for review' },
          { status: 403 }
        )
      }

      await submitImageForReview(id, revisionId)

      return NextResponse.json({
        id,
        revisionId,
        submitted: true,
        message: 'Image revision submitted for review',
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Must be "publish" or "submit"' },
      { status: 400 }
    )
  } catch (error) {
    return handleAuthError(error)
  }
}
