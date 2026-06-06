import type { TelemetrySample } from "../types"

export interface SampleInput {
    /** 計測開始からの経過時間 (ms) */
    readonly elapsedMs: number
    /** サンプルに記録する時刻 (Unix epoch ms) */
    readonly timestamp: number
}

/** -1.0〜1.0 のノイズを生成する */
const noise = (random: () => number): number => random() * 2 - 1

/**
 * モーター実験を模したテレメトリサンプルを生成する純粋関数。
 * 乱数生成器を注入することで決定的にテストできる。
 */
export function generateSample(input: SampleInput, random: () => number): TelemetrySample {
    const t = input.elapsedMs

    // 回転数: 約2400rpm を中心にゆっくり揺らぐ
    const rpm = 2400 + 180 * Math.sin(t / 8000) + 120 * noise(random)

    // トルク: 約3.4N·m を中心に変動
    const torque = 3.4 + 0.5 * Math.sin(t / 6000 + 1) + 0.3 * noise(random)

    // モーター温度: 45°C から運転時間とともに上昇し、最大+30°C で飽和
    const temperature = 45 + Math.min(30, t / 20000) + 2 * Math.sin(t / 5000) + noise(random)

    // 電流: 約5.8A を中心に変動
    const current = 5.8 + 0.8 * Math.sin(t / 7000 + 2) + 0.5 * noise(random)

    return {
        timestamp: input.timestamp,
        values: { rpm, torque, temperature, current },
    }
}
