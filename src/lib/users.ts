import { getUsersCollection } from './db'
import { UserDocument } from '@/types/models'
import { Role } from '@/types/rbac'
import { isRootUser, getAllRoles } from './rbac'
import { v4 as uuidv4 } from 'uuid'

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<UserDocument | null> {
  const collection = await getUsersCollection()
  return await collection.findOne({ id: userId })
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<UserDocument | null> {
  const collection = await getUsersCollection()
  return await collection.findOne({ email })
}

/**
 * Create a new user
 */
export async function createUser(data: {
  email: string
  name: string
  passwordHash?: string
}): Promise<UserDocument> {
  const collection = await getUsersCollection()

  const now = new Date()
  const user: UserDocument = {
    id: uuidv4(),
    email: data.email,
    name: data.name,
    password_hash: data.passwordHash,
    roles: [], // Start with no assigned roles, will get automatic roles
    created_at: now,
    updated_at: now,
  }

  // If root user, assign security-admin role
  if (isRootUser(data.email)) {
    user.roles = [Role.SECURITY_ADMIN, Role.VALIDATED_USER]
  }

  await collection.insertOne(user)
  return user
}

/**
 * Get all roles for a user (including automatic roles)
 */
export async function getUserRoles(userId: string): Promise<Role[]> {
  const user = await getUserById(userId)
  if (!user) {
    return [Role.PUBLIC] // Unauthenticated users get public role
  }

  const userRoles = user.roles as Role[]
  return getAllRoles(userRoles, true)
}

/**
 * Assign a role to a user
 * Creates the user if they don't exist (with the userId as their id)
 */
export async function assignRole(userId: string, role: Role): Promise<void> {
  const collection = await getUsersCollection()

  // Check if user exists
  const existingUser = await getUserById(userId)

  if (!existingUser) {
    // Create a placeholder user with the given userId
    // This allows setting up users before they first log in
    const now = new Date()
    await collection.insertOne({
      id: userId,
      email: `${userId}@placeholder.local`, // Placeholder email, will be updated on first login
      name: 'User',
      roles: [role],
      created_at: now,
      updated_at: now,
    })
  } else {
    // Update existing user
    await collection.updateOne(
      { id: userId },
      {
        $addToSet: { roles: role },
        $set: { updated_at: new Date() },
      }
    )
  }
}

/**
 * Remove a role from a user
 */
export async function removeRole(userId: string, role: Role): Promise<void> {
  const collection = await getUsersCollection()

  await collection.updateOne(
    { id: userId },
    {
      $pull: { roles: role as any },
      $set: { updated_at: new Date() },
    }
  )
}

/**
 * Update user information
 */
export async function updateUser(
  userId: string,
  data: Partial<Pick<UserDocument, 'name' | 'email'>>
): Promise<void> {
  const collection = await getUsersCollection()

  await collection.updateOne(
    { id: userId },
    {
      $set: {
        ...data,
        updated_at: new Date(),
      },
    }
  )
}
