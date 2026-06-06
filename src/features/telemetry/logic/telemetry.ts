import type { ChannelId, ChannelStats, ChannelStatus, TelemetrySample, Thresholds } from "../types"

/**
 * 計測値をしきい値と比較して状態を判定する。
 * 値がしきい値以上で該当ステータスになる。
 */
export function evaluateStatus(value: number, thresholds: Thresholds): ChannelStatus {
    if (value >= thresholds.critical) {
        return "critical"
    }
    if (value >= thresholds.warning) {
        return "warning"
    }
    return "normal"
}

/**
 * 時系列の計測値から統計値を計算する。
 * 空の場合は null を返す。
 */
export function computeStats(values: readonly number[]): ChannelStats | null {
    const latest = values.at(-1)
    if (latest === undefined) {
        return null
    }
    const sum = values.reduce((acc, value) => acc + value, 0)
    return {
        latest,
        min: Math.min(...values),
        max: Math.max(...values),
        mean: sum / values.length,
    }
}

/**
 * 履歴の末尾にサンプルを追加する。
 * maxLength を超える場合は最古のサンプルから捨てる(リングバッファ)。
 */
export function appendSample(
    history: readonly TelemetrySample[],
    sample: TelemetrySample,
    maxLength: number,
): readonly TelemetrySample[] {
    return [...history, sample].slice(-maxLength)
}

/** 履歴から指定チャンネルの値を時系列順に取り出す */
export function extractChannelSeries(
    history: readonly TelemetrySample[],
    channelId: ChannelId,
): readonly number[] {
    return history.map((sample) => sample.values[channelId])
}
