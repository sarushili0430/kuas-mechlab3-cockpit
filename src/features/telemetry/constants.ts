import type { ChannelConfig } from "./types"

/** 履歴として保持する最大サンプル数 */
export const MAX_HISTORY_LENGTH = 120

/** サンプリング間隔 (ms) */
export const SAMPLING_INTERVAL_MS = 500

/** モーター実験で計測するチャンネル定義 */
export const CHANNEL_CONFIGS: readonly ChannelConfig[] = [
    {
        id: "rpm",
        label: "回転数",
        unit: "rpm",
        precision: 0,
        thresholds: { warning: 2600, critical: 2900 },
    },
    {
        id: "torque",
        label: "トルク",
        unit: "N·m",
        precision: 2,
        thresholds: { warning: 4.2, critical: 4.8 },
    },
    {
        id: "temperature",
        label: "モーター温度",
        unit: "°C",
        precision: 1,
        thresholds: { warning: 70, critical: 85 },
    },
    {
        id: "current",
        label: "電流",
        unit: "A",
        precision: 2,
        thresholds: { warning: 7.5, critical: 9.0 },
    },
]
