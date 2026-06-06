import type { TelemetrySample, Thresholds } from "../types"
import { appendSample, computeStats, evaluateStatus, extractChannelSeries } from "./telemetry"

const sampleAt = (timestamp: number, rpm = 2400): TelemetrySample => ({
    timestamp,
    values: { rpm, torque: 3.5, temperature: 50, current: 6 },
})

describe("evaluateStatus", () => {
    const thresholds: Thresholds = { warning: 70, critical: 85 }

    it("warning 未満なら normal を返す", () => {
        expect(evaluateStatus(69.9, thresholds)).toBe("normal")
    })

    it("warning ちょうどなら warning を返す(境界値)", () => {
        expect(evaluateStatus(70, thresholds)).toBe("warning")
    })

    it("warning と critical の間なら warning を返す", () => {
        expect(evaluateStatus(80, thresholds)).toBe("warning")
    })

    it("critical ちょうどなら critical を返す(境界値)", () => {
        expect(evaluateStatus(85, thresholds)).toBe("critical")
    })

    it("critical を超えたら critical を返す", () => {
        expect(evaluateStatus(100, thresholds)).toBe("critical")
    })
})

describe("computeStats", () => {
    it("空配列なら null を返す", () => {
        expect(computeStats([])).toBeNull()
    })

    it("1件なら全統計値がその値になる", () => {
        expect(computeStats([42])).toEqual({ latest: 42, min: 42, max: 42, mean: 42 })
    })

    it("複数件の min / max / mean / latest を計算する", () => {
        expect(computeStats([10, 30, 20])).toEqual({
            latest: 20,
            min: 10,
            max: 30,
            mean: 20,
        })
    })

    it("mean は算術平均を返す", () => {
        expect(computeStats([10, 20])?.mean).toBe(15)
    })
})

describe("appendSample", () => {
    it("末尾にサンプルを追加する", () => {
        const history = [sampleAt(1)]
        const next = appendSample(history, sampleAt(2), 10)
        expect(next.map((s) => s.timestamp)).toEqual([1, 2])
    })

    it("元の配列を変更しない(イミュータブル)", () => {
        const history = [sampleAt(1)]
        appendSample(history, sampleAt(2), 10)
        expect(history).toHaveLength(1)
    })

    it("maxLength を超えたら最古のサンプルを捨てる", () => {
        const history = [sampleAt(1), sampleAt(2), sampleAt(3)]
        const next = appendSample(history, sampleAt(4), 3)
        expect(next.map((s) => s.timestamp)).toEqual([2, 3, 4])
    })

    it("maxLength ちょうどまでは全件保持する(境界値)", () => {
        const history = [sampleAt(1), sampleAt(2)]
        const next = appendSample(history, sampleAt(3), 3)
        expect(next.map((s) => s.timestamp)).toEqual([1, 2, 3])
    })
})

describe("extractChannelSeries", () => {
    it("指定チャンネルの値を時系列順に取り出す", () => {
        const history = [sampleAt(1, 2400), sampleAt(2, 2500), sampleAt(3, 2450)]
        expect(extractChannelSeries(history, "rpm")).toEqual([2400, 2500, 2450])
    })

    it("空履歴なら空配列を返す", () => {
        expect(extractChannelSeries([], "rpm")).toEqual([])
    })
})
