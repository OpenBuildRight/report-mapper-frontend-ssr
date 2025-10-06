import { NextRequest, NextResponse } from 'next/server'
import {
  handleGetRevision,
  handleUpdateRevision,
  handleDeleteRevision,
  handleRevisionAction,
} from '@/lib/controllers/revision-controller'
import { observationRevisionService } from '@/lib/controllers/observation-adapter'
import { updateObservationRevisionSchema, revisionActionSchema } from '@/lib/validation/schemas'
import { validateBody } from '@/lib/validation/validate'
import { canEditObservation, canDeleteObservation, canPublishObservation } from '@/lib/rbac'

interface RouteParams {
  params: Promise<{
    id: string
    revisionId: string
  }>
}

/**
 * GET /api/observations/{id}/{revisionId}
 * Get a specific revision
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
    observationRevisionService,
    (revision, context) => ({
      id: revision.observation_id,
      revisionId: revision.revision_id,
      description: revision.description,
      location: revision.location ? {
        latitude: revision.location.coordinates[1],
        longitude: revision.location.coordinates[0],
      } : undefined,
      imageIds: revision.image_ids || [],
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
 * PUT /api/observations/{id}/{revisionId}
 * Update a specific revision
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
    observationRevisionService,
    updateObservationRevisionSchema
  )
}

/**
 * DELETE /api/observations/{id}/{revisionId}
 * Delete a specific revision
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
    observationRevisionService
  )
}

/**
 * PATCH /api/observations/{id}/{revisionId}
 * Publish or submit a specific revision
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
    observationRevisionService,
    validation.data.action
  )
}
