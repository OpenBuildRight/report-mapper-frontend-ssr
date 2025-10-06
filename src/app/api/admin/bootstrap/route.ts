import { NextResponse } from 'next/server'
import { bootstrapUsers } from '@/lib/bootstrap'
import { getUserByEmail } from '@/lib/users'

/**
 * POST /api/admin/bootstrap
 * Manually trigger user bootstrap (DEV ONLY - remove auth check for debugging)
 */
export async function POST() {
  try {
    console.log('Manually triggering bootstrap...')
    await bootstrapUsers()

    // Check alice's roles after bootstrap
    const alice = await getUserByEmail('alice@domain.com')
    console.log('Alice after bootstrap:', alice)

    return NextResponse.json({
      success: true,
      message: 'User bootstrap completed',
      alice: alice ? {
        email: alice.email,
        name: alice.name,
        roles: alice.roles,
      } : null,
    })
  } catch (error) {
    console.error('Bootstrap error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
