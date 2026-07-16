import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
import { ARM_BUTTON_STEP, ARM_HOME } from "../constants"
import { clampAngle } from "../logic/arm"
import type { ArmAngles, ArmDirection, ArmJoint } from "../types"
import { ArmControl } from "./ArmControl"

const meta = {
    title: "Arm/ArmControl",
    component: ArmControl,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof ArmControl>

export default meta
type Story = StoryObj<typeof meta>

export const Home: Story = {
    args: {
        angles: ARM_HOME,
        directions: new Set(),
        onStep: () => undefined,
        onHome: () => undefined,
    },
}

export const Raised: Story = {
    args: {
        angles: { shoulder: 120, elbow: 55 },
        directions: new Set(["up"] as const),
        onStep: () => undefined,
        onHome: () => undefined,
    },
}

/** ボタン/パッドで実際に角度が動くデモ(イージング送信は含まない簡易版) */
function InteractiveArmControl() {
    const [angles, setAngles] = useState<ArmAngles>(ARM_HOME)
    const [directions, setDirections] = useState<ReadonlySet<ArmDirection>>(new Set())

    const step = (joint: ArmJoint, direction: 1 | -1): void => {
        setAngles((prev) => ({
            ...prev,
            [joint]: clampAngle(prev[joint] + ARM_BUTTON_STEP * direction),
        }))
    }

    return (
        <ArmControl
            angles={angles}
            directions={directions}
            onStep={step}
            onHome={() => {
                setAngles(ARM_HOME)
            }}
            onPress={(direction) => {
                setDirections((prev) => new Set(prev).add(direction))
            }}
            onRelease={(direction) => {
                setDirections((prev) => {
                    const next = new Set(prev)
                    next.delete(direction)
                    return next
                })
            }}
        />
    )
}

export const Interactive: Story = {
    args: {
        angles: ARM_HOME,
        directions: new Set(),
        onStep: () => undefined,
        onHome: () => undefined,
    },
    render: () => <InteractiveArmControl />,
}
