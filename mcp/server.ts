/**
 * ML3 ロボット操縦の MCP サーバ (ツール定義)。Claude Code などの MCP クライアントが
 * カメラを見て drive/stop できるようにする。runner と同じロボット抽象 (robot.ts の
 * `Robot` と camera の 1 フレーム取得) を注入で受け取り、ここでは MCP ツールへの
 * 変換だけを行う (実接続の生成は index.ts、テストはフェイクを注入)。
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import type { Robot } from "../runner/robot"

/** 前後カメラの識別子 (src/features/camera の CAMERA_FEEDS.id と一致)。 */
export type CameraId = "front" | "rear"

/** get_status が返す現在の設定と接続状態。 */
export interface RobotStatus {
    readonly host: string
    readonly speedScale: number
    readonly maxDurationS: number
    readonly teleop: string
    readonly record: string
}

/**
 * サーバが必要とする外部依存。robot は runner と同じ `Robot`、captureFrame は
 * カメラ 1 フレーム (base64 JPEG)、ensureConnected は teleop の遅延接続 (初回の
 * drive/stop 時に一度だけ張る)、getStatus は現在値のスナップショット。
 */
export interface RobotMcpDeps {
    readonly ensureConnected: () => Promise<void>
    readonly robot: Pick<Robot, "drive" | "stop" | "startRecording" | "stopRecording">
    readonly captureFrame: (camera: CameraId) => Promise<{ readonly base64: string }>
    readonly getStatus: () => RobotStatus
}

const AXIS = z.number().min(-1).max(1)

/** 注入された依存から MCP サーバを組み立てる。 */
export function createRobotMcpServer(deps: RobotMcpDeps): McpServer {
    const server = new McpServer({ name: "ml3-robot", version: "0.1.0" })

    server.registerTool(
        "get_camera_frame",
        {
            title: "Get a camera frame",
            description:
                "Grab the current still frame from the robot's front (default) or rear camera " +
                "and return it as an image so you can decide the next move.",
            inputSchema: {
                camera: z
                    .enum(["front", "rear"])
                    .default("front")
                    .describe("which onboard camera to look through"),
            },
        },
        async ({ camera }) => {
            const frame = await deps.captureFrame(camera)
            return {
                content: [{ type: "image", data: frame.base64, mimeType: "image/jpeg" }],
            }
        },
    )

    server.registerTool(
        "drive",
        {
            title: "Drive a short burst",
            description:
                "Drive the robot for a short, bounded burst, then auto-stop. Move in SHORT bursts " +
                "(durationS about 0.3-0.8) and re-check the camera between moves. Speeds are " +
                "governed by ML3_SPEED_SCALE and durationS is clamped by ML3_MAX_DURATION_S.",
            inputSchema: {
                vx: AXIS.describe("forward(+) / back(-), normalized [-1,1]"),
                wz: AXIS.describe("turn left(+) / right(-), normalized [-1,1]"),
                durationS: z
                    .number()
                    .min(0)
                    .max(5)
                    .describe("seconds to hold the command before auto-stop"),
            },
        },
        async ({ vx, wz, durationS }) => {
            await deps.ensureConnected()
            await deps.robot.drive(vx, wz, durationS)
            return {
                content: [
                    {
                        type: "text",
                        text:
                            `drove vx=${String(vx)} wz=${String(wz)} for ` +
                            `${String(durationS)}s, then stopped`,
                    },
                ],
            }
        },
    )

    server.registerTool(
        "stop",
        {
            title: "Stop the robot",
            description: "Immediately command the robot to stop (zero velocity).",
        },
        () => {
            deps.robot.stop()
            return { content: [{ type: "text", text: "stop command sent" }] }
        },
    )

    server.registerTool(
        "start_recording",
        {
            title: "Start dataset recording",
            description: "Start recording the run as a dataset episode (record_server, port 9002).",
            inputSchema: {
                route: z.string().default("mcp").describe("route/course label for the episode"),
                operator: z.string().default("claude-code").describe("who is driving"),
            },
        },
        async ({ route, operator }) => {
            await deps.robot.startRecording(route, operator)
            return {
                content: [
                    {
                        type: "text",
                        text: `recording started (route=${route}, operator=${operator})`,
                    },
                ],
            }
        },
    )

    server.registerTool(
        "stop_recording",
        {
            title: "Stop dataset recording",
            description:
                "Stop the current recording and save the episode with a success/failure label.",
            inputSchema: {
                label: z
                    .enum(["success", "failure"])
                    .default("success")
                    .describe("how the episode should be labeled"),
            },
        },
        async ({ label }) => {
            await deps.robot.stopRecording(label)
            return { content: [{ type: "text", text: `recording stopped (label=${label})` }] }
        },
    )

    server.registerTool(
        "get_status",
        {
            title: "Get robot status",
            description:
                "Report the current host, speed governor, duration cap, and teleop/record state.",
        },
        () => {
            return { content: [{ type: "text", text: JSON.stringify(deps.getStatus(), null, 2) }] }
        },
    )

    return server
}
