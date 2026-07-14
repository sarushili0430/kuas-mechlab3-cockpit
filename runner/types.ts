/** コースブリーフと、モデルが 1 ステップごとに返す判断の型 + 検証。 */

export interface CourseWaypoint {
    readonly instruction: string
    readonly landmark?: string
}

export interface CourseBrief {
    readonly overview: string
    readonly waypoints: readonly CourseWaypoint[]
}

/** 次アクションの種別。 */
export type ActionKind = "drive" | "stop" | "done"

/**
 * 1 ステップの判断。drive 以外では vx/wz/durationS は 0 として扱う。
 * vx/wz は正規化 [-1, 1] (+前進 / +左旋回)、durationS は保持秒数。
 */
export interface Decision {
    readonly action: ActionKind
    readonly observation: string
    readonly reason: string
    readonly waypointIndex: number
    readonly vx: number
    readonly wz: number
    readonly durationS: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null
}

function asString(value: unknown): string {
    return typeof value === "string" ? value : ""
}

function asFiniteNumber(value: unknown): number {
    return typeof value === "number" && Number.isFinite(value) ? value : 0
}

/** 未知の値を Decision へ検証する。action が不正なら null (呼び出し側で再試行)。 */
export function parseDecision(value: unknown): Decision | null {
    if (!isRecord(value)) {
        return null
    }
    const action = value.action
    if (action !== "drive" && action !== "stop" && action !== "done") {
        return null
    }
    return {
        action,
        observation: asString(value.observation),
        reason: asString(value.reason),
        waypointIndex: Math.max(0, Math.trunc(asFiniteNumber(value.waypointIndex))),
        vx: asFiniteNumber(value.vx),
        wz: asFiniteNumber(value.wz),
        durationS: asFiniteNumber(value.durationS),
    }
}

/** コースファイル (JSON) を最小検証する。不正なら null。 */
export function parseCourseBrief(value: unknown): CourseBrief | null {
    if (!isRecord(value)) {
        return null
    }
    const overview = value.overview
    const waypoints = value.waypoints
    if (typeof overview !== "string" || !Array.isArray(waypoints)) {
        return null
    }
    const parsed: CourseWaypoint[] = []
    for (const item of waypoints) {
        if (!isRecord(item) || typeof item.instruction !== "string") {
            return null
        }
        parsed.push(
            typeof item.landmark === "string"
                ? { instruction: item.instruction, landmark: item.landmark }
                : { instruction: item.instruction },
        )
    }
    return { overview, waypoints: parsed }
}
