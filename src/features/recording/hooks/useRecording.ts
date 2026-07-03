import { useSyncExternalStore } from "react"
import type { RecordClient } from "../lib/recordClient"
import type { RecordSnapshot } from "../types"

/**
 * 録画コントロールクライアントの状態を購読するフック。
 * 外部システム (record_server への HTTP) との同期には useEffect ではなく
 * useSyncExternalStore を使う。操作 (start / stop / discard) はクライアントを直接呼ぶ。
 */
export function useRecording(client: RecordClient): RecordSnapshot {
    return useSyncExternalStore(client.subscribe, client.getSnapshot)
}
