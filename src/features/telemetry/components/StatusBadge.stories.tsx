import type { Meta, StoryObj } from "@storybook/react-vite"
import { StatusBadge } from "./StatusBadge"

const meta = {
    title: "Telemetry/StatusBadge",
    component: StatusBadge,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof StatusBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Normal: Story = {
    args: { status: "normal" },
}

export const Warning: Story = {
    args: { status: "warning" },
}

export const Critical: Story = {
    args: { status: "critical" },
}
