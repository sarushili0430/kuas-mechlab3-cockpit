import { useSyncExternalStore } from "react"
import type { TelemetrySource } from "../lib/telemetrySource"
import type { TelemetrySample } from "../types"

/** テレメトリ計測の状態と操作。Container から Presentational へ受け渡す。 */
export interface TelemetryMonitor {
    readonly isRunning: boolean
    readonly history: readonly TelemetrySample[]
    readonly elapsedMs: number
    readonly start: () => void
    readonly stop: () => void
    readonly reset: () => void
}

/** Container へ注入するためのフック型 */
export type UseTelemetryMonitor = (source: TelemetrySource) => TelemetryMonitor

/**
 * テレメトリソースを購読し、現在の計測状態と操作を返すフック。
 *
 * 外部システム(テレメトリソース)との同期には useEffect ではなく
 * useSyncExternalStore を使う。購読の開始・解除は React が管理するため
 * 副作用の手書き管理が不要になる。
 */
export const useTelemetryMonitor: UseTelemetryMonitor = (source) => {
    const state = useSyncExternalStore(source.subscribe, source.getSnapshot)

    return {
        isRunning: state.isRunning,
        history: state.history,
        elapsedMs: state.elapsedMs,
        start: source.start,
        stop: source.stop,
        reset: source.reset,
    }
}
