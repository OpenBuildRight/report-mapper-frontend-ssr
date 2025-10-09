import { createRoute, z, OpenAPIHono } from '@hono/zod-openapi'
import { HTTPException } from 'hono/http-exception'
import { getAuthContext, requireAuth, requirePermission } from '@/lib/middleware/auth'
import {
  createObservation,
  getObservationsFiltered,
  getObservationRevisions,
  getObservationRevision,
  updateObservationRevision,
  deleteObservation,
  publishObservationRevision,
} from '@/lib/services/observations'
import { parseFiltersFromSearchParams } from '@/lib/services/observation-filters'
import { canReadObservation } from '@/lib/rbac'
import { canEditEntity, canDeleteEntity, canPublishEntity } from '@/lib/rbac-generic'
import { Permission } from '@/types/rbac'
import * as schemas from '@/lib/hono/schemas'
import { mapObservation, mapObservationListItem } from '@/lib/hono/mappers'

export const observationsApp = new OpenAPIHono()

/**
 * GET /observations
 * List observations with flexible filtering
 */
const listObservationsRoute = createRoute({
  method: 'get',
  path: '/observations',
  tags: ['Observations'],
  summary: 'List observations',
  description: 'Get observations with flexible filtering. Access control is automatically applied.',
  responses: {
    200: {
      description: 'List of observations',
      content: {
        'application/json': {
          schema: schemas.GetObservationsResponseSchema,
        },
      },
    },
  },
})

observationsApp.openapi(listObservationsRoute, async (c) => {
  const context = await getAuthContext(c.req.raw as Request)
  const url = new URL(c.req.url)
  const filters = parseFiltersFromSearchParams(url.searchParams)

  const { results: observations, total } = await getObservationsFiltered(filters, {
    userId: context.userId,
    roles: context.roles,
  })

  const apiObservations = observations.map(obs =>
    mapObservationListItem(obs, context.roles, context.userId)
  )

  return c.json({
    observations: apiObservations,
    total,
    count: apiObservations.length,
  })
})

/**
 * POST /observations
 * Create a new observation
 */
const createObservationRoute = createRoute({
  method: 'post',
  path: '/observations',
  tags: ['Observations'],
  summary: 'Create a new observation',
  description: 'Create a new observation. Photos should be uploaded to /api/images first.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: schemas.CreateObservationRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Observation created',
      content: {
        'application/json': {
          schema: schemas.CreateObservationResponseSchema,
        },
      },
    },
  },
})

observationsApp.openapi(createObservationRoute, async (c) => {
  const context = await requireAuth(c.req.raw as Request)
  const body = c.req.valid('json')

  const { description, location, imageIds, submitted } = body

  const observation = await createObservation({
    description,
    location,
    imageIds: imageIds || [],
    owner: context.userId!,
    autoPublish: false,
    submitted,
  })

  return c.json({
    id: observation.observation_id,
    revisionId: observation.revision_id,
    published: observation.published,
    submitted: observation.submitted,
    message: 'Observation created',
  }, 201)
})

/**
 * GET /observations/:id
 * Get observation revisions
 */
const getObservationRoute = createRoute({
  method: 'get',
  path: '/observations/{id}',
  tags: ['Observations'],
  summary: 'Get observation revisions',
  description: 'Get all revisions or a specific revision (use ?revisionId= query param)',
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Observation data',
      content: {
        'application/json': {
          schema: z.union([schemas.ObservationSchema, schemas.GetObservationRevisionsResponseSchema]),
        },
      },
    },
  },
})

