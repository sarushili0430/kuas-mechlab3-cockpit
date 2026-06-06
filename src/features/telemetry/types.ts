/** 計測チャンネルの識別子 */
export type ChannelId = "rpm" | "torque" | "temperature" | "current"

/** 1回のサンプリングで得られる全チャンネルの計測値 */
export interface TelemetrySample {
    /** 計測時刻 (Unix epoch ms) */
    readonly timestamp: number
    readonly values: Readonly<Record<ChannelId, number>>
}

/** チャンネルの状態判定結果 */
export type ChannelStatus = "normal" | "warning" | "critical"

/** 状態判定のしきい値(値がしきい値以上で該当ステータス) */
export interface Thresholds {
    readonly warning: number
    readonly critical: number
}

/** チャンネルの表示・判定設定 */
export interface ChannelConfig {
    readonly id: ChannelId
    readonly label: string
    readonly unit: string
    /** 表示する小数点以下の桁数 */
    readonly precision: number
    readonly thresholds: Thresholds
}

/** チャンネルの統計値 */
export interface ChannelStats {
    readonly latest: number
    readonly min: number
    readonly max: number
    readonly mean: number
}

/** Presentational コンポーネントに渡すチャンネル1件分の表示データ */
export interface ChannelReading {
    readonly config: ChannelConfig
    readonly stats: ChannelStats | null
    readonly status: ChannelStatus
}
