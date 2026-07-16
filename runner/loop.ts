/** 認識→判断→少し動く、を繰り返す自律走行ループ (依存は注入され、単体テスト可能)。 */
import type { Decider } from "./agent"
import type { LlmImage } from "./llm"
import type { Robot } from "./robot"
import type { CourseBrief } from "./types"

export type CameraFeedId = "front" | "rear"

export interface RunnerDeps {
    readonly capture: (feed: CameraFeedId) => Promise<LlmImage>
    readonly decider: Decider
    readonly robot: Robot
    readonly log: (message: string) => void
    readonly captureRear: boolean
}

export interface RunOptions {
    readonly course: CourseBrief
    readonly maxSteps: number
    readonly speedScale: number
    readonly maxDurationS: number
}

export interface RunResult {
    readonly steps: number
    readonly completed: boolean
}

export async function runCourse(deps: RunnerDeps, options: RunOptions): Promise<RunResult> {
    const history: string[] = []
    let completed = false
    let steps = 0
    try {
        while (steps < options.maxSteps) {
            const frontFrame = await deps.capture("front")
            const rearFrame = deps.captureRear ? await deps.capture("rear") : undefined
            const decision = await deps.decider.decide({
                course: options.course,
                history,
                frontFrame,
                ...(rearFrame !== undefined ? { rearFrame } : {}),
                speedScale: options.speedScale,
                maxDurationS: options.maxDurationS,
            })
            steps++
            deps.log(
                `step ${String(steps)} [${decision.action}] wp#${String(decision.waypointIndex)}: ${decision.observation} — ${decision.reason}`,
            )
            history.push(`step ${String(steps)}: ${decision.action} — ${decision.reason}`)
            if (decision.action === "done") {
                completed = true
                break
            }
            if (decision.action === "stop") {
                deps.robot.stop()
                continue
            }
            await deps.robot.drive(decision.vx, decision.wz, decision.durationS)
        }
    } finally {
        deps.robot.stop()
    }
    return { steps, completed }
}
