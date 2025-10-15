import type { Meta, StoryObj } from "@storybook/nextjs";
import MenuIcon from "./MenuIcon";

const meta = {
  title: "Components/Icons/MenuIcon",
  component: MenuIcon,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="bg-gray-800 p-4 rounded-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MenuIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default size
export const Default: Story = {
  args: {
    className: "w-6 h-6 text-white",
  },
};

// Small
export const Small: Story = {
  args: {
    className: "w-4 h-4 text-white",
  },
};

// Large
export const Large: Story = {
  args: {
    className: "w-8 h-8 text-white",
  },
};

// Extra Large
export const ExtraLarge: Story = {
  args: {
    className: "w-12 h-12 text-white",
  },
};

// Different colors
export const Blue: Story = {
  args: {
    className: "w-6 h-6 text-blue-500",
  },
};

export const Green: Story = {
  args: {
    className: "w-6 h-6 text-green-500",
  },
};

export const Red: Story = {
  args: {
    className: "w-6 h-6 text-red-500",
  },
};
