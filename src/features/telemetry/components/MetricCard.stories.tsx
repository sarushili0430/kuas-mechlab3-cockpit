import type { Meta, StoryObj } from "@storybook/react-vite"
import type { ChannelConfig } from "../types"
import { MetricCard } from "./MetricCard"

const temperatureConfig: ChannelConfig = {
    id: "temperature",
    label: "モーター温度",
    unit: "°C",
    precision: 1,
    thresholds: { warning: 70, critical: 85 },
}

const meta = {
    title: "Telemetry/MetricCard",
    component: MetricCard,
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
} satisfies Meta<typeof MetricCard>

export default meta
type Story = StoryObj<typeof meta>

export const Normal: Story = {
    args: {
        reading: {
            config: temperatureConfig,
            stats: { latest: 62.3, min: 45.1, max: 65.7, mean: 55.5 },
            status: "normal",
        },
    },
}

export const Warning: Story = {
    args: {
        reading: {
            config: temperatureConfig,
            stats: { latest: 74.8, min: 45.1, max: 74.8, mean: 60.2 },
            status: "warning",
        },
    },
}

export const Critical: Story = {
    args: {
        reading: {
            config: temperatureConfig,
            stats: { latest: 92.1, min: 45.1, max: 92.1, mean: 70.2 },
            status: "critical",
        },
    },
}

export const NoData: Story = {
    args: {
        reading: {
            config: temperatureConfig,
            stats: null,
            status: "normal",
        },
    },
}
