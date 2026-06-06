import type { Meta, StoryObj } from "@storybook/react-vite"
import { createSimulatedTelemetrySource } from "../lib/telemetrySource"
import { CockpitDashboardContainer } from "./CockpitDashboardContainer"

const meta = {
    title: "Telemetry/CockpitDashboardContainer",
    component: CockpitDashboardContainer,
    parameters: {
        layout: "fullscreen",
    },
} satisfies Meta<typeof CockpitDashboardContainer>

export default meta
type Story = StoryObj<typeof meta>

/**
 * シミュレーションソースを注入したライブデモ。
 * 「計測開始」を押すとテレメトリが流れ始める。
 */
export const LiveDemo: Story = {
    args: {
        source: createSimulatedTelemetrySource(),
    },
}
