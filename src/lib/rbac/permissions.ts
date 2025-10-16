import {Permission, Role, ROLE_PERMISSIONS} from "@/types/rbac";
import type {OwnedEntity} from "@/types/revision";

/**
 * Get all permissions for a given set of roles
 */
export function getPermissionsForRoles(roles: Role[]): Permission[] {
    const permissions = new Set<Permission>();

    for (const role of roles) {
        const rolePermissions = ROLE_PERMISSIONS[role] || [];
        rolePermissions.forEach((permission) => permissions.add(permission));
    }

    return Array.from(permissions);
}

/**
 * Check if a user with given roles has a specific permission
 */
export function hasPermission(roles: Role[], permission: Permission): boolean {
    const permissions = getPermissionsForRoles(roles);
    return permissions.includes(permission);
}

/**
 * Generic: Check if user can read an entity
 */
export function canReadEntity(
    roles: Role[],
    entity: OwnedEntity,
    userId?: string,
): boolean {
    // Public can read published entities
    if (
        entity.published &&
        hasPermission(roles, Permission.READ_PUBLISHED_OBSERVATIONS)
    ) {
        return true;
    }

    // Can read all entities (moderator)
    if (hasPermission(roles, Permission.READ_ALL_OBSERVATIONS)) {
        return true;
    }

    // Can read own entities
    if (
        userId &&
        entity.owner === userId &&
        hasPermission(roles, Permission.READ_OWN_OBSERVATIONS)
    ) {
        return true;
    }

    return false;
}

/**
 * Generic: Check if user can edit an entity
 */
export function canEditEntity(
    roles: Role[],
    entity: { owner: string },
    userId?: string,
): boolean {
    if (!userId) return false;

    // Can only edit own entities
    return (
        entity.owner === userId &&
        hasPermission(roles, Permission.EDIT_OWN_OBSERVATIONS)
    );
}

/**
 * Generic: Check if user can delete an entity
 */
export function canDeleteEntity(
    roles: Role[],
    entity: { owner: string },
    userId?: string,
): boolean {
    // Can delete all entities (moderator)
    if (hasPermission(roles, Permission.DELETE_ALL_OBSERVATIONS)) {
        return true;
    }

    // Can delete own entities
    if (
        userId &&
        entity.owner === userId &&
        hasPermission(roles, Permission.DELETE_OWN_OBSERVATIONS)
    ) {
        return true;
    }

    return false;
}

/**
 * Generic: Check if user can publish an entity
 */
export function canPublishEntity(
    roles: Role[],
    entity: OwnedEntity,
    userId?: string,
): boolean {
    // Can publish all entities (moderator)
    if (hasPermission(roles, Permission.PUBLISH_ALL_OBSERVATIONS)) {
        return true;
    }

    // Can publish own entities (validated user)
    if (
        userId &&
        entity.owner === userId &&
        hasPermission(roles, Permission.PUBLISH_OWN_OBSERVATIONS)
    ) {
        return true;
    }

    return false;
}
