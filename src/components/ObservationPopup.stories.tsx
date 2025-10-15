import type { Meta, StoryObj } from "@storybook/nextjs";
import type { Observation } from "@/types/observation";
import ObservationPopup from "./ObservationPopup";

const meta = {
  title: "Components/ObservationPopup",
  component: ObservationPopup,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ObservationPopup>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockObservation: Observation = {
  id: "1",
  description:
    "Beautiful sunset observation with multiple photos taken from different angles. The colors were absolutely stunning and the weather was perfect.",
  location: {
    latitude: 43.0731,
    longitude: -89.4012,
  },
  photos: [
    {
      id: "p1",
      url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500",
      description: "Main sunset view from the observation point",
      location: {
        latitude: 43.0731,
        longitude: -89.4012,
      },
    },
    {
      id: "p2",
      url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=500",
      description: "Close-up of the sun on the horizon",
      location: {
        latitude: 43.0732,
        longitude: -89.4013,
      },
    },
    {
      id: "p3",
      url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=500",
      description: "Silhouette of trees against the sunset",
    },
  ],
  createdAt: "2025-01-15T18:30:00Z",
  createdBy: {
    id: "user1",
    name: "John Doe",
  },
  canEdit: false,
};

const mockObservationWithEdit: Observation = {
  ...mockObservation,
  id: "2",
  canEdit: true,
};

export const Default: Story = {
  args: {
    observation: mockObservation,
    onClose: () => console.log("Close clicked"),
  },
};

export const WithEditPermission: Story = {
  args: {
    observation: mockObservationWithEdit,
    onClose: () => console.log("Close clicked"),
  },
};

export const SinglePhoto: Story = {
  args: {
    observation: {
      ...mockObservation,
      photos: [mockObservation.photos[0]],
    },
    onClose: () => console.log("Close clicked"),
  },
};

export const NoPhotoLocations: Story = {
  args: {
    observation: {
      ...mockObservation,
      photos: mockObservation.photos.map((p) => ({
        ...p,
        location: undefined,
      })),
    },
    onClose: () => console.log("Close clicked"),
  },
};
