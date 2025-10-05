import type { Meta, StoryObj } from '@storybook/react'
import ReviewStep from './ReviewStep'
import { ObservationFormData } from '@/types/observation'

const meta: Meta<typeof ReviewStep> = {
  title: 'Observation/ReviewStep',
  component: ReviewStep,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof ReviewStep>

const mockFormData: ObservationFormData = {
  description: 'Observed a large flock of migratory birds heading south. The weather was clear with light winds from the northwest. Birds were flying in a V-formation at approximately 500 feet altitude. Estimated count: 150-200 birds.',
  location: {
    latitude: 37.7749,
    longitude: -122.4194
  },
  photos: [
    {
      id: '1',
      file: new File([''], 'birds.jpg', { type: 'image/jpeg' }),
      preview: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=400',
      description: 'Birds in V-formation',
      location: {
        latitude: 37.7749,
        longitude: -122.4194
      }
    },
    {
      id: '2',
      file: new File([''], 'closeup.jpg', { type: 'image/jpeg' }),
      preview: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=400',
      description: 'Close-up of the flock',
      location: {
        latitude: 37.7849,
        longitude: -122.4094
      }
    },
    {
      id: '3',
      file: new File([''], 'landscape.jpg', { type: 'image/jpeg' }),
      preview: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      description: 'Landscape view',
    },
  ]
}

const mockFormDataMinimal: ObservationFormData = {
  description: 'Quick observation note.',
  location: {
    latitude: 40.7128,
    longitude: -74.0060
  },
  photos: [
    {
      id: '1',
      file: new File([''], 'photo.jpg', { type: 'image/jpeg' }),
      preview: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      description: '',
    },
  ]
}

export const Complete: Story = {
  args: {
    formData: mockFormData,
  },
}

export const Minimal: Story = {
  args: {
    formData: mockFormDataMinimal,
  },
}

export const NoPhotos: Story = {
  args: {
    formData: {
      description: 'Observation without photos for documentation purposes.',
      location: {
        latitude: 51.5074,
        longitude: -0.1278
      },
      photos: []
    },
  },
}
