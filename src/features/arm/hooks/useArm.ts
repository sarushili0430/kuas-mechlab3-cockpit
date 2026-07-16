import { useSyncExternalStore } from "react"
import type { ArmController } from "../lib/armController"
import type { ArmSnapshot } from "../types"

/**
 * アームコントローラの状態を購読するフック。
 * 外部システム (タイマー駆動のジョグ/イージング) との同期には useEffect ではなく
 * useSyncExternalStore を使う。操作 (stepJoint / home / setDirections) は
 * コントローラを直接呼ぶ。
 */
export function useArm(controller: ArmController): ArmSnapshot {
    return useSyncExternalStore(controller.subscribe, controller.getSnapshot)
}
