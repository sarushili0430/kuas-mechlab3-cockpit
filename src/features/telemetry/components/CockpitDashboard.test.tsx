import { render, screen, within } from "@testing-library/react"
import { CHANNEL_CONFIGS } from "../constants"
import { buildReadings } from "../logic/readings"
import type { TelemetrySample } from "../types"
import { CockpitDashboard } from "./CockpitDashboard"

const buildHistory = (temperature: number): readonly TelemetrySample[] => [
    {
        timestamp: 0,
        values: { rpm: 2400, torque: 3.5, temperature: 50, current: 6 },
    },
    {
        timestamp: 1000,
        values: { rpm: 2450, torque: 3.6, temperature, current: 6.2 },
    },
]

const defaultProps = {
    isRunning: false,
    elapsedMs: 0,
    onStart: vi.fn(),
    onStop: vi.fn(),
    onReset: vi.fn(),
}

const propsWith = (history: readonly TelemetrySample[]) => ({
    ...defaultProps,
    history,
    readings: buildReadings(history, CHANNEL_CONFIGS),
})

describe("CockpitDashboard", () => {
    it("タイトルを表示する", () => {
        render(<CockpitDashboard {...propsWith([])} />)
        expect(screen.getByRole("heading", { name: "KUAS MechLab3 Cockpit" })).toBeInTheDocument()
    })

    it("全チャンネルのカードを表示する", () => {
        render(<CockpitDashboard {...propsWith(buildHistory(50))} />)
        const metrics = within(screen.getByRole("region", { name: "計測値" }))
        for (const label of ["回転数", "トルク", "モーター温度", "電流"]) {
            expect(metrics.getByText(label)).toBeInTheDocument()
        }
    })

    it("critical なチャンネルがあれば警報を表示する", () => {
        render(<CockpitDashboard {...propsWith(buildHistory(90))} />)
        const alert = screen.getByRole("alert")
        expect(alert).toHaveTextContent("モーター温度")
    })

    it("critical なチャンネルがなければ警報を表示しない", () => {
        render(<CockpitDashboard {...propsWith(buildHistory(50))} />)
        expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    })

    it("計測前のスナップショットと一致する", () => {
        const { container } = render(<CockpitDashboard {...propsWith([])} />)
        expect(container).toMatchSnapshot()
    })

    it("計測データ表示中のスナップショットと一致する", () => {
        const { container } = render(
            <CockpitDashboard {...propsWith(buildHistory(90))} isRunning elapsedMs={61_000} />,
        )
        expect(container).toMatchSnapshot()
    })
})
