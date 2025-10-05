import { Role, Permission, ROLE_PERMISSIONS } from '@/types/rbac'

/**
 * Get all permissions for a given set of roles
 */
export function getPermissionsForRoles(roles: Role[]): Permission[] {
  const permissions = new Set<Permission>()

  for (const role of roles) {
    const rolePermissions = ROLE_PERMISSIONS[role] || []
    rolePermissions.forEach(permission => permissions.add(permission))
  }

  return Array.from(permissions)
}

/**
 * Check if a user with given roles has a specific permission
 */
export function hasPermission(roles: Role[], permission: Permission): boolean {
  const permissions = getPermissionsForRoles(roles)
  return permissions.includes(permission)
}

/**
 * Check if user can read an observation
 */
export function canReadObservation(
  roles: Role[],
  observation: { published: boolean; owner: string },
  userId?: string
): boolean {
  // Public can read published observations
  if (observation.published && hasPermission(roles, Permission.READ_PUBLISHED_OBSERVATIONS)) {
    return true
  }

  // Can read all observations (moderator)
  if (hasPermission(roles, Permission.READ_ALL_OBSERVATIONS)) {
    return true
  }

  // Can read own observations
  if (userId && observation.owner === userId && hasPermission(roles, Permission.READ_OWN_OBSERVATIONS)) {
    return true
  }

  return false
}

/**
 * Check if user can edit an observation
 */
export function canEditObservation(
  roles: Role[],
  observation: { owner: string },
  userId?: string
): boolean {
  if (!userId) return false

  // Can only edit own observations
  return observation.owner === userId && hasPermission(roles, Permission.EDIT_OWN_OBSERVATIONS)
}

/**
 * Check if user can delete an observation
 */
export function canDeleteObservation(
  roles: Role[],
  observation: { owner: string },
  userId?: string
): boolean {
  // Can delete all observations (moderator)
  if (hasPermission(roles, Permission.DELETE_ALL_OBSERVATIONS)) {
    return true
  }

  // Can delete own observations
  if (userId && observation.owner === userId && hasPermission(roles, Permission.DELETE_OWN_OBSERVATIONS)) {
    return true
  }

  return false
}

/**
 * Check if user can publish an observation
 */
export function canPublishObservation(
  roles: Role[],
  observation: { owner: string },
  userId?: string
): boolean {
  // Can publish all observations (moderator)
  if (hasPermission(roles, Permission.PUBLISH_ALL_OBSERVATIONS)) {
    return true
  }

  // Can publish own observations (validated user)
  if (userId && observation.owner === userId && hasPermission(roles, Permission.PUBLISH_OWN_OBSERVATIONS)) {
    return true
  }

  return false
}

/**
 * Get automatic roles for a user based on their authentication status
 */
export function getAutomaticRoles(isAuthenticated: boolean): Role[] {
  const roles: Role[] = [Role.PUBLIC]

  if (isAuthenticated) {
    roles.push(Role.AUTHENTICATED_USER)
  }

  return roles
}

/**
 * Check if a user is root user (from environment variables)
 */
export function isRootUser(email: string): boolean {
  const rootUserEmail = process.env.ROOT_USER_EMAIL
  return !!rootUserEmail && email === rootUserEmail
}

/**
 * Get all roles for a user including automatic roles
 */
export function getAllRoles(userRoles: Role[], isAuthenticated: boolean): Role[] {
  const automaticRoles = getAutomaticRoles(isAuthenticated)
  const allRoles = new Set([...automaticRoles, ...userRoles])
  return Array.from(allRoles)
}
