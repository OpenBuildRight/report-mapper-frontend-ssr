import { type Collection, Db, ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { COLLECTIONS, type UserDocument } from "@/types/models";
import { Permission, Role } from "@/types/rbac";

class NotFoundError extends Error {}
class NotAuthorizedError extends Error {}

/**
 * UserController - manages users and their roles (not versioned)
 */
export class UserController {
  private collectionName = COLLECTIONS.USERS;

  private async getCollection(): Promise<Collection<UserDocument>> {
    const db = await getDb();
    return db.collection(this.collectionName);
  }

  private async requireAdminPermission(): Promise<void> {
    const session = await getServerSession(authOptions);

    if (!session?.user?.roles) {
      throw new NotAuthorizedError("Authentication required");
    }

    const roles = session.user.roles as Role[];

    // Check if user has SECURITY_ADMIN role
    if (!roles.includes(Role.SECURITY_ADMIN)) {
      throw new NotAuthorizedError(
        "Admin permission required to manage user roles",
      );
    }
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<UserDocument | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ id: userId });
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<UserDocument | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ email });
  }

  /**
   * Get user roles
   */
  async getUserRoles(userId: string): Promise<Role[]> {
    const user = await this.getUser(userId);
    if (!user) {
      return [Role.PUBLIC];
    }
    return user.roles as Role[];
  }

  /**
   * Assign role to user
   */
  async assignRole(userId: string, role: Role): Promise<void> {
    await this.requireAdminPermission();

    const collection = await this.getCollection();
    const user = await this.getUser(userId);

    if (!user) {
      throw new NotFoundError(`User ${userId} not found`);
    }

    // Add role if not already present
    if (!user.roles.includes(role)) {
      await collection.updateOne(
        { id: userId },
        {
          $addToSet: { roles: role },
          $set: { updatedAt: new Date() },
        },
      );
    }
  }

  /**
   * Remove role from user
   */
  async removeRole(userId: string, role: Role): Promise<void> {
    await this.requireAdminPermission();

    const collection = await this.getCollection();
    const user = await this.getUser(userId);

    if (!user) {
      throw new NotFoundError(`User ${userId} not found`);
    }

    await collection.updateOne(
      { id: userId },
      {
        $pull: { roles: role },
        $set: { updatedAt: new Date() },
      },
    );
  }

  /**
   * Set user roles (replaces all existing roles)
   */
  async setUserRoles(userId: string, roles: Role[]): Promise<void> {
    await this.requireAdminPermission();

    const collection = await this.getCollection();
    const user = await this.getUser(userId);

    if (!user) {
      throw new NotFoundError(`User ${userId} not found`);
    }

    await collection.updateOne(
      { id: userId },
      {
        $set: {
          roles: roles,
          updatedAt: new Date(),
        },
      },
    );
  }

  /**
   * List all users
   */
  async listUsers(): Promise<UserDocument[]> {
    await this.requireAdminPermission();

    const collection = await this.getCollection();
    return await collection.find({}).toArray();
  }

  /**
   * Create a new user
   */
  async createUser(data: {
    id: string;
    email: string;
    name: string;
    password_hash?: string;
    roles?: Role[];
  }): Promise<UserDocument> {
    const collection = await this.getCollection();

    const now = new Date();
    const user: UserDocument = {
      id: data.id,
      email: data.email,
      name: data.name,
      passwordHash: data.password_hash,
      roles: data.roles || [Role.AUTHENTICATED_USER],
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(user as any);

    return {
      ...user,
      _id: result.insertedId,
    };
  }

  /**
   * Update user profile (non-admin users can update their own profile)
   */
  async updateUserProfile(
    userId: string,
    data: { name?: string; email?: string },
  ): Promise<void> {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      throw new NotAuthorizedError("Authentication required");
    }

    // Users can only update their own profile unless they're admin
    const isAdmin = (session.user.roles as Role[])?.includes(
      Role.SECURITY_ADMIN,
    );
    if (session.user.id !== userId && !isAdmin) {
      throw new NotAuthorizedError("Can only update your own profile");
    }

    const collection = await this.getCollection();

    await collection.updateOne(
      { id: userId },
      {
        $set: {
          ...data,
          updatedAt: new Date(),
        },
      },
    );
  }

  /**
   * Delete user (admin only)
   */
  async deleteUser(userId: string): Promise<void> {
    await this.requireAdminPermission();

    const collection = await this.getCollection();
    const result = await collection.deleteOne({ id: userId });

    if (result.deletedCount === 0) {
      throw new NotFoundError(`User ${userId} not found`);
    }
  }
}
