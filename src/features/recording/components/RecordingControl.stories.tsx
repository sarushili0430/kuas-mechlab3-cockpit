import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
import type { EpisodeLabel } from "../types"
import { RecordingControl } from "./RecordingControl"

const meta = {
    title: "Recording/RecordingControl",
    component: RecordingControl,
    parameters: {
        layout: "centered",
    },
    args: {
        status: "idle",
        episode: null,
        error: null,
        label: "success",
        onLabelChange: () => undefined,
        onStart: () => undefined,
        onStop: () => undefined,
        onDiscard: () => undefined,
    },
    tags: ["autodocs"],
} satisfies Meta<typeof RecordingControl>

export default meta
type Story = StoryObj<typeof meta>

export const Idle: Story = {}

export const Starting: Story = {
    args: { status: "starting" },
}

export const Recording: Story = {
    args: { status: "recording", episode: "20260703-120000_route-a_003" },
}

export const ErrorState: Story = {
    args: { status: "error", error: "unreachable" },
}

/** 録画中に成功/失敗ラベルを切り替えられるデモ */
function InteractiveControl() {
    const [label, setLabel] = useState<EpisodeLabel>("success")
    return (
        <RecordingControl
            status="recording"
            episode="20260703-120000_route-a_003"
            error={null}
            label={label}
            onLabelChange={setLabel}
            onStart={() => undefined}
            onStop={() => undefined}
            onDiscard={() => undefined}
        />
    )
}

export const Interactive: Story = {
    render: () => <InteractiveControl />,
}
