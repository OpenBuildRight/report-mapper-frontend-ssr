import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import type { PhotoWithMetadata } from "@/types/observation";
import LocationStep from "./LocationStep";

const meta: Meta<typeof LocationStep> = {
  title: "Observation/LocationStep",
  component: LocationStep,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof LocationStep>;

const mockPhotosWithLocations: PhotoWithMetadata[] = [
  {
    id: "1",
    file: new File([""], "mountain.jpg", { type: "image/jpeg" }),
    preview:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
    description: "Mountain landscape",
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
    },
  },
  {
    id: "2",
    file: new File([""], "nature.jpg", { type: "image/jpeg" }),
    preview:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400",
    description: "Forest trail",
    location: {
      latitude: 37.7849,
      longitude: -122.4094,
    },
  },
];

const mockPhotosWithoutLocations: PhotoWithMetadata[] = [
  {
    id: "1",
    file: new File([""], "photo.jpg", { type: "image/jpeg" }),
    preview:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
    description: "Photo without GPS",
  },
];

export const WithLocation: Story = {
  args: {
    photos: mockPhotosWithLocations,
    location: { latitude: 37.7749, longitude: -122.4194 },
    onLocationChange: (loc) => console.log("Location changed:", loc),
    onPhotoLocationChange: (id, loc) =>
      console.log("Photo location changed:", id, loc),
  },
};

export const NoLocation: Story = {
  args: {
    photos: mockPhotosWithoutLocations,
    location: null,
    onLocationChange: (loc) => console.log("Location changed:", loc),
    onPhotoLocationChange: (id, loc) =>
      console.log("Photo location changed:", id, loc),
  },
};

export const Interactive: Story = {
  render: () => {
    const [location, setLocation] = useState<{
      latitude: number;
      longitude: number;
    } | null>({
      latitude: 37.7749,
      longitude: -122.4194,
    });

    return (
      <LocationStep
        photos={mockPhotosWithLocations}
        location={location}
        onLocationChange={setLocation}
        onPhotoLocationChange={(id, loc) =>
          console.log("Photo location changed:", id, loc)
        }
      />
    );
  },
};
