import type { Meta, StoryObj } from "@storybook/react";
import ClusterMarker from "./ClusterMarker";

const meta: Meta<typeof ClusterMarker> = {
  title: "Icons/ClusterMarker",
  component: ClusterMarker,
  parameters: {
    layout: "centered",
    backgrounds: {
      default: "dark",
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ClusterMarker>;

export const SmallCluster: Story = {
  args: {
    count: 3,
  },
};

export const MediumCluster: Story = {
  args: {
    count: 15,
  },
};

export const LargeCluster: Story = {
  args: {
    count: 127,
  },
};

export const SingleDigit: Story = {
  args: {
    count: 5,
    color: "#3b82f6",
  },
};

export const DoubleDigit: Story = {
  args: {
    count: 42,
    color: "#8b5cf6",
  },
};

export const TripleDigit: Story = {
  args: {
    count: 999,
    color: "#ef4444",
  },
};

export const CustomSize: Story = {
  args: {
    count: 8,
    size: 60,
    color: "#10b981",
  },
};

export const CustomColors: Story = {
  args: {
    count: 12,
    size: 50,
    color: "#ec4899",
    textColor: "#fef3c7",
  },
};

export const Clickable: Story = {
  args: {
    count: 7,
    onClick: () => alert("Cluster clicked!"),
  },
};

export const CountProgression: Story = {
  render: () => (
    <div className="flex gap-6 items-center">
      <ClusterMarker count={2} color="#3b82f6" />
      <ClusterMarker count={9} color="#3b82f6" />
      <ClusterMarker count={15} color="#8b5cf6" />
      <ClusterMarker count={47} color="#8b5cf6" />
      <ClusterMarker count={156} color="#ef4444" />
    </div>
  ),
};

export const DifferentColors: Story = {
  render: () => (
    <div className="flex gap-4 items-center">
      <ClusterMarker count={5} color="#ef4444" />
      <ClusterMarker count={8} color="#f97316" />
      <ClusterMarker count={12} color="#eab308" />
      <ClusterMarker count={15} color="#10b981" />
      <ClusterMarker count={20} color="#3b82f6" />
      <ClusterMarker count={25} color="#8b5cf6" />
      <ClusterMarker count={30} color="#ec4899" />
    </div>
  ),
};

export const DifferentSizes: Story = {
  render: () => (
    <div className="flex gap-4 items-center">
      <ClusterMarker count={10} size={30} color="#3b82f6" />
      <ClusterMarker count={10} size={40} color="#3b82f6" />
      <ClusterMarker count={10} size={50} color="#3b82f6" />
      <ClusterMarker count={10} size={60} color="#3b82f6" />
      <ClusterMarker count={10} size={70} color="#3b82f6" />
    </div>
  ),
};

export const HeatmapStyle: Story = {
  render: () => (
    <div className="flex gap-6 items-center">
      <div className="flex flex-col items-center gap-2">
        <ClusterMarker count={3} size={40} color="#10b981" />
        <span className="text-sm text-gray-400">Low</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <ClusterMarker count={12} size={48} color="#eab308" />
        <span className="text-sm text-gray-400">Medium</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <ClusterMarker count={45} size={56} color="#f97316" />
        <span className="text-sm text-gray-400">High</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <ClusterMarker count={200} size={64} color="#ef4444" />
        <span className="text-sm text-gray-400">Very High</span>
      </div>
    </div>
  ),
};

export const MapExample: Story = {
  render: () => (
    <div className="flex gap-8 items-center flex-wrap">
      <div className="flex flex-col items-center gap-2">
        <ClusterMarker
          count={5}
          color="#3b82f6"
          onClick={() => alert("Zoom to cluster")}
        />
        <span className="text-xs text-gray-400">Click to zoom</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <ClusterMarker
          count={15}
          color="#8b5cf6"
          onClick={() => alert("Zoom to cluster")}
        />
        <span className="text-xs text-gray-400">Click to zoom</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <ClusterMarker
          count={89}
          color="#ef4444"
          onClick={() => alert("Zoom to cluster")}
        />
        <span className="text-xs text-gray-400">Click to zoom</span>
      </div>
    </div>
  ),
};

export const WithBadge: Story = {
  render: () => (
    <div className="relative inline-block">
      <ClusterMarker count={42} size={50} color="#3b82f6" />
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
        !
      </span>
    </div>
  ),
};
