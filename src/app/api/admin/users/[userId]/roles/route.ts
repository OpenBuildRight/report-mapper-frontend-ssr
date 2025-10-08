import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, handleAuthError } from '@/lib/middleware/auth'
import { Permission, Role } from '@/types/rbac'
import { assignRole, removeRole, getUserRoles } from '@/lib/users'
import { z } from 'zod'

const assignRoleSchema = z.object({
  role: z.nativeEnum(Role),
})

const removeRoleSchema = z.object({
  role: z.nativeEnum(Role),
})

/**
 * GET /api/admin/users/:userId/roles
 * Get all roles for a user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requirePermission(Permission.MANAGE_USER_ROLES, request)
    const { userId } = await params

    const roles = await getUserRoles(userId)

    return NextResponse.json({ roles })
  } catch (error) {
    return handleAuthError(error)
  }
}

/**
 * POST /api/admin/users/:userId/roles
 * Assign a role to a user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requirePermission(Permission.MANAGE_USER_ROLES, request)
    const { userId } = await params

    const body = await request.json()
    const result = assignRoleSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: result.error.errors },
        { status: 400 }
      )
    }

    await assignRole(userId, result.data.role)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleAuthError(error)
  }
}

/**
 * DELETE /api/admin/users/:userId/roles
 * Remove a role from a user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requirePermission(Permission.MANAGE_USER_ROLES, request)
    const { userId } = await params

    const body = await request.json()
    const result = removeRoleSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: result.error.errors },
        { status: 400 }
      )
    }

    await removeRole(userId, result.data.role)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleAuthError(error)
  }
}
