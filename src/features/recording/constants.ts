/** 録画コントロール HTTP API の既定ポート (kuas-mechlab3 record_server) */
export const RECORD_PORT = 9002

/** record_server のエンドポイント (kuas-mechlab3 record_control) */
export const RECORD_PATHS = {
    status: "/record/status",
    start: "/record/start",
    stop: "/record/stop",
    discard: "/record/discard",
} as const

/**
 * 録画コントロール API のベース URL を組み立てる。
 * 操縦チャネル (ws://<host>:9001) と同じホストの別ポートに立つ HTTP。
 */
export function buildRecordUrl(host: string): string {
    return `http://${host}:${String(RECORD_PORT)}`
}
