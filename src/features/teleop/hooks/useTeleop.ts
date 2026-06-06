import { useSyncExternalStore } from "react"
import type { TeleopClient } from "../lib/teleopClient"
import type { TeleopSnapshot } from "../types"

/**
 * teleop クライアントの状態を購読するフック。
 * 外部システム(WebSocket)との同期には useEffect ではなく
 * useSyncExternalStore を使う。操作 (connect / disconnect / setAxes) は
 * クライアントを直接呼ぶ。
 */
export function useTeleop(client: TeleopClient): TeleopSnapshot {
    return useSyncExternalStore(client.subscribe, client.getSnapshot)
}
