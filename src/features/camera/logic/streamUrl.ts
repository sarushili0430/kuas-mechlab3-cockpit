import { MJPEG_PORT } from "../constants"

/**
 * MJPEG ストリームの URL を組み立てる。
 * トピックは本体の正本実装 (kuas-mechlab3 docs/cockpit.html) と同じく
 * エンコードせずそのまま埋め込む(mjpeg_server がこの形式で待ち受ける)。
 */
export function buildStreamUrl(host: string, topic: string): string {
    return `http://${host}:${String(MJPEG_PORT)}/stream?topic=${topic}`
}
