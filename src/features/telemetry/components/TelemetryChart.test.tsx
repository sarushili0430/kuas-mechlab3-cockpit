import { render, screen } from "@testing-library/react"
import type { ChannelConfig, TelemetrySample } from "../types"
import { TelemetryChart } from "./TelemetryChart"

const rpmConfig: ChannelConfig = {
    id: "rpm",
    label: "回転数",
    unit: "rpm",
    precision: 0,
    thresholds: { warning: 2600, critical: 2900 },
}

const history: readonly TelemetrySample[] = [0, 1000, 2000].map((timestamp, i) => ({
    timestamp,
    values: { rpm: 2400 + i * 50, torque: 3.5, temperature: 50, current: 6 },
}))

describe("TelemetryChart", () => {
    it("チャンネル名を含むタイトルを表示する", () => {
        render(<TelemetryChart history={history} config={rpmConfig} />)
        expect(screen.getByText(/回転数/)).toBeInTheDocument()
    })

    it("履歴が空ならプレースホルダメッセージを表示する", () => {
        render(<TelemetryChart history={[]} config={rpmConfig} />)
        expect(screen.getByText("計測を開始するとトレンドが表示されます")).toBeInTheDocument()
    })

    it("スナップショットと一致する", () => {
        const { container } = render(<TelemetryChart history={history} config={rpmConfig} />)
        expect(container).toMatchSnapshot()
    })
})
