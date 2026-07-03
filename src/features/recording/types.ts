/**
 * AI データ収集 (エピソード録画) の成否ラベル。
 * kuas-mechlab3 の recording.normalize_label と同じ意味 (success / failure)。
 * 保存時にどちらかを付けて学習データの採否を分ける。
 */
export type EpisodeLabel = "success" | "failure"

/**
 * 録画コントロールの状態。
 * idle: 停止中 / starting: 開始要求中 / recording: 録画中 /
 * stopping: 停止(保存・破棄)要求中 / error: API 到達不可・拒否
 */
export type RecordStatus = "idle" | "starting" | "recording" | "stopping" | "error"

/** 録画クライアントの購読スナップショット */
export interface RecordSnapshot {
    readonly status: RecordStatus
    /** 録画中/直近に保存・破棄したエピソード名 (未取得なら null) */
    readonly episode: string | null
    /** 次に録画するエピソード番号 (未取得なら null) */
    readonly index: number | null
    /** 直近のエラー種別 (正常時は null) */
    readonly error: string | null
}
