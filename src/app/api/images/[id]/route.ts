import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, handleAuthError } from '@/lib/middleware/auth'
import { getImageRevisions } from '@/lib/services/images'
import { canReadObservation } from '@/lib/rbac'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/images/{id}
 * Get all revisions for an image
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const context = await getAuthContext(request)

    const revisions = await getImageRevisions(id)

    if (revisions.length === 0) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    // Filter revisions based on permissions
    const visibleRevisions = revisions.filter(rev =>
      canReadObservation(context.roles, rev, context.userId)
    )

    const formattedRevisions = visibleRevisions.map(rev => ({
      id: rev.id,
      revisionId: rev.revision_id,
      imageKey: rev.image_key,
      description: rev.description,
      location: rev.image_metadata_location ? {
        latitude: rev.image_metadata_location.coordinates[1],
        longitude: rev.image_metadata_location.coordinates[0],
      } : undefined,
      metadataCreatedAt: rev.image_metadata_created_at?.toISOString(),
      createdAt: rev.created_at.toISOString(),
      updatedAt: rev.updated_at.toISOString(),
      revisionCreatedAt: rev.revision_created_at.toISOString(),
      published: rev.published,
      submitted: rev.submitted,
      owner: rev.owner,
    }))

    return NextResponse.json({
      imageId: id,
      revisions: formattedRevisions,
      total: formattedRevisions.length,
    })
  } catch (error) {
    return handleAuthError(error)
  }
}
