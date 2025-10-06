import HomePage from '@/components/HomePage'
import { Observation } from '@/types/observation'

async function getObservations(): Promise<Observation[]> {
  try {
    // Fetch from our API (server-side in this Server Component)
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/observations`, {
      cache: 'no-store', // Don't cache so we always get fresh data
    })

    if (!response.ok) {
      console.error('Failed to fetch observations:', response.status)
      return []
    }

    const data = await response.json()

    // Transform API response to match our Observation type
    const observations: Observation[] = data.observations.map((obs: any) => ({
      id: obs.id,
      description: obs.description || '',
      location: obs.location,
      photos: obs.imageIds?.map((img: any, index: number) => ({
        id: img.id,
        url: '', // TODO: Get actual image URLs from MinIO
        description: `Photo ${index + 1}`,
        location: undefined,
      })) || [],
      createdAt: obs.createdAt,
      createdBy: {
        id: obs.owner,
        name: 'User', // TODO: Fetch user info
      },
      canEdit: obs.canEdit,
    }))

    return observations
  } catch (error) {
    console.error('Error fetching observations:', error)
    return []
  }
}

export default async function Home() {
  const observations = await getObservations()

  return <HomePage observations={observations} />
}
