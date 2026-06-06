import type { DriveAxes } from "../types"

/** 操縦コマンドに対応するキー (本体 docs/cockpit.html と同じ WASD) */
export type DriveCommandKey = "w" | "a" | "s" | "d"

/** 停止指令 */
export const STOP_AXES: DriveAxes = { vx: 0, wz: 0 }

function clampAxis(value: number): number {
    if (Number.isNaN(value)) {
        return 0
    }
    return Math.min(1, Math.max(-1, value))
}

/** 軸を [-1, 1] に丸め、有限でない値を機体へ送らないようにする */
export function clampAxes(axes: DriveAxes): DriveAxes {
    return { vx: clampAxis(axes.vx), wz: clampAxis(axes.wz) }
}

/**
 * 押下中キー集合から正規化ドライブ軸を合成する。
 * w/s が vx(+前進)、a/d が wz(+左旋回, REP-103)。相反キーは相殺する。
 */
export function axesFromKeys(keys: ReadonlySet<string>): DriveAxes {
    const vx = (keys.has("w") ? 1 : 0) - (keys.has("s") ? 1 : 0)
    const wz = (keys.has("a") ? 1 : 0) - (keys.has("d") ? 1 : 0)
    return { vx, wz }
}

/**
 * 送信中の軸値から「点灯すべき方向」を導出する(キーパッド表示用)。
 * 押下キーの生状態ではなく実際に機体へ送る指令を表示するための変換。
 */
export function activeDirectionsFromAxes(axes: DriveAxes): ReadonlySet<DriveCommandKey> {
    const directions = new Set<DriveCommandKey>()
    if (axes.vx > 0) {
        directions.add("w")
    }
    if (axes.vx < 0) {
        directions.add("s")
    }
    if (axes.wz > 0) {
        directions.add("a")
    }
    if (axes.wz < 0) {
        directions.add("d")
    }
    return directions
}
