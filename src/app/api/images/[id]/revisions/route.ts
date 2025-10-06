import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, handleAuthError } from '@/lib/middleware/auth'
import {
  getImageRevision,
  createImageRevision,
} from '@/lib/services/images'
import { canEditObservation } from '@/lib/rbac'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * POST /api/images/{id}/revisions
 * Create a new revision of an existing image
 *
 * Immutable Properties: id, image_key, created_at, owner
 * Mutable Properties: description, location (image_metadata_location)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const context = await requireAuth(request)
    const body = await request.json()

    const { description, location } = body

    // Get the latest revision to check ownership and permissions
    const { getImageRevisions } = await import('@/lib/services/images')
    const revisions = await getImageRevisions(id)

    if (revisions.length === 0) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    const baseRevision = revisions[0] // Latest revision

    // Only owner with edit permission can create revisions
    if (!canEditObservation(context.roles, baseRevision, context.userId)) {
      return NextResponse.json(
        { error: 'Forbidden - only the owner can create revisions' },
        { status: 403 }
      )
    }

    // Validate immutable properties are not being changed
    if (body.id && body.id !== id) {
      return NextResponse.json(
        { error: 'Cannot change image ID in revision' },
        { status: 400 }
      )
    }

    if (body.imageKey && body.imageKey !== baseRevision.image_key) {
      return NextResponse.json(
        { error: 'Cannot change image_key in revision' },
        { status: 400 }
      )
    }

    if (body.createdAt) {
      return NextResponse.json(
        { error: 'Cannot change created_at in revision' },
        { status: 400 }
      )
    }

    if (body.owner && body.owner !== baseRevision.owner) {
      return NextResponse.json(
        { error: 'Cannot change owner in revision' },
        { status: 400 }
      )
    }

    // Create new revision with only mutable properties
    const newRevision = await createImageRevision(
      id,
      { description, location },
      context.userId!
    )

    return NextResponse.json({
      id: newRevision.id,
      revisionId: newRevision.revision_id,
      immutableProperties: {
        imageId: newRevision.id,
        imageKey: newRevision.image_key,
        createdAt: newRevision.created_at.toISOString(),
        owner: newRevision.owner,
      },
      mutableProperties: {
        description: newRevision.description,
        location: newRevision.image_metadata_location ? {
          latitude: newRevision.image_metadata_location.coordinates[1],
          longitude: newRevision.image_metadata_location.coordinates[0],
        } : undefined,
      },
      revisionCreatedAt: newRevision.revision_created_at.toISOString(),
      published: newRevision.published,
      submitted: newRevision.submitted,
    }, { status: 201 })
  } catch (error) {
    return handleAuthError(error)
  }
}
