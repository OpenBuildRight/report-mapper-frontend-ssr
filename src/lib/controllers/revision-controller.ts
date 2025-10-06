import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getAuthContext, handleAuthError } from '@/lib/middleware/auth'
import {
  canReadEntity,
  canEditEntity,
  canDeleteEntity,
  canPublishEntity,
} from '@/lib/rbac-generic'
import { validateBody } from '@/lib/validation/validate'
import type { z } from 'zod'

/**
 * Generic revision document interface
 */
export interface RevisionDocument {
  id: string
  revision_id: number
  published: boolean
  submitted: boolean
  owner: string
  created_at: Date
  updated_at: Date
  revision_created_at: Date
  [key: string]: any
}

/**
 * Generic service interface for revision-based resources
 */
export interface RevisionService<T extends RevisionDocument> {
  getRevision(id: string, revisionId: number): Promise<T | null>
  getRevisions(id: string): Promise<T[]>
  updateRevision(id: string, revisionId: number, input: any): Promise<void>
  deleteRevision(id: string, revisionId: number): Promise<void>
  publishRevision(id: string, revisionId: number): Promise<void>
  submitRevision(id: string, revisionId: number): Promise<void>
}

/**
 * Generic GET handler for a specific revision
 */
export async function handleGetRevision<T extends RevisionDocument>(
  request: NextRequest,
  id: string,
  revisionId: number,
  service: RevisionService<T>,
  formatResponse: (revision: T, context: any) => any
) {
  try {
    const context = await getAuthContext(request)
    const revision = await service.getRevision(id, revisionId)

    if (!revision) {
      return NextResponse.json(
        { error: 'Revision not found' },
        { status: 404 }
      )
    }

    // Check read permission
    if (!canReadEntity(context.roles, revision, context.userId)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    return NextResponse.json(formatResponse(revision, context))
  } catch (error) {
    return handleAuthError(error)
  }
}

/**
 * Generic GET handler for all revisions
 */
export async function handleGetRevisions<T extends RevisionDocument>(
  request: NextRequest,
  id: string,
  service: RevisionService<T>,
  formatResponse: (revisions: T[]) => any
) {
  try {
    const context = await getAuthContext(request)
    const revisions = await service.getRevisions(id)

    if (revisions.length === 0) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      )
    }

    // Filter revisions based on permissions
    const visibleRevisions = revisions.filter(rev =>
      canReadEntity(context.roles, rev, context.userId)
    )

    return NextResponse.json(formatResponse(visibleRevisions))
  } catch (error) {
    return handleAuthError(error)
  }
}

/**
 * Generic PUT handler for updating a revision
 */
export async function handleUpdateRevision<T extends RevisionDocument, S extends z.ZodType>(
  request: NextRequest,
  id: string,
  revisionId: number,
  service: RevisionService<T>,
  schema: S
) {
  try {
    const context = await requireAuth(request)
    const body = await request.json()

    // Validate request body
    const validation = await validateBody(body, schema)
    if (!validation.success) {
      return validation.response
    }

    const revision = await service.getRevision(id, revisionId)

    if (!revision) {
      return NextResponse.json(
        { error: 'Revision not found' },
        { status: 404 }
      )
    }

    // Check edit permission
    if (!canEditEntity(context.roles, revision, context.userId)) {
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

    // Update the revision
    await service.updateRevision(id, revisionId, validation.data)

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
 * Generic DELETE handler for deleting a revision
 */
export async function handleDeleteRevision<T extends RevisionDocument>(
  request: NextRequest,
  id: string,
  revisionId: number,
  service: RevisionService<T>
) {
  try {
    const context = await requireAuth(request)
    const revision = await service.getRevision(id, revisionId)

    if (!revision) {
      return NextResponse.json(
        { error: 'Revision not found' },
        { status: 404 }
      )
    }

    // Check delete permission
    if (!canDeleteEntity(context.roles, revision, context.userId)) {
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

    await service.deleteRevision(id, revisionId)

    return NextResponse.json({
      success: true,
      message: 'Revision deleted',
    })
  } catch (error) {
    return handleAuthError(error)
  }
}

/**
 * Generic PATCH handler for publish/submit actions
 */
export async function handleRevisionAction<T extends RevisionDocument>(
  request: NextRequest,
  id: string,
  revisionId: number,
  service: RevisionService<T>,
  action: 'publish' | 'submit'
) {
  try {
    const context = await requireAuth(request)
    const revision = await service.getRevision(id, revisionId)

    if (!revision) {
      return NextResponse.json(
        { error: 'Revision not found' },
        { status: 404 }
      )
    }

    if (action === 'publish') {
      // Check publish permission
      if (!canPublishEntity(context.roles, revision, context.userId)) {
        return NextResponse.json(
          { error: 'Forbidden - insufficient permissions to publish' },
          { status: 403 }
        )
      }

      await service.publishRevision(id, revisionId)

      return NextResponse.json({
        id,
        revisionId,
        published: true,
        message: 'Revision published',
      })
    }

    if (action === 'submit') {
      // Check edit permission (must be owner)
      if (!canEditEntity(context.roles, revision, context.userId)) {
        return NextResponse.json(
          { error: 'Forbidden - only owner can submit for review' },
          { status: 403 }
        )
      }

      await service.submitRevision(id, revisionId)

      return NextResponse.json({
        id,
        revisionId,
        submitted: true,
        message: 'Revision submitted for review',
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    return handleAuthError(error)
  }
}
