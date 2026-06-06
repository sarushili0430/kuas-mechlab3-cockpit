import type { Meta, StoryObj } from "@storybook/react-vite"
import { AxesIndicator } from "./AxesIndicator"

const meta = {
    title: "Teleop/AxesIndicator",
    component: AxesIndicator,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    decorators: [
        (Story) => (
            <div className="w-72">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof AxesIndicator>

export default meta
type Story = StoryObj<typeof meta>

export const Stopped: Story = {
    args: { axes: { vx: 0, wz: 0 } },
}

export const ForwardLeft: Story = {
    args: { axes: { vx: 1, wz: 1 } },
}

export const BackwardHalf: Story = {
    args: { axes: { vx: -0.5, wz: -0.25 } },
}
