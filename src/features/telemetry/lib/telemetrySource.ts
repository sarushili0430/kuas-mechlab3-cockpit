import { MAX_HISTORY_LENGTH, SAMPLING_INTERVAL_MS } from "../constants"
import { generateSample } from "../logic/generateSample"
import { appendSample } from "../logic/telemetry"
import type { TelemetrySample } from "../types"

/** テレメトリソースの現在状態(イミュータブルなスナップショット) */
export interface TelemetrySourceState {
    readonly isRunning: boolean
    readonly history: readonly TelemetrySample[]
    readonly elapsedMs: number
}

/**
 * テレメトリの外部データソース。
 * useSyncExternalStore で購読できる subscribe / getSnapshot を提供する。
 */
export interface TelemetrySource {
    readonly subscribe: (listener: () => void) => () => void
    readonly getSnapshot: () => TelemetrySourceState
    readonly start: () => void
    readonly stop: () => void
    readonly reset: () => void
}

export interface SimulatedTelemetrySourceOptions {
    readonly intervalMs?: number
    readonly maxHistoryLength?: number
    readonly random?: () => number
    readonly now?: () => number
}

const INITIAL_STATE: TelemetrySourceState = {
    isRunning: false,
    history: [],
    elapsedMs: 0,
}

/**
 * モーター実験を模したシミュレーションテレメトリソースを生成する。
 * 実機接続時はこのモジュールを WebSocket / シリアル通信実装に差し替える。
 */
export function createSimulatedTelemetrySource(
    options: SimulatedTelemetrySourceOptions = {},
): TelemetrySource {
    const {
        intervalMs = SAMPLING_INTERVAL_MS,
        maxHistoryLength = MAX_HISTORY_LENGTH,
        random = Math.random,
        now = Date.now,
    } = options

    let state = INITIAL_STATE
    let timerId: ReturnType<typeof setInterval> | null = null
    const listeners = new Set<() => void>()

    const notify = (): void => {
        for (const listener of listeners) {
            listener()
        }
    }

    const setState = (next: TelemetrySourceState): void => {
        state = next
        notify()
    }

    const tick = (): void => {
        const elapsedMs = state.elapsedMs + intervalMs
        const sample = generateSample({ elapsedMs, timestamp: now() }, random)
        setState({
            ...state,
            elapsedMs,
            history: appendSample(state.history, sample, maxHistoryLength),
        })
    }

    const start = (): void => {
        if (state.isRunning) {
            return
        }
        timerId = setInterval(tick, intervalMs)
        setState({ ...state, isRunning: true })
    }

    const stop = (): void => {
        if (!state.isRunning) {
            return
        }
        if (timerId !== null) {
            clearInterval(timerId)
            timerId = null
        }
        setState({ ...state, isRunning: false })
    }

    const reset = (): void => {
        stop()
        setState(INITIAL_STATE)
    }

    return {
        subscribe: (listener) => {
            listeners.add(listener)
            return () => {
                listeners.delete(listener)
            }
        },
        getSnapshot: () => state,
        start,
        stop,
        reset,
    }
}
