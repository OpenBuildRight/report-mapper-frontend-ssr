import type { Meta, StoryObj } from "@storybook/nextjs";
import MapMarkerIcon from "./MapMarkerIcon";

const meta: Meta<typeof MapMarkerIcon> = {
  title: "Icons/MapMarkerIcon",
  component: MapMarkerIcon,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof MapMarkerIcon>;

export const Default: Story = {
  args: {},
};

export const Small: Story = {
  args: {
    size: 16,
  },
};

export const Medium: Story = {
  args: {
    size: 32,
  },
};

export const Large: Story = {
  args: {
    size: 64,
  },
};

export const Red: Story = {
  args: {
    size: 32,
    color: "#ef4444",
  },
};

export const Blue: Story = {
  args: {
    size: 32,
    color: "#3b82f6",
  },
};

export const Green: Story = {
  args: {
    size: 32,
    color: "#10b981",
  },
};

export const WithClassName: Story = {
  args: {
    size: 32,
    className: "text-purple-500",
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <MapMarkerIcon size={16} color="#3b82f6" />
      <MapMarkerIcon size={24} color="#3b82f6" />
      <MapMarkerIcon size={32} color="#3b82f6" />
      <MapMarkerIcon size={48} color="#3b82f6" />
      <MapMarkerIcon size={64} color="#3b82f6" />
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div className="flex gap-4">
      <MapMarkerIcon size={32} color="#ef4444" />
      <MapMarkerIcon size={32} color="#f97316" />
      <MapMarkerIcon size={32} color="#eab308" />
      <MapMarkerIcon size={32} color="#10b981" />
      <MapMarkerIcon size={32} color="#3b82f6" />
      <MapMarkerIcon size={32} color="#8b5cf6" />
      <MapMarkerIcon size={32} color="#ec4899" />
    </div>
  ),
};
