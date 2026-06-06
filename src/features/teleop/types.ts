/**
 * 正規化済みドライブ軸 (kuas-mechlab3 docs/teleop-client.md)。
 * vx: 前後 [-1, 1] (+前進) / wz: 旋回 [-1, 1] (+左旋回, REP-103)
 */
export interface DriveAxes {
    readonly vx: number
    readonly wz: number
}

/** WebSocket 操縦チャネルの接続状態 */
export type TeleopStatus = "idle" | "connecting" | "open" | "reconnecting"

/** teleop クライアントの購読スナップショット */
export interface TeleopSnapshot {
    readonly status: TeleopStatus
    readonly axes: DriveAxes
}
