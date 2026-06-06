import { generateSample } from "./generateSample"

describe("generateSample", () => {
    const fixedRandom = () => 0.5

    it("全チャンネルの値とタイムスタンプを含むサンプルを生成する", () => {
        const sample = generateSample({ elapsedMs: 0, timestamp: 1700000000000 }, fixedRandom)
        expect(sample.timestamp).toBe(1700000000000)
        expect(Object.keys(sample.values).sort()).toEqual([
            "current",
            "rpm",
            "temperature",
            "torque",
        ])
    })

    it("同じ入力と乱数からは同じサンプルを生成する(決定的)", () => {
        const input = { elapsedMs: 5000, timestamp: 1700000005000 }
        expect(generateSample(input, fixedRandom)).toEqual(generateSample(input, fixedRandom))
    })

    it("値が物理的に妥当な範囲に収まる", () => {
        for (const elapsedMs of [0, 10_000, 60_000, 600_000]) {
            const { values } = generateSample(
                { elapsedMs, timestamp: 1700000000000 + elapsedMs },
                Math.random,
            )
            expect(values.rpm).toBeGreaterThan(0)
            expect(values.rpm).toBeLessThan(4000)
            expect(values.torque).toBeGreaterThan(0)
            expect(values.temperature).toBeGreaterThan(20)
            expect(values.temperature).toBeLessThan(120)
            expect(values.current).toBeGreaterThan(0)
        }
    })

    it("温度は時間経過とともに上昇する傾向を持つ", () => {
        const early = generateSample({ elapsedMs: 0, timestamp: 0 }, fixedRandom)
        const late = generateSample({ elapsedMs: 600_000, timestamp: 600_000 }, fixedRandom)
        expect(late.values.temperature).toBeGreaterThan(early.values.temperature)
    })
})
