import { describe, expect, it } from "vitest"
import { createTeleopClient, type WebSocketLike } from "../src/features/teleop/lib/teleopClient"
import type { Decider } from "./agent"
import type { LlmImage } from "./llm"
import { runCourse } from "./loop"
import { createRobot } from "./robot"
import type { Decision } from "./types"

/** onopen をマイクロタスクで発火するフェイクソケット (送信内容を sent に記録)。 */
function fakeSocketFactory(sent: string[]): (url: string) => WebSocketLike {
    return () => {
        const socket: WebSocketLike = {
            readyState: 1,
            send: (data) => {
                sent.push(data)
            },
            close: () => {
                /* no-op */
            },
            onopen: null,
            onclose: null,
            onerror: null,
        }
        queueMicrotask(() => {
            socket.onopen?.()
        })
        return socket
    }
}

const FRAME: LlmImage = { mediaType: "image/jpeg", base64: "AAAA" }

describe("runCourse (integration over the real teleop client)", () => {
    it("drives scripted actions through the reused teleop client and always stops", async () => {
        const sent: string[] = []
        const teleop = createTeleopClient({
            createSocket: fakeSocketFactory(sent),
            sendIntervalMs: 10,
        })
        const robot = createRobot({
            teleop,
            teleopUrl: "ws://fake",
            speedScale: 0.5,
            maxDurationS: 3,
            sendIntervalMs: 10,
        })

        const script: Decision[] = [
            {
                action: "drive",
                vx: 1,
                wz: 0,
                durationS: 0.05,
                waypointIndex: 0,
                observation: "",
                reason: "fwd",
            },
            {
                action: "drive",
                vx: 0,
                wz: 1,
                durationS: 0.05,
                waypointIndex: 1,
                observation: "",
                reason: "left",
            },
            {
                action: "done",
                vx: 0,
                wz: 0,
                durationS: 0,
                waypointIndex: 1,
                observation: "",
                reason: "arrived",
            },
        ]
        let index = 0
        const decider: Decider = {
            decide: () => {
                const next = script[index]
                index++
                if (next === undefined) {
                    return Promise.reject(new Error("script exhausted"))
                }
                return Promise.resolve(next)
            },
        }

        await robot.connect()
        const result = await runCourse(
            {
                capture: () => Promise.resolve(FRAME),
                decider,
                robot,
                log: () => {
                    /* silent */
                },
                captureRear: false,
            },
            {
                course: { overview: "x", waypoints: [] },
                maxSteps: 10,
                speedScale: 0.5,
                maxDurationS: 3,
            },
        )
        robot.disconnect()

        expect(result.completed).toBe(true)
        expect(result.steps).toBe(3)
        expect(sent).toContain(JSON.stringify({ vx: 0.5, wz: 0 })) // forward, scaled
        expect(sent).toContain(JSON.stringify({ vx: 0, wz: 0.5 })) // left turn, scaled
        expect(sent[sent.length - 1]).toBe(JSON.stringify({ vx: 0, wz: 0 })) // ends stopped
    })
})
