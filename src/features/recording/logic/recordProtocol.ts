import type { EpisodeLabel } from "../types"

/**
 * record_server から受け取った録画状態 (成功レスポンスの正規化結果)。
 * start / status は recording=true/false、stop は saved、discard は episode を返すが、
 * ここではどれも「録画中か・対象エピソード名・次の番号」の 3 点へ畳み込む。
 */
export interface RecordState {
    readonly recording: boolean
    readonly episode: string | null
    readonly index: number | null
}

/** record_server レスポンスの解析結果 (成功 or エラー) */
export type RecordResult =
    | { readonly ok: true; readonly state: RecordState }
    | { readonly ok: false; readonly error: string }

function asRecord(data: unknown): Record<string, unknown> | null {
    if (typeof data !== "object" || data === null) {
        return null
    }
    return data as Record<string, unknown>
}

function readString(value: unknown): string | null {
    return typeof value === "string" ? value : null
}

function readNumber(value: unknown): number | null {
    return typeof value === "number" && Number.isFinite(value) ? value : null
}

/**
 * record_server の JSON レスポンスを RecordResult へ解析する (純粋)。
 *
 * - `{recording: null, error}` (already_recording など) → エラー
 * - それ以外のオブジェクト → 状態 (episode は status/discard の `episode`、
 *   stop の `saved` のいずれかを採用)
 * - オブジェクトでない/壊れた値 → `invalid_response` エラー
 */
export function parseRecordResponse(data: unknown): RecordResult {
    const record = asRecord(data)
    if (record === null) {
        return { ok: false, error: "invalid_response" }
    }
    const error = readString(record.error)
    if (error !== null) {
        return { ok: false, error }
    }
    return {
        ok: true,
        state: {
            recording: record.recording === true,
            episode: readString(record.episode) ?? readString(record.saved),
            index: readNumber(record.index),
        },
    }
}

/** `/record/start` の任意の上書き (route / operator)。未指定キーは送らない */
export interface StartOptions {
    readonly route?: string
    readonly operator?: string
}

/** start リクエストボディを組み立てる (未指定フィールドは省く → サーバ既定を使う) */
export function startBody(options: StartOptions = {}): Record<string, string> {
    const body: Record<string, string> = {}
    if (options.route !== undefined) {
        body.route = options.route
    }
    if (options.operator !== undefined) {
        body.operator = options.operator
    }
    return body
}

/** stop リクエストボディを組み立てる (label 必須、notes は空なら省く) */
export function stopBody(label: EpisodeLabel, notes?: string): Record<string, string> {
    const body: Record<string, string> = { label }
    if (notes !== undefined && notes.trim() !== "") {
        body.notes = notes.trim()
    }
    return body
}
