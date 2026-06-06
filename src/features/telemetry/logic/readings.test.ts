import { CHANNEL_CONFIGS } from "../constants"
import type { TelemetrySample } from "../types"
import { buildReadings, toChartPoints, worstStatus } from "./readings"

const sampleAt = (
    timestamp: number,
    values: Partial<TelemetrySample["values"]> = {},
): TelemetrySample => ({
    timestamp,
    values: { rpm: 2400, torque: 3.5, temperature: 50, current: 6, ...values },
})

describe("worstStatus", () => {
    it("空なら normal を返す", () => {
        expect(worstStatus([])).toBe("normal")
    })

    it("全て normal なら normal を返す", () => {
        expect(worstStatus(["normal", "normal"])).toBe("normal")
    })

    it("warning が混ざれば warning を返す", () => {
        expect(worstStatus(["normal", "warning", "normal"])).toBe("warning")
    })

    it("critical が1つでもあれば critical を返す", () => {
        expect(worstStatus(["normal", "warning", "critical"])).toBe("critical")
    })
})

describe("buildReadings", () => {
    it("全チャンネル分の reading を構築する", () => {
        const readings = buildReadings([sampleAt(1000)], CHANNEL_CONFIGS)
        expect(readings.map((r) => r.config.id)).toEqual([
            "rpm",
            "torque",
            "temperature",
            "current",
        ])
    })

    it("履歴が空なら stats は null・status は normal", () => {
        const readings = buildReadings([], CHANNEL_CONFIGS)
        for (const reading of readings) {
            expect(reading.stats).toBeNull()
            expect(reading.status).toBe("normal")
        }
    })

    it("最新値でステータスを判定する(温度85°C以上 → critical)", () => {
        const readings = buildReadings(
            [sampleAt(1000, { temperature: 60 }), sampleAt(2000, { temperature: 90 })],
            CHANNEL_CONFIGS,
        )
        const temperature = readings.find((r) => r.config.id === "temperature")
        expect(temperature?.status).toBe("critical")
        expect(temperature?.stats?.latest).toBe(90)
    })
})

describe("toChartPoints", () => {
    it("先頭サンプルからの経過時間ラベルと値に変換する", () => {
        const history = [
            sampleAt(10_000, { rpm: 2400 }),
            sampleAt(11_000, { rpm: 2500 }),
            sampleAt(71_000, { rpm: 2450 }),
        ]
        expect(toChartPoints(history, "rpm")).toEqual([
            { time: "00:00", value: 2400 },
            { time: "00:01", value: 2500 },
            { time: "01:01", value: 2450 },
        ])
    })

    it("空履歴なら空配列を返す", () => {
        expect(toChartPoints([], "rpm")).toEqual([])
    })
})
