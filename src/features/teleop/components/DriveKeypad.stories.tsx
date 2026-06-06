import type { Meta, StoryObj } from "@storybook/react-vite"
import { DriveKeypad } from "./DriveKeypad"

const meta = {
    title: "Teleop/DriveKeypad",
    component: DriveKeypad,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof DriveKeypad>

export default meta
type Story = StoryObj<typeof meta>

export const AllOff: Story = {
    args: { directions: new Set() },
}

export const Forward: Story = {
    args: { directions: new Set(["w"] as const) },
}

export const ForwardLeft: Story = {
    args: { directions: new Set(["w", "a"] as const) },
}

export const BackwardRight: Story = {
    args: { directions: new Set(["s", "d"] as const) },
}
