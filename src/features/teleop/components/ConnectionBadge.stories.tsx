import type { Meta, StoryObj } from "@storybook/react-vite"
import { ConnectionBadge } from "./ConnectionBadge"

const meta = {
    title: "Teleop/ConnectionBadge",
    component: ConnectionBadge,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof ConnectionBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Idle: Story = {
    args: { status: "idle" },
}

export const Connecting: Story = {
    args: { status: "connecting" },
}

export const Open: Story = {
    args: { status: "open" },
}

export const Reconnecting: Story = {
    args: { status: "reconnecting" },
}
