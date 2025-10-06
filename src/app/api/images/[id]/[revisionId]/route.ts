import { NextRequest, NextResponse } from 'next/server'
import {
  handleGetRevision,
  handleUpdateRevision,
  handleDeleteRevision,
  handleRevisionAction,
} from '@/lib/controllers/revision-controller'
import { imageRevisionService } from '@/lib/controllers/image-adapter'
import { updateImageRevisionSchema, revisionActionSchema } from '@/lib/validation/schemas'
import { validateBody } from '@/lib/validation/validate'
import { canEditObservation, canDeleteObservation, canPublishObservation } from '@/lib/rbac'

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
  const { id, revisionId: revisionIdStr } = await params
  const revisionId = parseInt(revisionIdStr)

  if (isNaN(revisionId)) {
    return NextResponse.json(
      { error: 'Invalid revision ID' },
      { status: 400 }
    )
  }

  return handleGetRevision(
    request,
    id,
    revisionId,
    imageRevisionService,
    (revision, context) => ({
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
  )
}

/**
 * PUT /api/images/{id}/{revisionId}
 * Update a specific image revision's metadata
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id, revisionId: revisionIdStr } = await params
  const revisionId = parseInt(revisionIdStr)

  if (isNaN(revisionId)) {
    return NextResponse.json(
      { error: 'Invalid revision ID' },
      { status: 400 }
    )
  }

  return handleUpdateRevision(
    request,
    id,
    revisionId,
    imageRevisionService,
    updateImageRevisionSchema
  )
}

/**
 * DELETE /api/images/{id}/{revisionId}
 * Delete a specific image revision
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id, revisionId: revisionIdStr } = await params
  const revisionId = parseInt(revisionIdStr)

  if (isNaN(revisionId)) {
    return NextResponse.json(
      { error: 'Invalid revision ID' },
      { status: 400 }
    )
  }

  return handleDeleteRevision(
    request,
    id,
    revisionId,
    imageRevisionService
  )
}

/**
 * PATCH /api/images/{id}/{revisionId}
 * Publish or submit a specific image revision
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id, revisionId: revisionIdStr } = await params
  const revisionId = parseInt(revisionIdStr)

  if (isNaN(revisionId)) {
    return NextResponse.json(
      { error: 'Invalid revision ID' },
      { status: 400 }
    )
  }

  const body = await request.json()

  // Validate request body
  const validation = await validateBody(body, revisionActionSchema)
  if (!validation.success) {
    return validation.response
  }

  return handleRevisionAction(
    request,
    id,
    revisionId,
    imageRevisionService,
    validation.data.action
  )
}
