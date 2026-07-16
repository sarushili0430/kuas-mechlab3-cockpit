/** カメラ画像 + コース + 履歴から「次の一手」を Claude に決めさせる意思決定器。 */
import type { LlmClient, LlmImage } from "./llm"
import { parseDecision, type CourseBrief, type Decision } from "./types"

export interface DecideInput {
    readonly course: CourseBrief
    readonly history: readonly string[]
    readonly frontFrame: LlmImage
    readonly rearFrame?: LlmImage
    readonly speedScale: number
    readonly maxDurationS: number
}

export interface Decider {
    readonly decide: (input: DecideInput) => Promise<Decision>
}

const HISTORY_WINDOW = 10

export function buildSystemPrompt(): string {
    return [
        "You are the operator of a small ground robot, driving it through a course using only its camera.",
        "You are given the course brief, a short history of your recent actions, and the current camera image(s).",
        "Decide the SINGLE next action and reply with ONLY a JSON object (no prose, no code fences) of this exact shape:",
        '{"action":"drive"|"stop"|"done","observation":string,"reason":string,"waypointIndex":number,"vx":number,"wz":number,"durationS":number}',
        "Axes are normalized to [-1,1]: vx is forward(+)/back(-), wz is turn-left(+)/turn-right(-). durationS is how long to hold the command, in seconds.",
        "Rules: move in SHORT bursts (durationS about 0.3-0.8) and keep speeds modest. If a frame is ambiguous or you might hit something, choose action 'stop' and re-observe rather than guessing. Use 'done' only when the final waypoint is reached. For 'stop' and 'done', set vx, wz and durationS to 0.",
    ].join("\n")
}

export function buildUserText(course: CourseBrief, history: readonly string[]): string {
    const waypoints = course.waypoints
        .map((waypoint, index) => {
            const landmark =
                waypoint.landmark !== undefined ? ` (landmark: ${waypoint.landmark})` : ""
            return `${String(index)}. ${waypoint.instruction}${landmark}`
        })
        .join("\n")
    const recent = history.slice(-HISTORY_WINDOW)
    const historyText =
        recent.length > 0 ? recent.join("\n") : "(none yet — this is the first step)"
    return [
        `COURSE OVERVIEW:\n${course.overview}`,
        `WAYPOINTS:\n${waypoints}`,
        `RECENT ACTIONS:\n${historyText}`,
        "The current camera view is attached. Reply with the next action as JSON only.",
    ].join("\n\n")
}

/** モデル本文から最初の JSON オブジェクトを取り出す。無ければ null。 */
export function extractJson(text: string): unknown {
    const start = text.indexOf("{")
    const end = text.lastIndexOf("}")
    if (start === -1 || end === -1 || end < start) {
        return null
    }
    try {
        return JSON.parse(text.slice(start, end + 1)) as unknown
    } catch {
        return null
    }
}

export interface DeciderOptions {
    readonly maxRetries?: number
    readonly maxTokens?: number
}

const SAFE_STOP: Decision = {
    action: "stop",
    observation: "could not parse a decision from the model",
    reason: "model response was not valid JSON after retries; stopping for safety",
    waypointIndex: 0,
    vx: 0,
    wz: 0,
    durationS: 0,
}

export function createDecider(client: LlmClient, options: DeciderOptions = {}): Decider {
    const maxRetries = options.maxRetries ?? 2
    const maxTokens = options.maxTokens ?? 1024
    const system = buildSystemPrompt()
    return {
        decide: async (input) => {
            const text = buildUserText(input.course, input.history)
            const images =
                input.rearFrame !== undefined
                    ? [input.frontFrame, input.rearFrame]
                    : [input.frontFrame]
            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                const raw = await client.complete({ system, text, images, maxTokens })
                const decision = parseDecision(extractJson(raw))
                if (decision !== null) {
                    return decision
                }
            }
            return SAFE_STOP
        },
    }
}
