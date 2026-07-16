/**
 * ML3 ロボット操縦 MCP サーバのエントリ (stdio トランスポート)。
 * Claude Code などの MCP クライアントから起動され、cockpit 既存のロボット
 * クライアント (teleop/camera/record) を Node からそのまま再利用して drive/stop/
 * カメラ取得/録画 をツールとして公開する。設定は環境変数 (ML3_HOST,
 * ML3_SPEED_SCALE, ML3_MAX_DURATION_S) から。ロボットと同じ LAN 上で動かす想定。
 */
import process from "node:process"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { CAMERA_FEEDS } from "../src/features/camera/constants"
import { buildStreamUrl } from "../src/features/camera/logic/streamUrl"
import { DEFAULT_HOST, sanitizeHost } from "../src/features/cockpit/logic/hostConfig"
import { buildRecordUrl } from "../src/features/recording/constants"
import { createRecordClient } from "../src/features/recording/lib/recordClient"
import { buildTeleopUrl } from "../src/features/teleop/constants"
import { createTeleopClient } from "../src/features/teleop/lib/teleopClient"
import { fetchFrame } from "../runner/camera"
import { createRobot } from "../runner/robot"
import { createRobotMcpServer, type CameraId } from "./server"

// stdio の stdout は JSON-RPC 専用。ES import は巻き上げられて先に実行されるが、再利用先が
// 実行時に console.log しても JSON-RPC を壊さないよう、本体の最初で stdout→stderr へ回す。
console.log = (...args: unknown[]): void => {
    console.error(...args)
}

function parseNumber(value: string | undefined, fallback: number): number {
    if (value === undefined) {
        return fallback
    }
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
}

function topicFor(camera: CameraId): string {
    const config = CAMERA_FEEDS.find((entry) => entry.id === camera)
    if (config === undefined) {
        throw new Error(`unknown camera feed: ${camera}`)
    }
    return config.topic
}

async function main(): Promise<void> {
    const host = sanitizeHost(process.env.ML3_HOST ?? "") ?? DEFAULT_HOST
    const speedScale = parseNumber(process.env.ML3_SPEED_SCALE, 0.5)
    const maxDurationS = parseNumber(process.env.ML3_MAX_DURATION_S, 3)

    const teleop = createTeleopClient()
    const record = createRecordClient()
    const robot = createRobot({
        teleop,
        teleopUrl: buildTeleopUrl(host),
        speedScale,
        maxDurationS,
        record: { client: record, baseUrl: buildRecordUrl(host) },
    })

    // teleop は初回の drive/stop 時に一度だけ接続する (失敗時は次回リトライできるよう解除)。
    // 一度開けば teleop クライアント側が自動再接続を維持する。
    let connectPromise: Promise<void> | null = null
    const ensureConnected = (): Promise<void> => {
        connectPromise ??= robot.connect().catch((error: unknown) => {
            connectPromise = null
            throw error
        })
        return connectPromise
    }

    const server = createRobotMcpServer({
        ensureConnected,
        robot,
        captureFrame: (camera) => fetchFrame(buildStreamUrl(host, topicFor(camera))),
        getStatus: () => ({
            host,
            speedScale,
            maxDurationS,
            teleop: teleop.getSnapshot().status,
            record: record.getSnapshot().status,
        }),
    })

    const shutdown = (): void => {
        robot.stop()
        robot.disconnect()
    }
    process.on("SIGINT", () => {
        shutdown()
        process.exit(130)
    })
    process.on("SIGTERM", () => {
        shutdown()
        process.exit(143)
    })

    await server.connect(new StdioServerTransport())
    console.error(
        `ml3-robot MCP server ready → host=${host} speedScale=${String(speedScale)} ` +
            `maxDurationS=${String(maxDurationS)}`,
    )
}

try {
    await main()
} catch (error: unknown) {
    console.error(error)
    process.exit(1)
}
