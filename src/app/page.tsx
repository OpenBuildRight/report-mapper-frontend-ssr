import HomePage from '@/components/HomePage'
import { Observation } from '@/types/observation'
import { observationController } from '@/lib/actions/observations'
import { getAuthContext } from '@/lib/middleware/auth'
import { canEditEntity } from '@/lib/rbac-generic'

async function getObservations(): Promise<Observation[]> {
  try {
    // Get auth context for permission-aware filtering
    const authContext = await getAuthContext()

    // Fetch observations directly from controller (no HTTP call!)
    const observations = await observationController.searchObjects(
      undefined, // userId filter (undefined = all users)
      true,      // published only for non-privileged users (controller handles this)
      undefined  // no additional filter
    )

    // Transform to UI format
    return observations.map((obs) => ({
      id: obs.itemId,
      description: obs.description || '',
      location: obs.location ? {
        latitude: obs.location.coordinates[1],
        longitude: obs.location.coordinates[0]
      } : undefined,
      photos: obs.imageIds?.map((img, index) => ({
        id: img.id,
        url: `/api/images/${img.id}/file?revisionId=${img.revisionId}`,
        description: `Photo ${index + 1}`,
        location: undefined,
      })) || [],
      createdAt: obs.createdAt?.toISOString() || new Date().toISOString(),
      createdBy: {
        id: obs.owner,
        name: 'User', // TODO: Fetch user info
      },
      canEdit: canEditEntity(authContext.roles, obs, authContext.userId),
    }))
  } catch (error) {
    console.error('Error fetching observations:', error)
    return []
  }
}

export default async function Home() {
  const observations = await getObservations()

  return <HomePage observations={observations} />
}
