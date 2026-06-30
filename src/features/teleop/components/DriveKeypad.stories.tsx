import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
import { activeDirectionsFromAxes, axesFromKeys, type DriveCommandKey } from "../logic/axes"
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

/** 押下/解放で操作できるタッチ対応版。点灯は送信中の軸から導出する。 */
function InteractiveKeypad() {
    const [pressed, setPressed] = useState<ReadonlySet<DriveCommandKey>>(new Set())
    return (
        <DriveKeypad
            directions={activeDirectionsFromAxes(axesFromKeys(pressed))}
            onPress={(direction) => {
                setPressed((prev) => new Set(prev).add(direction))
            }}
            onRelease={(direction) => {
                setPressed((prev) => {
                    const next = new Set(prev)
                    next.delete(direction)
                    return next
                })
            }}
        />
    )
}

/** 実際に押して操縦できるデモ(スマホのタッチでも反応する) */
export const Interactive: Story = {
    args: { directions: new Set() },
    render: () => <InteractiveKeypad />,
}
