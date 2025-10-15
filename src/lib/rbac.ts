import type { Role } from "@/types/rbac";
import type { OwnedEntity } from "@/types/revision";

// Re-export all generic RBAC functions
export {
  canDeleteEntity as canDeleteObservation,
  canEditEntity as canEditObservation,
  canPublishEntity as canPublishObservation,
  getAllRoles,
  getAutomaticRoles,
  getPermissionsForRoles,
  hasPermission,
} from "./rbac-generic";

import { canReadEntity } from "./rbac-generic";

/**
 * Check if user can read an observation
 * This is a wrapper around the generic canReadEntity function
 */
export function canReadObservation(
  roles: Role[],
  observation: OwnedEntity,
  userId?: string,
): boolean {
  return canReadEntity(roles, observation, userId);
}
