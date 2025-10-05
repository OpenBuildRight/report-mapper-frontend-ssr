import HomePage from '@/components/HomePage'
import { Observation } from '@/types/observation'

// TODO: Fetch observations from API
// For now using mock data
const mockObservations: Observation[] = [
  {
    id: '1',
    description: 'Beautiful sunset observation near Madison, Wisconsin',
    location: {
      latitude: 43.0731,
      longitude: -89.4012,
    },
    photos: [
      {
        id: 'p1',
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500',
        description: 'Main sunset view from the observation point',
        location: {
          latitude: 43.0731,
          longitude: -89.4012,
        },
      },
      {
        id: 'p2',
        url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=500',
        description: 'Close-up of the sun',
      },
    ],
    createdAt: '2025-01-15T18:30:00Z',
    createdBy: {
      id: 'user1',
      name: 'John Doe',
    },
    canEdit: false,
  },
]

export default function Home() {
  return <HomePage observations={mockObservations} />
}
