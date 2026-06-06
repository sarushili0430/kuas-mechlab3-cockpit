/** teleop WebSocket の既定ポート (kuas-mechlab3 teleop_server) */
export const TELEOP_PORT = 9001

/** 指令送信間隔 (ms)。約20Hzで「今の目標速度」を送り続ける */
export const SEND_INTERVAL_MS = 50

/** 切断後に自動再接続を試みるまでの待ち時間 (ms) */
export const RECONNECT_DELAY_MS = 1000

/** teleop WebSocket の接続先 URL を組み立てる */
export function buildTeleopUrl(host: string): string {
    return `ws://${host}:${String(TELEOP_PORT)}`
}
