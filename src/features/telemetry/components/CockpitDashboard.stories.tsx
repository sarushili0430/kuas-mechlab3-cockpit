import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { CHANNEL_CONFIGS } from "../constants"
import { buildReadings } from "../logic/readings"
import type { TelemetrySample } from "../types"
import { CockpitDashboard } from "./CockpitDashboard"

/** sin 波ベースの決定的な履歴データを生成する */
const buildHistory = (count: number, temperatureOffset = 0): readonly TelemetrySample[] =>
    Array.from({ length: count }, (_, i) => ({
        timestamp: i * 500,
        values: {
            rpm: 2400 + 180 * Math.sin(i / 6),
            torque: 3.4 + 0.5 * Math.sin(i / 5 + 1),
            temperature: 48 + i * 0.4 + temperatureOffset + 2 * Math.sin(i / 4),
            current: 5.8 + 0.8 * Math.sin(i / 7 + 2),
        },
    }))

const meta = {
    title: "Telemetry/CockpitDashboard",
    component: CockpitDashboard,
    parameters: {
        layout: "fullscreen",
    },
    args: {
        onStart: fn(),
        onStop: fn(),
        onReset: fn(),
    },
} satisfies Meta<typeof CockpitDashboard>

export default meta
type Story = StoryObj<typeof meta>

const idleHistory: readonly TelemetrySample[] = []
const runningHistory = buildHistory(60)
const criticalHistory = buildHistory(60, 25)

export const Idle: Story = {
    args: {
        isRunning: false,
        elapsedMs: 0,
        history: idleHistory,
        readings: buildReadings(idleHistory, CHANNEL_CONFIGS),
    },
}

export const Running: Story = {
    args: {
        isRunning: true,
        elapsedMs: 30_000,
        history: runningHistory,
        readings: buildReadings(runningHistory, CHANNEL_CONFIGS),
    },
}

export const CriticalAlert: Story = {
    args: {
        isRunning: true,
        elapsedMs: 30_000,
        history: criticalHistory,
        readings: buildReadings(criticalHistory, CHANNEL_CONFIGS),
    },
}
