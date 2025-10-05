// Permission definitions
export enum Permission {
  READ_PUBLISHED_OBSERVATIONS = 'read-published-observations',
  READ_ALL_OBSERVATIONS = 'read-all-observations',
  READ_OWN_OBSERVATIONS = 'read-own-observations',
  EDIT_OWN_OBSERVATIONS = 'edit-own-observations',
  DELETE_OWN_OBSERVATIONS = 'delete-own-observations',
  DELETE_ALL_OBSERVATIONS = 'delete-all-observations',
  PUBLISH_ALL_OBSERVATIONS = 'publish-all-observations',
  PUBLISH_OWN_OBSERVATIONS = 'publish-own-observations',
  MANAGE_USER_ROLES = 'manage-user-roles',
}

// Role definitions
export enum Role {
  SECURITY_ADMIN = 'security-admin',
  MODERATOR = 'moderator',
  AUTHENTICATED_USER = 'authenticated-user',
  PUBLIC = 'public',
  VALIDATED_USER = 'validated-user',
}

// Role to permissions mapping
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SECURITY_ADMIN]: [Permission.MANAGE_USER_ROLES],
  [Role.MODERATOR]: [
    Permission.READ_ALL_OBSERVATIONS,
    Permission.PUBLISH_ALL_OBSERVATIONS,
    Permission.DELETE_ALL_OBSERVATIONS,
  ],
  [Role.AUTHENTICATED_USER]: [
    Permission.READ_OWN_OBSERVATIONS,
    Permission.EDIT_OWN_OBSERVATIONS,
    Permission.DELETE_OWN_OBSERVATIONS,
  ],
  [Role.PUBLIC]: [Permission.READ_PUBLISHED_OBSERVATIONS],
  [Role.VALIDATED_USER]: [Permission.PUBLISH_OWN_OBSERVATIONS],
}

// User interface with roles
export interface UserWithRoles {
  id: string
  email: string
  name: string
  roles: Role[]
  createdAt: Date
  updatedAt: Date
}
