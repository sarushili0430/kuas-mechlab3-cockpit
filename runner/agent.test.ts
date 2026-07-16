import { describe, expect, it } from "vitest"
import { createDecider, extractJson } from "./agent"
import type { LlmClient } from "./llm"
import { parseDecision, type CourseBrief } from "./types"

describe("parseDecision", () => {
    it("accepts a valid drive decision", () => {
        const decision = parseDecision({
            action: "drive",
            vx: 0.5,
            wz: -0.2,
            durationS: 0.4,
            waypointIndex: 1,
            observation: "clear",
            reason: "advance",
        })
        expect(decision?.action).toBe("drive")
        expect(decision?.vx).toBe(0.5)
        expect(decision?.waypointIndex).toBe(1)
    })

    it("rejects an unknown action", () => {
        expect(parseDecision({ action: "fly" })).toBeNull()
    })

    it("defaults missing numeric fields to 0", () => {
        const decision = parseDecision({ action: "stop", observation: "", reason: "" })
        expect(decision?.vx).toBe(0)
        expect(decision?.durationS).toBe(0)
    })

    it("rejects non-objects", () => {
        expect(parseDecision("nope")).toBeNull()
        expect(parseDecision(null)).toBeNull()
    })
})

describe("extractJson", () => {
    it("pulls a JSON object out of fenced text", () => {
        expect(extractJson('```json\n{"action":"stop"}\n```')).toEqual({ action: "stop" })
    })

    it("returns null for text with no JSON", () => {
        expect(extractJson("no json here")).toBeNull()
    })
})

const COURSE: CourseBrief = {
    overview: "a short loop",
    waypoints: [{ instruction: "go straight to the cone" }],
}
const FRAME = { mediaType: "image/jpeg", base64: "AAAA" } as const

describe("createDecider", () => {
    it("returns the model's parsed decision", async () => {
        const client: LlmClient = {
            complete: () =>
                Promise.resolve(
                    '{"action":"drive","vx":0.4,"wz":0,"durationS":0.5,"waypointIndex":0,"observation":"cone ahead","reason":"advance"}',
                ),
        }
        const decision = await createDecider(client).decide({
            course: COURSE,
            history: [],
            frontFrame: FRAME,
            speedScale: 0.5,
            maxDurationS: 3,
        })
        expect(decision.action).toBe("drive")
        expect(decision.vx).toBe(0.4)
    })

    it("falls back to a safe stop when the model never returns valid JSON", async () => {
        const client: LlmClient = { complete: () => Promise.resolve("garbage, not json") }
        const decision = await createDecider(client, { maxRetries: 1 }).decide({
            course: COURSE,
            history: ["step 1: drive — advance"],
            frontFrame: FRAME,
            speedScale: 0.5,
            maxDurationS: 3,
        })
        expect(decision.action).toBe("stop")
    })
})
