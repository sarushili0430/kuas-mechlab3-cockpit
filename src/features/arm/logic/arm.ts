import { ARM_HOME, ARM_KEY_TO_DIRECTION, ARM_MAX_ANGLE, ARM_MIN_ANGLE } from "../constants"
import type { ArmAngles, ArmDirection, ArmJoint } from "../types"

/** 角度を可動域 [0, 180] に丸める。非有限値は下限へ落として機体へ送らない */
export function clampAngle(angle: number): number {
    if (!Number.isFinite(angle)) {
        return ARM_MIN_ANGLE
    }
    return Math.min(ARM_MAX_ANGLE, Math.max(ARM_MIN_ANGLE, angle))
}

/** 指定関節を delta 度動かした新しい角セットを返す (可動域でクランプ) */
export function stepJointAngles(angles: ArmAngles, joint: ArmJoint, delta: number): ArmAngles {
    return { ...angles, [joint]: clampAngle(angles[joint] + delta) }
}

/**
 * ジョグ方向の集合から目標角を 1 tick 分進める。
 * up/down = 肘, left/right = 肩。相反方向 (up+down 等) は相殺する。
 */
export function jogAngles(
    angles: ArmAngles,
    directions: ReadonlySet<ArmDirection>,
    step: number,
): ArmAngles {
    const elbowDelta = (directions.has("up") ? step : 0) - (directions.has("down") ? step : 0)
    const shoulderDelta = (directions.has("left") ? step : 0) - (directions.has("right") ? step : 0)
    return {
        shoulder: clampAngle(angles.shoulder + shoulderDelta),
        elbow: clampAngle(angles.elbow + elbowDelta),
    }
}

/** 単一値のイージング 1 step。差が小さければ目標へスナップする */
function easeValue(
    current: number,
    target: number,
    ease: number,
    snap: number,
): { readonly value: number; readonly changed: boolean } {
    const diff = target - current
    if (Math.abs(diff) > snap) {
        return { value: current + diff * ease, changed: true }
    }
    if (current !== target) {
        return { value: target, changed: true }
    }
    return { value: current, changed: false }
}

/**
 * 現在の送信値 current を目標 target へイージングで近づける。
 * docs/cockpit.html と同じく、差が snap 以下ならスナップして収束させる。
 */
export function easeAngles(
    current: ArmAngles,
    target: ArmAngles,
    ease: number,
    snap: number,
): { readonly next: ArmAngles; readonly changed: boolean } {
    const shoulder = easeValue(current.shoulder, target.shoulder, ease, snap)
    const elbow = easeValue(current.elbow, target.elbow, ease, snap)
    return {
        next: { shoulder: shoulder.value, elbow: elbow.value },
        changed: shoulder.changed || elbow.changed,
    }
}

/** 送信用に小数第 1 位へ丸める (docs/cockpit.html の round1) */
export function roundAngle(angle: number): number {
    return Math.round(angle * 10) / 10
}

/** サーボ送信ペイロード [肩, 肘] を組み立てる */
export function servoPayload(angles: ArmAngles): readonly [number, number] {
    return [roundAngle(angles.shoulder), roundAngle(angles.elbow)]
}

/** 表示用に整数度へ丸める (docs/cockpit.html の Math.round) */
export function displayAngle(angle: number): number {
    return Math.round(angle)
}

/** 2 つの角セットが等しいか (イージング/ジョグの変化判定用) */
export function anglesEqual(a: ArmAngles, b: ArmAngles): boolean {
    return a.shoulder === b.shoulder && a.elbow === b.elbow
}

/** 押下キー集合から現在のアームジョグ方向を導出する (矢印キーのみ拾う) */
export function armDirectionsFromKeys(keys: ReadonlySet<string>): Set<ArmDirection> {
    const directions = new Set<ArmDirection>()
    for (const [key, direction] of Object.entries(ARM_KEY_TO_DIRECTION)) {
        if (keys.has(key)) {
            directions.add(direction)
        }
    }
    return directions
}

/** ホーム姿勢 (肩/肘 90°) を返す */
export function homeAngles(): ArmAngles {
    return ARM_HOME
}
