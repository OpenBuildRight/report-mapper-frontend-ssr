import type { Meta, StoryObj } from "@storybook/nextjs";
import type { Observation } from "@/types/observation";
import ObservationMap from "./ObservationMap";

const meta = {
  title: "Components/ObservationMap",
  component: ObservationMap,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ObservationMap>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockObservations: Observation[] = [
  {
    id: "1",
    description: "Beautiful sunset observation near Madison, Wisconsin",
    location: {
      latitude: 43.0731,
      longitude: -89.4012,
    },
    photos: [
      {
        id: "p1",
        url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500",
        description: "Main sunset view",
        location: {
          latitude: 43.0731,
          longitude: -89.4012,
        },
      },
    ],
    createdAt: "2025-01-15T18:30:00Z",
    createdBy: {
      id: "user1",
      name: "John Doe",
    },
    canEdit: false,
  },
  {
    id: "2",
    description: "Mountain hiking trail observation",
    location: {
      latitude: 43.085,
      longitude: -89.39,
    },
    photos: [
      {
        id: "p2",
        url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=500",
        description: "Mountain trail",
        location: {
          latitude: 43.085,
          longitude: -89.39,
        },
      },
      {
        id: "p3",
        url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=500",
        description: "Trail marker",
      },
    ],
    createdAt: "2025-01-14T10:00:00Z",
    createdBy: {
      id: "user2",
      name: "Jane Smith",
    },
    canEdit: true,
  },
  {
    id: "3",
    description: "Lake observation with wildlife",
    location: {
      latitude: 43.06,
      longitude: -89.42,
    },
    photos: [
      {
        id: "p4",
        url: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=500",
        description: "Lake view",
        location: {
          latitude: 43.06,
          longitude: -89.42,
        },
      },
    ],
    createdAt: "2025-01-13T15:45:00Z",
    createdBy: {
      id: "user3",
      name: "Bob Johnson",
    },
    canEdit: false,
  },
];

export const MultipleObservations: Story = {
  args: {
    observations: mockObservations,
  },
};

export const SingleObservation: Story = {
  args: {
    observations: [mockObservations[0]],
  },
};

export const NoObservations: Story = {
  args: {
    observations: [],
    center: { latitude: 43.0731, longitude: -89.4012 },
    zoom: 10,
  },
};

export const ManyObservations: Story = {
  args: {
    observations: [
      ...mockObservations,
      {
        id: "4",
        description: "Forest observation",
        location: { latitude: 43.05, longitude: -89.38 },
        photos: [],
        createdAt: "2025-01-12T09:00:00Z",
        createdBy: { id: "user4", name: "Alice Williams" },
        canEdit: false,
      },
      {
        id: "5",
        description: "Beach observation",
        location: { latitude: 43.09, longitude: -89.41 },
        photos: [],
        createdAt: "2025-01-11T14:30:00Z",
        createdBy: { id: "user5", name: "Charlie Brown" },
        canEdit: false,
      },
    ],
  },
};
