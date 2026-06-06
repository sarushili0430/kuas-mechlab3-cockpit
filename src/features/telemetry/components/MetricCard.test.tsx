import { render, screen } from "@testing-library/react"
import type { ChannelReading } from "../types"
import { MetricCard } from "./MetricCard"

const baseReading: ChannelReading = {
    config: {
        id: "temperature",
        label: "モーター温度",
        unit: "°C",
        precision: 1,
        thresholds: { warning: 70, critical: 85 },
    },
    stats: { latest: 62.34, min: 45.1, max: 65.7, mean: 55.5 },
    status: "normal",
}

describe("MetricCard", () => {
    it("チャンネル名・最新値・単位を表示する", () => {
        render(<MetricCard reading={baseReading} />)
        expect(screen.getByText("モーター温度")).toBeInTheDocument()
        expect(screen.getByText("62.3")).toBeInTheDocument()
        expect(screen.getByText("°C")).toBeInTheDocument()
    })

    it("最小・平均・最大の統計値を precision に従って表示する", () => {
        render(<MetricCard reading={baseReading} />)
        expect(screen.getByText("45.1")).toBeInTheDocument()
        expect(screen.getByText("55.5")).toBeInTheDocument()
        expect(screen.getByText("65.7")).toBeInTheDocument()
    })

    it("stats が null なら最新値と統計3つをプレースホルダ表示する", () => {
        render(<MetricCard reading={{ ...baseReading, stats: null }} />)
        expect(screen.getAllByText("--")).toHaveLength(4)
    })

    it("通常時のスナップショットと一致する", () => {
        const { container } = render(<MetricCard reading={baseReading} />)
        expect(container).toMatchSnapshot()
    })

    it("危険時のスナップショットと一致する", () => {
        const { container } = render(
            <MetricCard
                reading={{
                    ...baseReading,
                    stats: { latest: 92.1, min: 45.1, max: 92.1, mean: 70.2 },
                    status: "critical",
                }}
            />,
        )
        expect(container).toMatchSnapshot()
    })
})
