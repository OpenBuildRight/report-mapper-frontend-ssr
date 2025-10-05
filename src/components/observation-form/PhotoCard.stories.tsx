import type { Meta, StoryObj } from '@storybook/react'
import PhotoCard from './PhotoCard'
import { PhotoWithMetadata } from '@/types/observation'

const meta: Meta<typeof PhotoCard> = {
  title: 'Observation/PhotoCard',
  component: PhotoCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof PhotoCard>

const mockPhoto: PhotoWithMetadata = {
  id: '1',
  file: new File([''], 'sample.jpg', { type: 'image/jpeg' }),
  preview: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
  description: 'A beautiful mountain landscape',
  location: {
    latitude: 37.7749,
    longitude: -122.4194
  }
}

const mockPhotoWithoutLocation: PhotoWithMetadata = {
  id: '2',
  file: new File([''], 'sample2.jpg', { type: 'image/jpeg' }),
  preview: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400',
  description: 'Another scenic view',
}

export const WithLocation: Story = {
  args: {
    photo: mockPhoto,
    onRemove: (id) => console.log('Remove photo:', id),
    onUpdateDescription: (id, desc) => console.log('Update description:', id, desc),
  },
}

export const WithoutLocation: Story = {
  args: {
    photo: mockPhotoWithoutLocation,
    onRemove: (id) => console.log('Remove photo:', id),
    onUpdateDescription: (id, desc) => console.log('Update description:', id, desc),
  },
}

export const EmptyDescription: Story = {
  args: {
    photo: {
      ...mockPhoto,
      description: '',
    },
    onRemove: (id) => console.log('Remove photo:', id),
    onUpdateDescription: (id, desc) => console.log('Update description:', id, desc),
  },
}
