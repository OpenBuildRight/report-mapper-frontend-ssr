import { createRoute, z, OpenAPIHono } from '@hono/zod-openapi'
import { requirePermission } from '@/lib/middleware/auth'
import { Permission } from '@/types/rbac'
import { assignRole, removeRole, getUserRoles } from '@/lib/user-roles'
import * as schemas from '@/lib/hono/schemas'

export const adminApp = new OpenAPIHono()

/**
 * GET /admin/users/:userId/roles
 * Get all roles for a user
 */
const getUserRolesRoute = createRoute({
  method: 'get',
  path: '/admin/users/{userId}/roles',
  tags: ['Admin'],
  summary: 'Get user roles',
  description: 'Get all roles assigned to a specific user',
  request: {
    params: z.object({
      userId: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'User roles',
      content: {
        'application/json': {
          schema: schemas.GetUserRolesResponseSchema,
        },
      },
    },
  },
})

adminApp.openapi(getUserRolesRoute, async (c) => {
  await requirePermission(Permission.MANAGE_USER_ROLES, c.req.raw as Request)
  const { userId } = c.req.valid('param')

  const roles = await getUserRoles(userId)

  return c.json({ roles })
})

/**
 * POST /admin/users/:userId/roles
 * Assign a role to a user
 */
const assignRoleRoute = createRoute({
  method: 'post',
  path: '/admin/users/{userId}/roles',
  tags: ['Admin'],
  summary: 'Assign role to user',
  description: 'Assign a role to a specific user',
  request: {
    params: z.object({
      userId: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: schemas.AssignRoleRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Role assigned',
      content: {
        'application/json': {
          schema: schemas.RoleOperationResponseSchema,
        },
      },
    },
  },
})

adminApp.openapi(assignRoleRoute, async (c) => {
  await requirePermission(Permission.MANAGE_USER_ROLES, c.req.raw as Request)
  const { userId } = c.req.valid('param')
  const body = c.req.valid('json')

  await assignRole(userId, body.role)

  return c.json({ success: true })
})

/**
 * DELETE /admin/users/:userId/roles
 * Remove a role from a user
 */
const removeRoleRoute = createRoute({
  method: 'delete',
  path: '/admin/users/{userId}/roles',
  tags: ['Admin'],
  summary: 'Remove role from user',
  description: 'Remove a role from a specific user',
  request: {
    params: z.object({
      userId: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: schemas.RemoveRoleRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Role removed',
      content: {
        'application/json': {
          schema: schemas.RoleOperationResponseSchema,
        },
      },
    },
  },
})

adminApp.openapi(removeRoleRoute, async (c) => {
  await requirePermission(Permission.MANAGE_USER_ROLES, c.req.raw as Request)
  const { userId } = c.req.valid('param')
  const body = c.req.valid('json')

  await removeRole(userId, body.role)

  return c.json({ success: true })
})
