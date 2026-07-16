import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { beforeEach, describe, expect, it } from "vitest"
import { createRobotMcpServer, type RobotMcpDeps, type RobotStatus } from "./server"

interface Calls {
    connected: number
    drives: [number, number, number][]
    stops: number
    started: [string, string][]
    stopped: string[]
}

function makeDeps(calls: Calls): RobotMcpDeps {
    const status: RobotStatus = {
        host: "192.168.1.42",
        speedScale: 0.5,
        maxDurationS: 3,
        teleop: "idle",
        record: "idle",
    }
    return {
        ensureConnected: () => {
            calls.connected += 1
            return Promise.resolve()
        },
        robot: {
            drive: (vx, wz, durationS) => {
                calls.drives.push([vx, wz, durationS])
                return Promise.resolve()
            },
            stop: () => {
                calls.stops += 1
            },
            startRecording: (route, operator) => {
                calls.started.push([route, operator])
                return Promise.resolve()
            },
            stopRecording: (label) => {
                calls.stopped.push(label)
                return Promise.resolve()
            },
        },
        captureFrame: () => Promise.resolve({ base64: "AAAA" }),
        getStatus: () => status,
    }
}

async function connectClient(deps: RobotMcpDeps): Promise<Client> {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
    const server = createRobotMcpServer(deps)
    await server.connect(serverTransport)
    const client = new Client({ name: "test-client", version: "0.0.0" })
    await client.connect(clientTransport)
    return client
}

describe("createRobotMcpServer", () => {
    let calls: Calls
    beforeEach(() => {
        calls = { connected: 0, drives: [], stops: 0, started: [], stopped: [] }
    })

    it("exposes the robot control tools", async () => {
        const client = await connectClient(makeDeps(calls))
        const { tools } = await client.listTools()
        const names = tools.map((tool) => tool.name).sort()
        expect(names).toEqual([
            "drive",
            "get_camera_frame",
            "get_status",
            "start_recording",
            "stop",
            "stop_recording",
        ])
    })

    it("connects then drives on the drive tool", async () => {
        const client = await connectClient(makeDeps(calls))
        const result = await client.callTool({
            name: "drive",
            arguments: { vx: 0.5, wz: -0.2, durationS: 0.4 },
        })
        expect(calls.connected).toBe(1)
        expect(calls.drives).toEqual([[0.5, -0.2, 0.4]])
        expect(result.isError ?? false).toBe(false)
    })

    it("returns a camera frame as an image block", async () => {
        const client = await connectClient(makeDeps(calls))
        const result = await client.callTool({
            name: "get_camera_frame",
            arguments: { camera: "front" },
        })
        const content = result.content as { type: string; mimeType?: string }[]
        expect(content[0]?.type).toBe("image")
        expect(content[0]?.mimeType).toBe("image/jpeg")
    })

    it("rejects an out-of-range drive axis before touching the robot", async () => {
        const client = await connectClient(makeDeps(calls))
        const result = await client.callTool({
            name: "drive",
            arguments: { vx: 5, wz: 0, durationS: 0.4 },
        })
        expect(result.isError).toBe(true)
        expect(calls.drives).toEqual([])
    })

    it("stops and records through their tools", async () => {
        const client = await connectClient(makeDeps(calls))
        await client.callTool({ name: "stop", arguments: {} })
        await client.callTool({ name: "start_recording", arguments: {} })
        await client.callTool({ name: "stop_recording", arguments: { label: "failure" } })
        expect(calls.stops).toBe(1)
        expect(calls.started).toEqual([["mcp", "claude-code"]])
        expect(calls.stopped).toEqual(["failure"])
    })
})
