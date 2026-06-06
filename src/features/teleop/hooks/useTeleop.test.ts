import { act, renderHook } from "@testing-library/react"
import { createTeleopClient, type WebSocketLike } from "../lib/teleopClient"
import { useTeleop } from "./useTeleop"

function createFakeSocket(): WebSocketLike & { simulateOpen: () => void } {
    let ready = 0
    const socket: WebSocketLike & { simulateOpen: () => void } = {
        get readyState() {
            return ready
        },
        send: vi.fn(),
        close: vi.fn(),
        onopen: null,
        onclose: null,
        onerror: null,
        simulateOpen() {
            ready = 1
            socket.onopen?.()
        },
    }
    return socket
}

describe("useTeleop", () => {
    it("クライアントの現在スナップショットを返す", () => {
        const client = createTeleopClient({ createSocket: createFakeSocket })
        const { result } = renderHook(() => useTeleop(client))

        expect(result.current).toEqual({ status: "idle", axes: { vx: 0, wz: 0 } })
    })

    it("接続状態と軸の変化に追従して再レンダーする", () => {
        const sockets: ReturnType<typeof createFakeSocket>[] = []
        const client = createTeleopClient({
            createSocket: () => {
                const socket = createFakeSocket()
                sockets.push(socket)
                return socket
            },
        })
        const { result } = renderHook(() => useTeleop(client))

        act(() => {
            client.connect("ws://pi:9001")
        })
        expect(result.current.status).toBe("connecting")

        act(() => {
            sockets.at(0)?.simulateOpen()
        })
        expect(result.current.status).toBe("open")

        act(() => {
            client.setAxes({ vx: 1, wz: 0 })
        })
        expect(result.current.axes).toEqual({ vx: 1, wz: 0 })
    })
})
