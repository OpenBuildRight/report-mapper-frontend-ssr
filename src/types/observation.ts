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
