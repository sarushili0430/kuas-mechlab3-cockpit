import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
import type { ArmDirection } from "../types"
import { ArmKeypad } from "./ArmKeypad"

const meta = {
    title: "Arm/ArmKeypad",
    component: ArmKeypad,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof ArmKeypad>

export default meta
type Story = StoryObj<typeof meta>

export const AllOff: Story = {
    args: { directions: new Set() },
}

export const ElbowUp: Story = {
    args: { directions: new Set(["up"] as const) },
}

export const ShoulderAndElbow: Story = {
    args: { directions: new Set(["up", "left"] as const) },
}

/** 押下/解放で操作できるタッチ対応版。点灯は押下中の方向を表す。 */
function InteractiveKeypad() {
    const [pressed, setPressed] = useState<ReadonlySet<ArmDirection>>(new Set())
    return (
        <ArmKeypad
            directions={pressed}
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

/** 実際に押してジョグできるデモ(スマホのタッチでも反応する) */
export const Interactive: Story = {
    args: { directions: new Set() },
    render: () => <InteractiveKeypad />,
}
