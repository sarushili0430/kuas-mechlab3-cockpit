import { createTeleopClient, type WebSocketLike } from "./teleopClient"

/** テスト用の WebSocket 代替。open/close/error をテストから発火できる */
class FakeSocket implements WebSocketLike {
    static readonly CONNECTING = 0
    static readonly OPEN = 1
    static readonly CLOSED = 3

    readyState: number = FakeSocket.CONNECTING
    readonly sent: string[] = []
    closeCalls = 0
    onopen: (() => void) | null = null
    onclose: (() => void) | null = null
    onerror: (() => void) | null = null

    constructor(readonly url: string) {}

    send(data: string): void {
        this.sent.push(data)
    }

    close(): void {
        this.closeCalls += 1
        this.readyState = FakeSocket.CLOSED
    }

    simulateOpen(): void {
        this.readyState = FakeSocket.OPEN
        this.onopen?.()
    }

    simulateClose(): void {
        this.readyState = FakeSocket.CLOSED
        this.onclose?.()
    }

    simulateError(): void {
        this.onerror?.()
    }
}

function setup(options: { sendIntervalMs?: number; reconnectDelayMs?: number } = {}) {
    const sockets: FakeSocket[] = []
    const client = createTeleopClient({
        createSocket: (url) => {
            const socket = new FakeSocket(url)
            sockets.push(socket)
            return socket
        },
        sendIntervalMs: options.sendIntervalMs ?? 50,
        reconnectDelayMs: options.reconnectDelayMs ?? 1000,
    })
    /** index 番目に生成されたソケット(未生成ならテスト失敗) */
    const socket = (index: number): FakeSocket => {
        const found = sockets.at(index)
        if (found === undefined) {
            throw new Error(`socket #${String(index)} はまだ生成されていない`)
        }
        return found
    }
    return { client, sockets, socket }
}

