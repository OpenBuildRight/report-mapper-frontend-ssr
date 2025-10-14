import { Role } from '@/types/rbac'
import { OwnedEntity } from '@/types/revision'

// Re-export all generic RBAC functions
export {
  getPermissionsForRoles,
  hasPermission,
  canEditEntity as canEditObservation,
  canDeleteEntity as canDeleteObservation,
  canPublishEntity as canPublishObservation,
  getAutomaticRoles,
  getAllRoles,
} from './rbac-generic'

import { canReadEntity } from './rbac-generic'

/**
 * Check if user can read an observation
 * This is a wrapper around the generic canReadEntity function
 */
export function canReadObservation(
  roles: Role[],
  observation: OwnedEntity,
  userId?: string
): boolean {
  return canReadEntity(roles, observation, userId)
}
