import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth, handleAuthError } from '@/lib/middleware/auth'
import {
  getPublishedImageRevision,
  getImageRevision,
  createImageRevision,
  deleteImage,
  publishImageRevision,
} from '@/lib/services/images'
import { canReadObservation, canEditObservation, canDeleteObservation, canPublishObservation } from '@/lib/rbac'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/images/[id]
 * Get a specific image
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const context = await getAuthContext()
    const { searchParams } = new URL(request.url)
    const revisionId = searchParams.get('revisionId')

    let image

    if (revisionId) {
      image = await getImageRevision(id, parseInt(revisionId))
    } else {
      image = await getPublishedImageRevision(id)
    }

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    // Check read permission
    if (!canReadObservation(context.roles, image, context.userId)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      id: image.id,
      revisionId: image.revision_id,
      imageKey: image.image_key,
      description: image.description,
      location: image.image_metadata_location ? {
        latitude: image.image_metadata_location.coordinates[1],
        longitude: image.image_metadata_location.coordinates[0],
      } : undefined,
      metadataCreatedAt: image.image_metadata_created_at?.toISOString(),
      createdAt: image.created_at.toISOString(),
      updatedAt: image.updated_at.toISOString(),
      published: image.published,
      submitted: image.submitted,
      owner: image.owner,
      canEdit: canEditObservation(context.roles, image, context.userId),
      canDelete: canDeleteObservation(context.roles, image, context.userId),
    })
  } catch (error) {
    return handleAuthError(error)
  }
}

/**
 * PUT /api/images/[id]
 * Update image metadata (creates a new revision)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const context = await requireAuth()
    const body = await request.json()

    // Get current image to check permissions
    const current = await getPublishedImageRevision(id)
    if (!current) {
      return NextResponse.json(
        { error: 'Image not found' },
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

    const { description, location } = body

    // Create new revision with updated metadata
    const revision = await createImageRevision(
      id,
      { description, location },
      context.userId!
    )

    // If user can publish, optionally auto-publish
    if (body.publish && canPublishObservation(context.roles, current, context.userId)) {
      await publishImageRevision(id, revision.revision_id)
    }

    return NextResponse.json({
      id: revision.id,
      revisionId: revision.revision_id,
      published: revision.published,
      message: revision.published ? 'Image updated and published' : 'Image revision created',
    })
  } catch (error) {
    return handleAuthError(error)
  }
}

/**
 * DELETE /api/images/[id]
 * Delete an image
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const context = await requireAuth()

    // Get image to check permissions
    const image = await getPublishedImageRevision(id)
    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    // Check delete permission
    if (!canDeleteObservation(context.roles, image, context.userId)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // TODO: Delete from MinIO/S3
    await deleteImage(id)

    return NextResponse.json({
      success: true,
      message: 'Image deleted',
    })
  } catch (error) {
    return handleAuthError(error)
  }
}
