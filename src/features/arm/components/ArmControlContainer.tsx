import { useCallback, useEffect, useRef } from "react"
import type { KeyboardInput } from "@/features/teleop"
import { useArm } from "../hooks/useArm"
import type { ArmController } from "../lib/armController"
import { armDirectionsFromKeys } from "../logic/arm"
import type { ArmDirection } from "../types"
import { ArmControl } from "./ArmControl"

interface ArmControlContainerProps {
    /** アームコントローラ。テストや Storybook では差し替える */
    readonly arm: ArmController
    /** キーボード入力ソース(走行と共有)。矢印キーでアームをジョグする */
    readonly keyboard: KeyboardInput
    /** アーム購読フック。外部から注入できるようにする(テスト容易性のため) */
    readonly useArmSnapshot?: typeof useArm
}

/**
 * ArmControl の Container。
 * アームコントローラの購読とキーボード配線を担う。矢印キー押下集合と
 * 画面パッドの押下方向を合成し、コントローラのジョグ方向として渡す
 * (CockpitScreenContainer の走行配線と同じ作法)。
 */
export function ArmControlContainer({
    arm,
    keyboard,
    useArmSnapshot = useArm,
}: ArmControlContainerProps) {
    const snapshot = useArmSnapshot(arm)

    // 画面パッドで現在押されている方向。表示はスナップショット由来なので
    // 再レンダー不要 → state ではなく ref に持つ(DriveKeypad 配線と同じ)。
    const pressedButtonsRef = useRef<Set<ArmDirection>>(new Set())

    // キーボード矢印集合 ∪ 画面パッド押下集合 → コントローラのジョグ方向。
    const applyDirections = useCallback((): void => {
        const directions = armDirectionsFromKeys(keyboard.getKeys())
        for (const direction of pressedButtonsRef.current) {
            directions.add(direction)
        }
        arm.setDirections(directions)
    }, [arm, keyboard])

    // 外部システム同士の配線: キーボード押下集合 → ジョグ方向。
    useEffect(() => keyboard.subscribe(applyDirections), [keyboard, applyDirections])

    const handlePress = (direction: ArmDirection): void => {
        pressedButtonsRef.current = new Set(pressedButtonsRef.current).add(direction)
        applyDirections()
    }
    const handleRelease = (direction: ArmDirection): void => {
        const next = new Set(pressedButtonsRef.current)
        next.delete(direction)
        pressedButtonsRef.current = next
        applyDirections()
    }

    return (
        <ArmControl
            angles={snapshot.angles}
            directions={snapshot.directions}
            onStep={(joint, direction) => {
                arm.stepJoint(joint, direction)
            }}
            onHome={() => {
                arm.home()
            }}
            onPress={handlePress}
            onRelease={handleRelease}
        />
    )
}
