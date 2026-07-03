import { RECORD_PATHS } from "../constants"
import {
    parseRecordResponse,
    startBody,
    stopBody,
    type RecordResult,
    type StartOptions,
} from "../logic/recordProtocol"
import type { EpisodeLabel, RecordSnapshot } from "../types"

/**
 * 本物の fetch と差し替え可能な最小トランスポート (テスト用 DI)。
 * URL とメソッド/ボディを受け取り、パース済み JSON を返す。
 */
export type RecordTransport = (
    url: string,
    init: { readonly method: "GET" | "POST"; readonly body?: string },
) => Promise<unknown>

/** fetch を RecordTransport へ適合させる既定トランスポート */
const fetchTransport: RecordTransport = async (url, init) => {
    // exactOptionalPropertyTypes 下では body/headers に undefined を渡せないので、
    // ボディがあるときだけフィールドを載せる。
    const requestInit: RequestInit =
        init.body !== undefined
            ? {
                  method: init.method,
                  headers: { "Content-Type": "application/json" },
                  body: init.body,
              }
            : { method: init.method }
    const response = await fetch(url, requestInit)
    return (await response.json()) as unknown
}

export interface RecordClientOptions {
    readonly transport?: RecordTransport
}

/**
 * 録画コントロールの外部データソース。
 * useSyncExternalStore で購読できる subscribe / getSnapshot を提供する。
 */
export interface RecordClient {
    readonly subscribe: (listener: () => void) => () => void
    readonly getSnapshot: () => RecordSnapshot
    /** データ収集を開始する (idle/error のときのみ) */
    readonly start: (baseUrl: string, options?: StartOptions) => Promise<void>
    /** 録画中のエピソードを label 付きで保存して停止する */
    readonly stop: (baseUrl: string, label: EpisodeLabel, notes?: string) => Promise<void>
    /** 録画中のエピソードを破棄して停止する (番号は再利用される) */
    readonly discard: (baseUrl: string) => Promise<void>
    /** サーバの現在状態を取得してスナップショットへ反映する */
    readonly refresh: (baseUrl: string) => Promise<void>
}

const INITIAL_STATE: RecordSnapshot = {
    status: "idle",
    episode: null,
    index: null,
    error: null,
}

/**
 * 録画コントロールクライアントを生成する (kuas-mechlab3 record_server 準拠)。
 *
 * teleop と違い連続ストリームではなく、開始/停止/破棄の単発リクエスト。要求中は
 * starting/stopping、成功で recording/idle、API 到達不可・拒否 (409 等) で error に遷移する。
 * 二度押し (要求中の再要求) は無視する。
 */
export function createRecordClient(options: RecordClientOptions = {}): RecordClient {
    const { transport = fetchTransport } = options

    let state = INITIAL_STATE
    const listeners = new Set<() => void>()

    const notify = (): void => {
        for (const listener of listeners) {
            listener()
        }
    }

    const setState = (next: RecordSnapshot): void => {
        state = next
        notify()
    }

    /** 成功結果を idle/recording へ、失敗結果を error へ落とし込む */
    const applyResult = (result: RecordResult): void => {
        if (!result.ok) {
            // 409 (状態の食い違い) はエラーにせずサーバの実状態へ寄せて自己修復する。
            // 例: リロードや別端末で既に録画中 → start が already_recording を返したら
            // recording として扱い、停止できるようにする。
            if (result.error === "already_recording") {
                setState({ ...state, status: "recording", error: null })
                return
            }
            if (result.error === "not_recording") {
                setState({ ...state, status: "idle", error: null })
                return
            }
            setState({ ...state, status: "error", error: result.error })
            return
        }
        setState({
            status: result.state.recording ? "recording" : "idle",
            episode: result.state.episode,
            index: result.state.index,
            error: null,
        })
    }

    const request = async (
        baseUrl: string,
        path: string,
        method: "GET" | "POST",
        body?: string,
    ): Promise<void> => {
        // body が無いときは省いて渡す (exactOptionalPropertyTypes 対応)
        const init = body === undefined ? { method } : { method, body }
        try {
            const data = await transport(`${baseUrl}${path}`, init)
            applyResult(parseRecordResponse(data))
        } catch {
            setState({ ...state, status: "error", error: "unreachable" })
        }
    }

    const isBusy = (): boolean => state.status === "starting" || state.status === "stopping"

    return {
        subscribe: (listener) => {
            listeners.add(listener)
            return () => {
                listeners.delete(listener)
            }
        },
        getSnapshot: () => state,
        start: async (baseUrl, startOptions) => {
            if (isBusy() || state.status === "recording") {
                return
            }
            setState({ ...state, status: "starting", error: null })
            await request(
                baseUrl,
                RECORD_PATHS.start,
                "POST",
                JSON.stringify(startBody(startOptions)),
            )
        },
        stop: async (baseUrl, label, notes) => {
            if (state.status !== "recording") {
                return
            }
            setState({ ...state, status: "stopping", error: null })
            await request(
                baseUrl,
                RECORD_PATHS.stop,
                "POST",
                JSON.stringify(stopBody(label, notes)),
            )
        },
        discard: async (baseUrl) => {
            if (state.status !== "recording") {
                return
            }
            setState({ ...state, status: "stopping", error: null })
            await request(baseUrl, RECORD_PATHS.discard, "POST", "{}")
        },
        refresh: async (baseUrl) => {
            if (isBusy()) {
                return
            }
            await request(baseUrl, RECORD_PATHS.status, "GET")
        },
    }
}
