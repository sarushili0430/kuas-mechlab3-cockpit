/**
 * ロボットの MJPEG サーバ (ポート 8080) から静止画を 1 枚取得する。
 *
 * ストリームは multipart/x-mixed-replace、境界は `ml3frame`、各パートは
 * Content-Length 付きの独立 JPEG (kuas-mechlab3 camera/mjpeg.py)。単フレーム用の
 * エンドポイントは無いので、ストリームを開いて 1 パート揃うまで読み、その JPEG を返す。
 */
import { Buffer } from "node:buffer"
import type { LlmImage } from "./llm"

const BOUNDARY = Buffer.from("--ml3frame")
const HEADER_END = Buffer.from("\r\n\r\n")
const SOI = Buffer.from([0xff, 0xd8])
const EOI = Buffer.from([0xff, 0xd9])
const MAX_BYTES = 8 * 1024 * 1024

export class CameraError extends Error {}

/** ストリームのチャンク (型定義上は any) を安全に Buffer へ。 */
function toBuffer(chunk: unknown): Buffer {
    if (chunk instanceof Uint8Array) {
        return Buffer.from(chunk)
    }
    throw new CameraError("unexpected non-binary chunk in camera stream")
}

function parseContentLength(header: Buffer): number | null {
    const match = /content-length:\s*(\d+)/i.exec(header.toString("latin1"))
    if (match === null) {
        return null
    }
    const value = Number.parseInt(match[1] ?? "", 10)
    return Number.isNaN(value) ? null : value
}

function extractByMarkers(buf: Buffer, offset: number): Buffer | null {
    const soi = buf.indexOf(SOI, offset)
    if (soi === -1) {
        return null
    }
    const eoi = buf.indexOf(EOI, soi + 2)
    if (eoi === -1) {
        return null
    }
    return buf.subarray(soi, eoi + 2)
}

/** MJPEG バッファから最初の完全な JPEG を返す。まだ足りなければ null。 */
export function extractFirstJpeg(buf: Buffer): Buffer | null {
    const start = buf.indexOf(BOUNDARY)
    if (start === -1) {
        return extractByMarkers(buf, 0)
    }
    const headerEnd = buf.indexOf(HEADER_END, start)
    if (headerEnd === -1) {
        return null
    }
    const contentLength = parseContentLength(buf.subarray(start, headerEnd))
    const bodyStart = headerEnd + HEADER_END.length
    if (contentLength === null) {
        return extractByMarkers(buf, bodyStart)
    }
    const bodyEnd = bodyStart + contentLength
    if (buf.length < bodyEnd) {
        return null
    }
    return buf.subarray(bodyStart, bodyEnd)
}

/** MJPEG ストリームに接続し、最初の 1 フレームを LlmImage (base64 JPEG) で返す。 */
export async function fetchFrame(
    streamUrl: string,
    options: { readonly timeoutMs?: number } = {},
): Promise<LlmImage> {
    const timeoutMs = options.timeoutMs ?? 10_000
    const controller = new AbortController()
    const timer = setTimeout(() => {
        controller.abort()
    }, timeoutMs)
    try {
        const response = await fetch(streamUrl, { signal: controller.signal })
        if (!response.ok) {
            throw new CameraError(`camera stream returned HTTP ${String(response.status)}`)
        }
        if (response.body === null) {
            throw new CameraError("camera stream had no body")
        }
        const reader = response.body.getReader()
        const chunks: Buffer[] = []
        let total = 0
        try {
            for (;;) {
                const result = await reader.read()
                if (result.done) {
                    break
                }
                const part = toBuffer(result.value)
                chunks.push(part)
                total += part.length
                const jpeg = extractFirstJpeg(Buffer.concat(chunks))
                if (jpeg !== null) {
                    return { mediaType: "image/jpeg", base64: jpeg.toString("base64") }
                }
                if (total > MAX_BYTES) {
                    throw new CameraError("no complete MJPEG frame early in the stream")
                }
            }
        } finally {
            reader.releaseLock()
        }
        throw new CameraError("stream ended before a complete frame")
    } finally {
        clearTimeout(timer)
    }
}
