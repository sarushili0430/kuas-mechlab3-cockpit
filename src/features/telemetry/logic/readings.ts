import type {
    ChannelConfig,
    ChannelId,
    ChannelReading,
    ChannelStatus,
    TelemetrySample,
} from "../types"
import { formatElapsedTime } from "./format"
import { computeStats, evaluateStatus, extractChannelSeries } from "./telemetry"

const STATUS_SEVERITY: Readonly<Record<ChannelStatus, number>> = {
    normal: 0,
    warning: 1,
    critical: 2,
}

/** 複数ステータスのうち最も深刻なものを返す */
export function worstStatus(statuses: readonly ChannelStatus[]): ChannelStatus {
    return statuses.reduce<ChannelStatus>(
        (worst, status) => (STATUS_SEVERITY[status] > STATUS_SEVERITY[worst] ? status : worst),
        "normal",
    )
}

/** 履歴とチャンネル設定から Presentational 向けの表示データを構築する */
export function buildReadings(
    history: readonly TelemetrySample[],
    configs: readonly ChannelConfig[],
): readonly ChannelReading[] {
    return configs.map((config) => {
        const stats = computeStats(extractChannelSeries(history, config.id))
        return {
            config,
            stats,
            status: stats === null ? "normal" : evaluateStatus(stats.latest, config.thresholds),
        }
    })
}

/** チャート描画用の点 */
export interface ChartPoint {
    /** 先頭サンプルからの経過時間ラベル ("MM:SS") */
    readonly time: string
    readonly value: number
}

/** 履歴を指定チャンネルのチャート描画用データに変換する */
export function toChartPoints(
    history: readonly TelemetrySample[],
    channelId: ChannelId,
): readonly ChartPoint[] {
    const first = history[0]
    if (first === undefined) {
        return []
    }
    return history.map((sample) => ({
        time: formatElapsedTime(sample.timestamp - first.timestamp),
        value: sample.values[channelId],
    }))
}
