import type { Meta, StoryObj } from '@storybook/react'
import PhotoUploadStep from './PhotoUploadStep'
import { PhotoWithMetadata } from '@/types/observation'
import { useState } from 'react'

const meta: Meta<typeof PhotoUploadStep> = {
  title: 'Observation/PhotoUploadStep',
  component: PhotoUploadStep,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof PhotoUploadStep>

const mockPhotos: PhotoWithMetadata[] = [
  {
    id: '1',
    file: new File([''], 'mountain.jpg', { type: 'image/jpeg' }),
    preview: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
    description: 'Mountain landscape with snow peaks',
    location: {
      latitude: 37.7749,
      longitude: -122.4194
    }
  },
  {
    id: '2',
    file: new File([''], 'nature.jpg', { type: 'image/jpeg' }),
    preview: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400',
    description: 'Forest trail in autumn',
  },
]

export const Empty: Story = {
  args: {
    photos: [],
    onPhotosChange: (photos) => console.log('Photos changed:', photos),
  },
}

export const WithPhotos: Story = {
  args: {
    photos: mockPhotos,
    onPhotosChange: (photos) => console.log('Photos changed:', photos),
  },
}

export const Interactive: Story = {
  render: () => {
    const [photos, setPhotos] = useState<PhotoWithMetadata[]>(mockPhotos)

    return (
      <PhotoUploadStep
        photos={photos}
        onPhotosChange={setPhotos}
      />
    )
  },
}
