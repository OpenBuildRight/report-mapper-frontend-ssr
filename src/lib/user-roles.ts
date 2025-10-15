import type { Collection } from "mongodb";
import type { Role } from "@/types/rbac";
import { getDb } from "./db";

export interface UserRoleDocument {
  userId: string; // Keycloak sub claim
  roles: string[];
  created_at: Date;
  updated_at: Date;
}

const COLLECTION_NAME = "user_roles";

async function getUserRolesCollection(): Promise<Collection<UserRoleDocument>> {
  const db = await getDb();
  return db.collection<UserRoleDocument>(COLLECTION_NAME);
}

/**
 * Get roles for a user by their ID (Keycloak sub)
 */
export async function getUserRoles(userId: string): Promise<Role[]> {
  const collection = await getUserRolesCollection();
  const doc = await collection.findOne({ userId });
  return (doc?.roles as Role[]) || [];
}

/**
 * Assign a role to a user
 * Creates the user role document if it doesn't exist
 */
export async function assignRole(userId: string, role: Role): Promise<void> {
  const collection = await getUserRolesCollection();

  await collection.updateOne(
    { userId },
    {
      $addToSet: { roles: role },
      $set: { updated_at: new Date() },
      $setOnInsert: {
        userId,
        created_at: new Date(),
      },
    },
    { upsert: true },
  );
}

/**
 * Remove a role from a user
 */
export async function removeRole(userId: string, role: Role): Promise<void> {
  const collection = await getUserRolesCollection();

  await collection.updateOne(
    { userId },
    {
      $pull: { roles: role },
      $set: { updated_at: new Date() },
    },
  );
}

/**
 * Initialize user_roles collection indexes
 */
export async function initializeUserRolesIndexes(): Promise<void> {
  const db = await getDb();
  await db
    .collection(COLLECTION_NAME)
    .createIndex({ userId: 1 }, { unique: true });
}
