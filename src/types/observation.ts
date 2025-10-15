export interface PhotoWithMetadata {
  id: string
  file: File
  preview: string
  description: string
  location?: {
    latitude: number
    longitude: number
  }
}

export interface ObservationFormData {
  description: string
  location: {
    latitude: number
    longitude: number
  } | null
  photos: PhotoWithMetadata[]
}

// For displaying observations from the API
export interface ObservationPhoto {
  id: string
  url: string
  description?: string
  location?: {
    latitude: number
    longitude: number
  }
}

export interface Observation {
  id: string
  description: string
  location: {
    latitude: number
    longitude: number
  }
  photos: ObservationPhoto[]
  createdAt: string
  createdBy: {
    id: string
    name: string
  }
  canEdit?: boolean
}
