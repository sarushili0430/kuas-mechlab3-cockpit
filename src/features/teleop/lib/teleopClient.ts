import { RECONNECT_DELAY_MS, SEND_INTERVAL_MS } from "../constants"
import { clampAxes, STOP_AXES } from "../logic/axes"
import type { DriveAxes, TeleopSnapshot } from "../types"

/** WebSocket の readyState: OPEN (RFC 6455 準拠で全実装 1 固定) */
const SOCKET_OPEN = 1

/** 本物の WebSocket と差し替え可能な最小インターフェース(テスト用 DI) */
export interface WebSocketLike {
    readonly readyState: number
    send(data: string): void
    close(): void
    onopen: (() => void) | null
    onclose: (() => void) | null
    onerror: (() => void) | null
}

export type CreateSocket = (url: string) => WebSocketLike

/** ネイティブ WebSocket を WebSocketLike へ適合させる既定ファクトリ */
const createNativeSocket: CreateSocket = (url) => {
    const ws = new WebSocket(url)
    const wrapper: WebSocketLike = {
        get readyState() {
            return ws.readyState
        },
        send: (data) => {
            ws.send(data)
        },
        close: () => {
            ws.close()
        },
        onopen: null,
        onclose: null,
        onerror: null,
    }
    ws.onopen = () => wrapper.onopen?.()
    ws.onclose = () => wrapper.onclose?.()
    ws.onerror = () => wrapper.onerror?.()
    return wrapper
}

export interface TeleopClientOptions {
    readonly createSocket?: CreateSocket
    readonly sendIntervalMs?: number
    readonly reconnectDelayMs?: number
}

/**
 * teleop WebSocket の外部データソース。
 * useSyncExternalStore で購読できる subscribe / getSnapshot を提供する。
 */
export interface TeleopClient {
    readonly subscribe: (listener: () => void) => () => void
    readonly getSnapshot: () => TeleopSnapshot
    /** 指定 URL へ接続する。接続済みなら停止指令を送ってから切り替える */
    readonly connect: (url: string) => void
    /** 停止指令を送って切断し、自動再接続も取りやめる(緊急停止) */
    readonly disconnect: () => void
    /** 送信ループが届ける「今の目標軸」を更新する */
    readonly setAxes: (axes: DriveAxes) => void
}

const INITIAL_STATE: TeleopSnapshot = { status: "idle", axes: STOP_AXES }

/**
 * teleop クライアントを生成する (kuas-mechlab3 docs/teleop-client.md 準拠)。
 *
 * - 約20Hzで「今の目標軸」を JSON 送信し続ける(送信が途絶えると機体側が自動停止)
 * - 切断時は一定間隔で自動再接続する
 * - disconnect は停止指令を送ってから閉じる(機体側の切断検知より速く確実に止める)
 */
export function createTeleopClient(options: TeleopClientOptions = {}): TeleopClient {
    const {
        createSocket = createNativeSocket,
        sendIntervalMs = SEND_INTERVAL_MS,
        reconnectDelayMs = RECONNECT_DELAY_MS,
    } = options

    let state = INITIAL_STATE
    let socket: WebSocketLike | null = null
    let sendTimerId: ReturnType<typeof setInterval> | null = null
    let reconnectTimerId: ReturnType<typeof setTimeout> | null = null
    const listeners = new Set<() => void>()

    const notify = (): void => {
        for (const listener of listeners) {
            listener()
        }
    }

    const setState = (next: TeleopSnapshot): void => {
        state = next
        notify()
    }

    const stopSendLoop = (): void => {
        if (sendTimerId !== null) {
            clearInterval(sendTimerId)
            sendTimerId = null
        }
    }

    const cancelReconnect = (): void => {
        if (reconnectTimerId !== null) {
            clearTimeout(reconnectTimerId)
            reconnectTimerId = null
        }
    }

    const sendAxes = (axes: DriveAxes): void => {
        if (socket !== null && socket.readyState === SOCKET_OPEN) {
            socket.send(JSON.stringify({ vx: axes.vx, wz: axes.wz }))
        }
    }

    /** 現在の接続を後始末する。open なら停止指令を送ってから閉じる */
    const teardownSocket = (): void => {
        stopSendLoop()
        cancelReconnect()
        if (socket === null) {
            return
        }
        // 古いソケットのイベントで再接続が走らないようハンドラを外す
        socket.onopen = null
        socket.onclose = null
        socket.onerror = null
        sendAxes(STOP_AXES)
        socket.close()
        socket = null
    }

    const openSocket = (url: string): void => {
        const next = createSocket(url)
        socket = next

        next.onopen = () => {
            setState({ ...state, status: "open" })
            sendTimerId = setInterval(() => {
                sendAxes(state.axes)
            }, sendIntervalMs)
        }

        next.onclose = () => {
            stopSendLoop()
            setState({ ...state, status: "reconnecting" })
            reconnectTimerId = setTimeout(() => {
                reconnectTimerId = null
                openSocket(url)
            }, reconnectDelayMs)
        }

        next.onerror = () => {
            next.close()
        }

        setState({ ...state, status: "connecting" })
    }

    const connect = (url: string): void => {
        teardownSocket()
        // 新しい接続先に旧指令を引き継がない。通知は直後の connecting 遷移に合流させる
        state = { ...state, axes: STOP_AXES }
        openSocket(url)
    }

    const disconnect = (): void => {
        teardownSocket()
        setState({ status: "idle", axes: STOP_AXES })
    }

    return {
        subscribe: (listener) => {
            listeners.add(listener)
            return () => {
                listeners.delete(listener)
            }
        },
        getSnapshot: () => state,
        connect,
        disconnect,
        setAxes: (axes) => {
            setState({ ...state, axes: clampAxes(axes) })
        },
    }
}
