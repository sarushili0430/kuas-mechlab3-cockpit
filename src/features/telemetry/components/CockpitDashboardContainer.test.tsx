import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { TelemetryMonitor, UseTelemetryMonitor } from "../hooks/useTelemetryMonitor"
import { createSimulatedTelemetrySource } from "../lib/telemetrySource"
import type { TelemetrySample } from "../types"
import { CockpitDashboardContainer } from "./CockpitDashboardContainer"

const history: readonly TelemetrySample[] = [
    {
        timestamp: 0,
        values: { rpm: 2400, torque: 3.5, temperature: 50, current: 6 },
    },
    {
        timestamp: 1000,
        values: { rpm: 2450, torque: 3.6, temperature: 51, current: 6.1 },
    },
]

const buildMonitor = (overrides: Partial<TelemetryMonitor> = {}): TelemetryMonitor => ({
    isRunning: false,
    history,
    elapsedMs: 0,
    start: vi.fn(),
    stop: vi.fn(),
    reset: vi.fn(),
    ...overrides,
})

const renderContainer = (monitor: TelemetryMonitor) => {
    const source = createSimulatedTelemetrySource()
    const useFakeTelemetry: UseTelemetryMonitor = () => monitor
    return render(<CockpitDashboardContainer source={source} useTelemetry={useFakeTelemetry} />)
}

describe("CockpitDashboardContainer", () => {
    it("注入したフックの状態から表示データを導出して描画する", () => {
        renderContainer(buildMonitor())
        // rpm の平均 (2400+2450)/2 = 2425 が統計として導出・表示される
        expect(screen.getByText("2425")).toBeInTheDocument()
        expect(screen.getByRole("button", { name: "計測開始" })).toBeInTheDocument()
    })

    it("操作がフックの操作関数へ委譲される", async () => {
        const user = userEvent.setup()
        const monitor = buildMonitor()
        renderContainer(monitor)

        await user.click(screen.getByRole("button", { name: "計測開始" }))

        expect(monitor.start).toHaveBeenCalledTimes(1)
    })

    it("稼働中は停止操作が委譲される", async () => {
        const user = userEvent.setup()
        const monitor = buildMonitor({ isRunning: true })
        renderContainer(monitor)

        await user.click(screen.getByRole("button", { name: "停止" }))

        expect(monitor.stop).toHaveBeenCalledTimes(1)
    })
})
