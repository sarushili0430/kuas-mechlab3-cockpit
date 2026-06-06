import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { SessionControls } from "./SessionControls"

const meta = {
    title: "Telemetry/SessionControls",
    component: SessionControls,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    args: {
        onStart: fn(),
        onStop: fn(),
        onReset: fn(),
    },
} satisfies Meta<typeof SessionControls>

export default meta
type Story = StoryObj<typeof meta>

export const Stopped: Story = {
    args: {
        isRunning: false,
        elapsedMs: 0,
    },
}

export const Running: Story = {
    args: {
        isRunning: true,
        elapsedMs: 61_000,
    },
}
