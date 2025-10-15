import { type Collection, Db, type Filter, ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { Permission, ROLE_PERMISSIONS, Role } from "@/types/rbac";

export interface RevisionDocument {
  _id?: ObjectId;
  itemId: string;
  revisionId: number;
  published: boolean;
  submitted: boolean;
  owner: string;
  createdAt?: Date;
  updatedAt?: Date;
  revisionCreatedAt?: Date;
}

export class NotFoundError extends Error {}
export class NotAuthorizedError extends Error {}

/**
 * UserAuthContext - uses permissions (not roles) for cleaner access control
 */
interface UserAuthContext {
  userId?: string;
  permissions: Permission[];
}

/**
 * Get user authentication context with resolved permissions
 */
async function getUserAuthContext(): Promise<UserAuthContext> {
  const session = await getServerSession(authOptions);
  let roles = [Role.PUBLIC];

  if (session?.user?.roles) {
    roles = session.user.roles;
  }

  const permissions = roles
    .flatMap((role) => ROLE_PERMISSIONS[role])
    .filter((item) => item != null);

  return {
    userId: session?.user?.id,
    permissions: permissions,
  };
}

async function hasReadAccess(document: RevisionDocument): Promise<boolean> {
  const authContext = await getUserAuthContext();

  return (
    (document.published &&
      authContext.permissions.includes(
        Permission.READ_PUBLISHED_OBSERVATIONS,
      )) ||
    (document.owner === authContext.userId &&
      authContext.permissions.includes(Permission.READ_OWN_OBSERVATIONS)) ||
    authContext.permissions.includes(Permission.READ_ALL_OBSERVATIONS)
  );
}

async function hasEditAccess(document?: RevisionDocument): Promise<boolean> {
  const authContext = await getUserAuthContext();

  if (!document) {
    // Creating new document
    return authContext.permissions.includes(Permission.EDIT_OWN_OBSERVATIONS);
  }

  return (
    document.owner === authContext.userId &&
    authContext.permissions.includes(Permission.EDIT_OWN_OBSERVATIONS)
  );
}

async function hasDeleteAccess(document: RevisionDocument): Promise<boolean> {
  const authContext = await getUserAuthContext();

  return (
    (document.owner === authContext.userId &&
      authContext.permissions.includes(Permission.DELETE_OWN_OBSERVATIONS)) ||
    authContext.permissions.includes(Permission.DELETE_ALL_OBSERVATIONS)
  );
}

async function hasPublishAccess(document: RevisionDocument): Promise<boolean> {
  const authContext = await getUserAuthContext();

  return (
    (document.owner === authContext.userId &&
      authContext.permissions.includes(Permission.PUBLISH_OWN_OBSERVATIONS)) ||
    authContext.permissions.includes(Permission.PUBLISH_ALL_OBSERVATIONS)
  );
}

export class RevisionController<S, T extends RevisionDocument & S> {
  private collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  async getCollection(): Promise<Collection<T>> {
    const db = await getDb();
    return db.collection(this.collectionName);
  }

  /**
   * Lightweight method to fetch only access control fields
   * Use this for permission checks to avoid fetching unnecessary data
   */
  private async getRevisionMetadata(
    itemId: string,
    revisionId: number,
  ): Promise<RevisionDocument> {
    const collection = await this.getCollection();
    const document = await collection.findOne({ itemId, revisionId } as any, {
      projection: {
        itemId: 1,
        revisionId: 1,
        published: 1,
        submitted: 1,
        owner: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    });

    if (!document) {
      throw new NotFoundError(`Revision ${revisionId} not found for ${itemId}`);
    }

    return document as RevisionDocument;
  }

  /**
   * Lightweight method to fetch latest revision metadata only
   */
  private async getLatestRevisionMetadata(
    itemId: string,
  ): Promise<RevisionDocument> {
    const collection = await this.getCollection();
    const revisions = await collection
      .find({ itemId } as any, {
        projection: {
          itemId: 1,
          revisionId: 1,
          published: 1,
          submitted: 1,
          owner: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      })
      .sort({ revisionId: -1 })
      .limit(1)
      .toArray();

    if (!revisions || revisions.length < 1) {
      throw new NotFoundError(`No revisions found for ${itemId}`);
    }

    return revisions[0] as RevisionDocument;
  }

  async getLatestRevision(itemId: string): Promise<T> {
    const collection = await this.getCollection();
    const revisions = await collection
      .find({ itemId } as any)
      .sort({ revisionId: -1 })
      .limit(1)
      .toArray();

    if (!revisions || revisions.length < 1) {
      throw new NotFoundError(`No revisions found for ${itemId}`);
    }

    const document = revisions[0] as T;

    if (!(await hasReadAccess(document))) {
      throw new NotAuthorizedError(
        `User does not have read access to ${itemId}`,
      );
    }

    return document;
  }

  async createRevision(id: string, data: S): Promise<T> {
    // It is OK if the user included submit here. Submit is just a type of edit.
    const latestRevision = await this.getLatestRevision(id);

    if (!(await hasEditAccess(latestRevision))) {
      throw new NotAuthorizedError(`User does not have edit access to ${id}`);
    }

    const collection = await this.getCollection();
    const newRevisionData = {
      ...latestRevision,
      ...data,
      itemId: id,
      revisionId: latestRevision.revisionId + 1,
      published: false,
      updatedAt: Date.now(),
    };

    // Remove _id from the data to insert (MongoDB will generate it)
    const { _id, ...dataToInsert } = newRevisionData;

    const result = await collection.insertOne(dataToInsert as any);
    if (!result.acknowledged) {
      throw new Error(`Failed to create revision for ${id}`);
    }

    // Return what we inserted plus the generated _id
    return {
      ...dataToInsert,
      _id: result.insertedId,
    } as T;
  }

  async getRevision(itemId: string, revisionId: number): Promise<T> {
    const collection = await this.getCollection();
    const document = await collection.findOne({ itemId, revisionId } as any);

    if (!document) {
      throw new NotFoundError(`Revision ${revisionId} not found for ${itemId}`);
    }

    if (!(await hasReadAccess(document))) {
      throw new NotAuthorizedError(`User does not have read access`);
    }

    return document as T;
  }

  async createObject(data: S): Promise<T> {
    const authContext = await getUserAuthContext();

    if (!(await hasEditAccess())) {
      throw new NotAuthorizedError(
        "User does not have permission to create objects",
      );
    }

    if (!authContext.userId) {
      throw new NotAuthorizedError("User ID required to create objects");
    }

    const collection = await this.getCollection();
    const now = new Date();

    const newObject = {
      ...data,
      itemId: new ObjectId().toHexString(),
      revisionId: 0,
      published: false,
      submitted: true,
      owner: authContext.userId,
      createdAt: now,
      updatedAt: now,
      revisionCreatedAt: now,
    } as any;

    const { _id, ...dataToInsert } = newObject;

    const result = await collection.insertOne(dataToInsert as any);
    if (!result.acknowledged) {
      throw new Error("Failed to create object");
    }

    return {
      ...dataToInsert,
      _id: result.insertedId,
    } as T;
  }

  async deleteRevision(itemId: string, revisionId: number): Promise<void> {
    // Use lightweight metadata check
    const metadata = await this.getRevisionMetadata(itemId, revisionId);

    if (!(await hasDeleteAccess(metadata))) {
      throw new NotAuthorizedError(
        "User does not have permission to delete this revision",
      );
    }

    if (metadata.published) {
      throw new Error("Cannot delete published revision");
    }

    const collection = await this.getCollection();
    await collection.deleteOne({ itemId, revisionId } as any);
  }

  async deleteObject(itemId: string): Promise<void> {
    // Use lightweight metadata check on latest revision
    const latestMetadata = await this.getLatestRevisionMetadata(itemId);

    if (!(await hasDeleteAccess(latestMetadata))) {
      throw new NotAuthorizedError(
        "User does not have permission to delete this object",
      );
    }

    // Delete all revisions
    const collection = await this.getCollection();
    await collection.deleteMany({ itemId } as any);
  }

  async updateRevision(
    itemId: string,
    revisionId: number,
    data: Partial<S>,
  ): Promise<T> {
    // Use lightweight metadata check
    const metadata = await this.getRevisionMetadata(itemId, revisionId);

    if (!(await hasEditAccess(metadata))) {
      throw new NotAuthorizedError(
        "User does not have permission to edit this revision",
      );
    }

    if (metadata.published) {
      throw new Error("Cannot update published revision");
    }

    const collection = await this.getCollection();
    await collection.updateOne({ itemId, revisionId } as any, {
      $set: { ...data, updatedAt: new Date() } as any,
    });

    // Fetch and return the full updated document
    return await this.getRevision(itemId, revisionId);
  }

  async publishRevision(itemId: string, revisionId: number): Promise<T> {
    // Use lightweight metadata check
    const metadata = await this.getRevisionMetadata(itemId, revisionId);

    if (!(await hasPublishAccess(metadata))) {
      throw new NotAuthorizedError(
        "User does not have permission to publish this revision",
      );
    }

    const collection = await this.getCollection();

    // Unpublish all other revisions for this item
    await collection.updateMany({ itemId, published: true } as any, {
      $set: { published: false, updatedAt: new Date() } as any,
    });

    // Publish this revision
    await collection.updateOne({ itemId, revisionId } as any, {
      $set: { published: true, submitted: true, updatedAt: new Date() } as any,
    });

    // Fetch and return the full updated document
    return await this.getRevision(itemId, revisionId);
  }

  async searchObjects(
    userId?: string,
    published?: boolean,
    filter?: Filter<T>,
  ): Promise<T[]> {
    const authContext = await getUserAuthContext();
    const collection = await this.getCollection();

    // Build base query
    const query: Filter<T> = { ...filter } as any;

    // Apply permission-based filtering
    const hasReadAll = authContext.permissions.includes(
      Permission.READ_ALL_OBSERVATIONS,
    );

    if (!hasReadAll) {
      // Non-privileged users can only see:
      // 1. Published observations
      // 2. Their own unpublished observations
      const conditions: any[] = [];

      if (published !== false) {
        conditions.push({ published: true });
      }

      if (userId || authContext.userId) {
        conditions.push({ owner: userId || authContext.userId });
      }

      if (conditions.length > 0) {
        (query as any).$or = conditions;
      } else {
        // If no conditions apply, only show published
        (query as any).published = true;
      }
    } else {
      // Admins/moderators can filter by userId and published directly
      if (userId !== undefined) {
        query.owner = userId as any;
      }
      if (published !== undefined) {
        query.published = published as any;
      }
    }

    const results = await collection.find(query).toArray();

    // Filter results based on read permissions
    const filtered = await Promise.all(
      results.map(async (doc) => ((await hasReadAccess(doc)) ? doc : null)),
    );

    return filtered.filter((doc) => doc !== null) as T[];
  }
}