describe("createTeleopClient", () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it("初期状態は idle・停止指令", () => {
        const { client } = setup()
        expect(client.getSnapshot()).toEqual({ status: "idle", axes: { vx: 0, wz: 0 } })
    })

    it("connect で指定 URL へ接続を開始し connecting になる", () => {
        const { client, sockets, socket } = setup()
        client.connect("ws://192.168.1.42:9001")

        expect(sockets).toHaveLength(1)
        expect(socket(0).url).toBe("ws://192.168.1.42:9001")
        expect(client.getSnapshot().status).toBe("connecting")
    })

    it("ソケットが開くと open になる", () => {
        const { client, socket } = setup()
        client.connect("ws://pi:9001")
        socket(0).simulateOpen()

        expect(client.getSnapshot().status).toBe("open")
    })

    it("open 中は送信間隔ごとに現在の軸を JSON で送り続ける(ハートビート)", () => {
        const { client, socket } = setup({ sendIntervalMs: 50 })
        client.connect("ws://pi:9001")
        socket(0).simulateOpen()

        vi.advanceTimersByTime(150)
        expect(socket(0).sent).toEqual(['{"vx":0,"wz":0}', '{"vx":0,"wz":0}', '{"vx":0,"wz":0}'])
    })

    it("setAxes した値が次の送信から反映される", () => {
        const { client, socket } = setup({ sendIntervalMs: 50 })
        client.connect("ws://pi:9001")
        socket(0).simulateOpen()

        client.setAxes({ vx: 1, wz: -0.5 })
        vi.advanceTimersByTime(50)

        expect(socket(0).sent.at(-1)).toBe('{"vx":1,"wz":-0.5}')
        expect(client.getSnapshot().axes).toEqual({ vx: 1, wz: -0.5 })
    })

    it("setAxes は範囲外・非有限値を丸めてから保持する", () => {
        const { client } = setup()
        client.setAxes({ vx: 2, wz: Number.NaN })
        expect(client.getSnapshot().axes).toEqual({ vx: 1, wz: 0 })
    })

    it("open 中は sendServo で servo コマンドを同じソケットへ送る", () => {
        const { client, socket } = setup()
        client.connect("ws://pi:9001")
        socket(0).simulateOpen()

        client.sendServo([90, 45.5])

        expect(socket(0).sent.at(-1)).toBe('{"servo":[90,45.5]}')
    })

    it("未接続 (connecting) では sendServo は送らない", () => {
        const { client, socket } = setup()
        client.connect("ws://pi:9001")

        client.sendServo([90, 45])

        // まだ open していないので送信されない
        expect(socket(0).sent).toEqual([])
    })

    it("idle では sendServo は何もしない (ソケット未生成)", () => {
        const { client, sockets } = setup()
        client.sendServo([90, 90])
        expect(sockets).toHaveLength(0)
    })

    it("接続が切れると送信を止め、待ち時間の後に同じ URL へ再接続する", () => {
        const { client, sockets, socket } = setup({ reconnectDelayMs: 1000 })
        client.connect("ws://pi:9001")
        socket(0).simulateOpen()

        socket(0).simulateClose()
        expect(client.getSnapshot().status).toBe("reconnecting")

        vi.advanceTimersByTime(200)
        expect(socket(0).sent).toEqual([])

        vi.advanceTimersByTime(800)
        expect(sockets).toHaveLength(2)
        expect(socket(1).url).toBe("ws://pi:9001")
        expect(client.getSnapshot().status).toBe("connecting")
    })

    it("エラー時はソケットを閉じる(close 経由で再接続フローに乗る)", () => {
        const { client, socket } = setup()
        client.connect("ws://pi:9001")
        socket(0).simulateOpen()

        socket(0).simulateError()
        expect(socket(0).closeCalls).toBe(1)
    })

    it("disconnect は停止指令を送ってから切断し idle へ戻る", () => {
        const { client, socket } = setup()
        client.connect("ws://pi:9001")
        socket(0).simulateOpen()
        client.setAxes({ vx: 1, wz: 0 })

        client.disconnect()

        expect(socket(0).sent.at(-1)).toBe('{"vx":0,"wz":0}')
        expect(socket(0).closeCalls).toBe(1)
        expect(client.getSnapshot()).toEqual({ status: "idle", axes: { vx: 0, wz: 0 } })
    })

    it("disconnect 後にソケットの close イベントが届いても再接続しない", () => {
        const { client, sockets, socket } = setup()
        client.connect("ws://pi:9001")
        socket(0).simulateOpen()

        client.disconnect()
        socket(0).simulateClose()
        vi.advanceTimersByTime(5000)

        expect(sockets).toHaveLength(1)
        expect(client.getSnapshot().status).toBe("idle")
    })

    it("再接続待ちの間に disconnect すると再接続を取りやめる", () => {
        const { client, sockets, socket } = setup({ reconnectDelayMs: 1000 })
        client.connect("ws://pi:9001")
        socket(0).simulateOpen()
        socket(0).simulateClose()

        client.disconnect()
        vi.advanceTimersByTime(5000)

        expect(sockets).toHaveLength(1)
        expect(client.getSnapshot().status).toBe("idle")
    })

    it("接続中に別 URL へ connect すると旧接続を止めて切り替える", () => {
        const { client, sockets, socket } = setup()
        client.connect("ws://pi-a:9001")
        socket(0).simulateOpen()
        client.setAxes({ vx: 1, wz: 0 })

        client.connect("ws://pi-b:9001")

        // 旧機体には停止指令を送ってから閉じる
        expect(socket(0).sent.at(-1)).toBe('{"vx":0,"wz":0}')
        expect(socket(0).closeCalls).toBe(1)
        expect(sockets).toHaveLength(2)
        expect(socket(1).url).toBe("ws://pi-b:9001")
        // 操縦中の軸はリセットされる(新しい機体に旧指令を引き継がない)
        expect(client.getSnapshot()).toEqual({ status: "connecting", axes: { vx: 0, wz: 0 } })
    })

    it("状態変化を購読でき、解除後は通知されない", () => {
        const { client, socket } = setup()
        const listener = vi.fn()
        const unsubscribe = client.subscribe(listener)

        client.connect("ws://pi:9001")
        expect(listener).toHaveBeenCalledTimes(1)

        socket(0).simulateOpen()
        expect(listener).toHaveBeenCalledTimes(2)

        unsubscribe()
        client.disconnect()
        expect(listener).toHaveBeenCalledTimes(2)
    })
})
