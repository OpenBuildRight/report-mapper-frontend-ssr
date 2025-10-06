import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, handleAuthError } from '@/lib/middleware/auth'
import { getObservationRevisionsCollection } from '@/lib/db'
import { Permission } from '@/types/rbac'

/**
 * GET /api/observations/pending
 * Get all submitted but unpublished observations (for moderators)
 */
export async function GET(request: NextRequest) {
  try {
    // Only moderators can view pending observations
    await requirePermission(Permission.READ_ALL_OBSERVATIONS)

    const collection = await getObservationRevisionsCollection()

    // Get all submitted but unpublished observations
    const observations = await collection
      .find({
        submitted: true,
        published: false,
      })
      .sort({ revision_created_at: -1 })
      .toArray()

    // Convert to API format
    const apiObservations = observations.map(obs => ({
      id: obs.observation_id,
      revisionId: obs.revision_id,
      description: obs.description,
      location: obs.location ? {
        latitude: obs.location.coordinates[1],
        longitude: obs.location.coordinates[0],
      } : undefined,
      imageIds: obs.image_ids || [],
      createdAt: obs.created_at.toISOString(),
      revisionCreatedAt: obs.revision_created_at.toISOString(),
      updatedAt: obs.updated_at.toISOString(),
      published: obs.published,
      submitted: obs.submitted,
      owner: obs.owner,
    }))

    return NextResponse.json({
      observations: apiObservations,
      total: apiObservations.length,
    })
  } catch (error) {
    return handleAuthError(error)
  }
}
