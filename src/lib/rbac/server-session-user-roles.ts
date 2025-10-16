import {Role} from "@/types/rbac";
import {config} from "@/config/runtime-config";
import {getUserRoles} from "@/lib/db/user-roles";

/**
 * Generic RBAC utilities for version-controlled entities
 * These work with any entity that has owner and published fields
 */

export function getInitialUserRoles(userId? : string) : Set<Role> {
    if (!userId) return new Set<Role>();
    config.initialUserRoleAssignments.forEach((assignment) => {
        if (assignment.userId === userId) {
            return new Set(assignment.roles);
        }
    })
    return new Set<Role>();
}

/**
 * Get all roles for a user including automatic roles and admin roles
 */
export async function getAllRoles(
  userId?: string,
): Promise<Role[]> {
    const roles = new Set<Role>([Role.PUBLIC]);
    if (userId !== undefined && userId !== null) {
        roles.add(Role.AUTHENTICATED_USER);
    }
    getInitialUserRoles(userId).forEach((role) => roles.add(role));
    if (userId) {
        getUserRoles(userId).then((userRoles) =>  userRoles.forEach((role) => roles.add(role)))
    }
    return Array.from(roles);
}

