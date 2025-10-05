import type { Meta, StoryObj } from '@storybook/react'
import MapMarkerWithLabel from './MapMarkerWithLabel'

const meta: Meta<typeof MapMarkerWithLabel> = {
  title: 'Icons/MapMarkerWithLabel',
  component: MapMarkerWithLabel,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof MapMarkerWithLabel>

export const WithNumber: Story = {
  args: {
    label: 1,
    size: 48,
    color: '#ef4444',
  },
}

export const WithText: Story = {
  args: {
    label: 'A',
    size: 48,
    color: '#3b82f6',
  },
}

export const TwoDigitNumber: Story = {
  args: {
    label: 42,
    size: 48,
    color: '#10b981',
  },
}

export const LongText: Story = {
  args: {
    label: 'AB',
    size: 56,
    color: '#8b5cf6',
    labelSize: 'sm',
  },
}

export const SmallLabel: Story = {
  args: {
    label: 5,
    size: 48,
    color: '#f97316',
    labelSize: 'sm',
  },
}

export const LargeLabel: Story = {
  args: {
    label: 9,
    size: 48,
    color: '#ec4899',
    labelSize: 'lg',
  },
}

export const CustomLabelColor: Story = {
  args: {
    label: '★',
    size: 48,
    color: '#eab308',
    labelColor: '#000000',
  },
}

export const NumberedSequence: Story = {
  render: () => (
    <div className="flex gap-4 items-end">
      <MapMarkerWithLabel label={1} size={40} color="#ef4444" />
      <MapMarkerWithLabel label={2} size={40} color="#f97316" />
      <MapMarkerWithLabel label={3} size={40} color="#eab308" />
      <MapMarkerWithLabel label={4} size={40} color="#10b981" />
      <MapMarkerWithLabel label={5} size={40} color="#3b82f6" />
    </div>
  ),
}

export const AlphabetSequence: Story = {
  render: () => (
    <div className="flex gap-4 items-end">
      <MapMarkerWithLabel label="A" size={40} color="#ef4444" />
      <MapMarkerWithLabel label="B" size={40} color="#f97316" />
      <MapMarkerWithLabel label="C" size={40} color="#eab308" />
      <MapMarkerWithLabel label="D" size={40} color="#10b981" />
      <MapMarkerWithLabel label="E" size={40} color="#3b82f6" />
    </div>
  ),
}

export const DifferentSizes: Story = {
  render: () => (
    <div className="flex gap-4 items-end">
      <MapMarkerWithLabel label={1} size={24} color="#3b82f6" />
      <MapMarkerWithLabel label={2} size={32} color="#3b82f6" />
      <MapMarkerWithLabel label={3} size={48} color="#3b82f6" />
      <MapMarkerWithLabel label={4} size={64} color="#3b82f6" />
      <MapMarkerWithLabel label={5} size={80} color="#3b82f6" />
    </div>
  ),
}

export const PhotoLocations: Story = {
  render: () => (
    <div className="flex gap-4 flex-wrap">
      <MapMarkerWithLabel label="📷" size={48} color="#3b82f6" labelSize="lg" />
      <MapMarkerWithLabel label="1" size={40} color="#3b82f6" />
      <MapMarkerWithLabel label="2" size={40} color="#3b82f6" />
      <MapMarkerWithLabel label="3" size={40} color="#3b82f6" />
    </div>
  ),
}

export const ObservationMarker: Story = {
  render: () => (
    <div className="flex gap-6 items-end">
      <div className="flex flex-col items-center gap-2">
        <MapMarkerWithLabel label="🎯" size={64} color="#ef4444" labelSize="lg" />
        <span className="text-sm text-gray-400">Observation</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <MapMarkerWithLabel label="1" size={40} color="#3b82f6" />
        <span className="text-sm text-gray-400">Photo 1</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <MapMarkerWithLabel label="2" size={40} color="#3b82f6" />
        <span className="text-sm text-gray-400">Photo 2</span>
      </div>
    </div>
  ),
}

export const NoLabel: Story = {
  args: {
    size: 48,
    color: '#8b5cf6',
  },
}
