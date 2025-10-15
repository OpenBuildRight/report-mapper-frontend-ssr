/**
 * Base interface for all revisioned objects
 * These fields are common to all version-controlled entities
 */
export interface BaseRevision {
  revision_id: number; // Auto increments from 0 for each entity
  id: string; // UUID of the entity
  updated_at: Date;
  created_at: Date;
  revision_created_at: Date;
  published: boolean;
  submitted: boolean;
  owner: string; // user_id
}

/**
 * Type for entities that can be owned and have RBAC applied
 */
export interface OwnedEntity {
  owner: string;
  published: boolean;
}

/**
 * Helper type for creating new revisions (without DB-generated fields)
 */
export type NewRevision<T extends BaseRevision> = Omit<
  T,
  "_id" | "revision_id" | "created_at" | "revision_created_at" | "updated_at"
>;

/**
 * Helper type for update operations (partial entity data)
 */
export type RevisionUpdate<T> = Partial<T>;