observationsApp.openapi(getObservationRoute, async (c) => {
  const { id } = c.req.valid('param')
  const context = await getAuthContext(c.req.raw as Request)
  const url = new URL(c.req.url)
  const revisionIdParam = url.searchParams.get('revisionId')

  if (revisionIdParam) {
    const revisionId = parseInt(revisionIdParam, 10)
    const observation = await getObservationRevision(id, revisionId)

    if (!observation) {
      throw new HTTPException(404, { message: 'Observation revision not found' })
    }

    if (!canReadObservation(context.roles, observation, context.userId)) {
      throw new HTTPException(403, { message: 'Forbidden' })
    }

    return c.json(mapObservation(observation, context.roles, context.userId))
  }

  const revisions = await getObservationRevisions(id)

  if (!revisions || revisions.length === 0) {
    throw new HTTPException(404, { message: 'Observation not found' })
  }

  const visibleRevisions = revisions.filter(rev =>
    canReadObservation(context.roles, rev, context.userId)
  )

  if (visibleRevisions.length === 0) {
    throw new HTTPException(403, { message: 'Forbidden' })
  }

  const formattedRevisions = visibleRevisions.map(obs =>
    mapObservation(obs, context.roles, context.userId)
  )

  return c.json({
    observationId: id,
    revisions: formattedRevisions,
    total: formattedRevisions.length,
  })
})

/**
 * PATCH /observations/:id
 * Update observation
 */
const updateObservationRoute = createRoute({
  method: 'patch',
  path: '/observations/{id}',
  tags: ['Observations'],
  summary: 'Update observation',
  description: 'Update a specific revision of an observation',
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        'application/json': {
          schema: schemas.UpdateObservationRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Updated successfully',
      content: {
        'application/json': {
          schema: schemas.UpdateObservationResponseSchema,
        },
      },
    },
  },
})

observationsApp.openapi(updateObservationRoute, async (c) => {
  const context = await requireAuth(c.req.raw as Request)
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')
  const { revisionId, description, location, imageIds } = body

  const observation = await getObservationRevision(id, revisionId)

  if (!observation) {
    throw new HTTPException(404, { message: 'Observation not found' })
  }

  if (!canEditEntity(context.roles, observation, context.userId)) {
    throw new HTTPException(403, { message: 'You do not have permission to edit this observation' })
  }

  await updateObservationRevision(id, revisionId, {
    description,
    location,
    imageIds,
  })

  const updated = await getObservationRevision(id, revisionId)

  return c.json({
    id: updated!.observation_id,
    revisionId: updated!.revision_id,
    message: 'Observation updated successfully',
  })
})

/**
 * DELETE /observations/:id
 * Delete observation
 */
const deleteObservationRoute = createRoute({
  method: 'delete',
  path: '/observations/{id}',
  tags: ['Observations'],
  summary: 'Delete observation',
  description: 'Delete an observation (all revisions)',
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Deleted successfully',
      content: {
        'application/json': {
          schema: schemas.DeleteObservationResponseSchema,
        },
      },
    },
  },
})

observationsApp.openapi(deleteObservationRoute, async (c) => {
  const context = await requireAuth(c.req.raw as Request)
  const { id } = c.req.valid('param')

  const revisions = await getObservationRevisions(id)

  if (!revisions || revisions.length === 0) {
    throw new HTTPException(404, { message: 'Observation not found' })
  }

  const latestRevision = revisions[0]

  if (!canDeleteEntity(context.roles, latestRevision, context.userId)) {
    throw new HTTPException(403, { message: 'You do not have permission to delete this observation' })
  }

  await deleteObservation(id)

  return c.json({
    message: 'Observation deleted successfully',
    id,
  })
})

/**
 * POST /observations/:id/publish
 * Publish observation
 */
const publishObservationRoute = createRoute({
  method: 'post',
  path: '/observations/{id}/publish',
  tags: ['Observations'],
  summary: 'Publish observation',
  description: 'Publish a specific revision of an observation',
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        'application/json': {
          schema: schemas.PublishObservationRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Published successfully',
      content: {
        'application/json': {
          schema: schemas.PublishObservationResponseSchema,
        },
      },
    },
  },
})

observationsApp.openapi(publishObservationRoute, async (c) => {
  const context = await requirePermission(Permission.PUBLISH_OWN_OBSERVATIONS, c.req.raw as Request)
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')
  const { revisionId } = body

  const observation = await getObservationRevision(id, revisionId)

  if (!observation) {
    throw new HTTPException(404, { message: 'Observation not found' })
  }

  if (!canPublishEntity(context.roles, observation, context.userId)) {
    throw new HTTPException(403, { message: 'You do not have permission to publish this observation' })
  }

  await publishObservationRevision(id, revisionId)

  return c.json({
    success: true,
    message: 'Observation published successfully',
    id,
    revisionId,
  })
})
