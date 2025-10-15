import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import DescriptionStep from "./DescriptionStep";

const meta: Meta<typeof DescriptionStep> = {
  title: "Observation/DescriptionStep",
  component: DescriptionStep,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof DescriptionStep>;

export const Empty: Story = {
  args: {
    description: "",
    onDescriptionChange: (desc) => console.log("Description changed:", desc),
  },
};

export const WithText: Story = {
  args: {
    description:
      "Observed a large flock of migratory birds heading south. The weather was clear with light winds from the northwest. Birds were flying in a V-formation at approximately 500 feet altitude.",
    onDescriptionChange: (desc) => console.log("Description changed:", desc),
  },
};

export const Interactive: Story = {
  render: () => {
    const [description, setDescription] = useState("");

    return (
      <DescriptionStep
        description={description}
        onDescriptionChange={setDescription}
      />
    );
  },
};
