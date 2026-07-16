/**
 * 自律コースランナー CLI。ロボットと同じ LAN 上の PC で動かす想定。
 *
 *   pnpm runner --course runner/course.example.json
 *
 * 設定は .env / 環境変数 (ANTHROPIC_API_KEY, ML3_HOST, ...) と CLI フラグから。
 */
import { readFile } from "node:fs/promises"
import process from "node:process"
import { parseArgs } from "node:util"
import { CAMERA_FEEDS } from "../src/features/camera/constants"
import { buildStreamUrl } from "../src/features/camera/logic/streamUrl"
import { DEFAULT_HOST, sanitizeHost } from "../src/features/cockpit/logic/hostConfig"
import { buildRecordUrl } from "../src/features/recording/constants"
import { createRecordClient } from "../src/features/recording/lib/recordClient"
import { buildTeleopUrl } from "../src/features/teleop/constants"
import { createTeleopClient } from "../src/features/teleop/lib/teleopClient"
import { createAnthropicClient, DEFAULT_MODEL } from "./anthropic"
import { createDecider } from "./agent"
import { fetchFrame } from "./camera"
import type { LlmImage } from "./llm"
import { runCourse, type CameraFeedId, type RunnerDeps } from "./loop"
import { createRobot, type RecordBinding, type Robot } from "./robot"
import { parseCourseBrief, type CourseBrief } from "./types"

function topicFor(feed: CameraFeedId): string {
    const config = CAMERA_FEEDS.find((entry) => entry.id === feed)
    if (config === undefined) {
        throw new Error(`unknown camera feed: ${feed}`)
    }
    return config.topic
}

function parseNumber(value: string | undefined, fallback: number): number {
    if (value === undefined) {
        return fallback
    }
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
}

async function loadCourse(path: string): Promise<CourseBrief> {
    const raw = await readFile(path, "utf8")
    const course = parseCourseBrief(JSON.parse(raw) as unknown)
    if (course === null) {
        throw new Error(
            `invalid course file ${path} (need { overview: string, waypoints: [{ instruction: string }] })`,
        )
    }
    return course
}

function log(message: string): void {
    console.log(message)
}

function createDryRunRobot(): Robot {
    return {
        connect: () => Promise.resolve(),
        drive: (vx, wz, durationS) => {
            log(`  [dry-run] drive vx=${String(vx)} wz=${String(wz)} for ${String(durationS)}s`)
            return Promise.resolve()
        },
        stop: () => {
            log("  [dry-run] stop")
        },
        disconnect: () => {
            /* no-op */
        },
        startRecording: () => Promise.resolve(),
        stopRecording: () => Promise.resolve(),
    }
}

async function main(): Promise<void> {
    const { values } = parseArgs({
        args: process.argv.slice(2),
        options: {
            course: { type: "string" },
            "max-steps": { type: "string" },
            "speed-scale": { type: "string" },
            model: { type: "string" },
            record: { type: "boolean", default: false },
            rear: { type: "boolean", default: false },
            "dry-run": { type: "boolean", default: false },
        },
    })

    if (values.course === undefined) {
        throw new Error("missing --course <path to course JSON>")
    }
    const dryRun = values["dry-run"]
    const wantRecord = values.record
    const wantRear = values.rear

    const host = sanitizeHost(process.env.ML3_HOST ?? "") ?? DEFAULT_HOST
    const speedScale = parseNumber(values["speed-scale"] ?? process.env.ML3_SPEED_SCALE, 0.5)
    const maxDurationS = parseNumber(process.env.ML3_MAX_DURATION_S, 3)
    const maxSteps = Math.max(1, Math.trunc(parseNumber(values["max-steps"], 40)))
    const model = values.model ?? DEFAULT_MODEL
    const course = await loadCourse(values.course)

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (apiKey === undefined || apiKey === "") {
        throw new Error("ANTHROPIC_API_KEY is not set (put it in .env or the environment)")
    }

    const capture = (feed: CameraFeedId): Promise<LlmImage> =>
        fetchFrame(buildStreamUrl(host, topicFor(feed)))
    const decider = createDecider(createAnthropicClient(model))

    let robot: Robot
    if (dryRun) {
        robot = createDryRunRobot()
    } else {
        const record: RecordBinding | undefined = wantRecord
            ? { client: createRecordClient(), baseUrl: buildRecordUrl(host) }
            : undefined
        robot = createRobot({
            teleop: createTeleopClient(),
            teleopUrl: buildTeleopUrl(host),
            speedScale,
            maxDurationS,
            ...(record !== undefined ? { record } : {}),
        })
    }

    log(
        `ML3 course runner → host=${host} model=${model} speedScale=${String(speedScale)} ` +
            `maxSteps=${String(maxSteps)}${dryRun ? " (dry-run)" : ""}`,
    )

    process.on("SIGINT", () => {
        log("\ninterrupted — stopping robot")
        robot.stop()
        robot.disconnect()
        process.exit(130)
    })

    await robot.connect()
    if (wantRecord) {
        await robot.startRecording("runner", "course-runner")
    }
    try {
        const result = await runCourse(
            {
                capture,
                decider,
                robot,
                log,
                captureRear: wantRear,
            } satisfies RunnerDeps,
            { course, maxSteps, speedScale, maxDurationS },
        )
        log(
            result.completed
                ? `✅ course complete in ${String(result.steps)} steps`
                : `⏹ stopped after ${String(result.steps)} steps (max-steps or safety stop)`,
        )
    } finally {
        if (wantRecord) {
            await robot.stopRecording("success")
        }
        robot.disconnect()
    }
}

try {
    await main()
} catch (error: unknown) {
    console.error(error)
    process.exit(1)
}
