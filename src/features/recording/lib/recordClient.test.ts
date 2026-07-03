import { createRecordClient, type RecordTransport } from "./recordClient"

const BASE = "http://pi:9002"

interface Call {
    readonly url: string
    readonly method: string
    readonly body: string | undefined
}

/** 応答タイミングをテストから制御できるトランスポートで client を組む */
function setup() {
    const calls: Call[] = []
    let pending: { resolve: (v: unknown) => void; reject: (e: unknown) => void } | null = null
    const transport: RecordTransport = (url, init) => {
        calls.push({ url, method: init.method, body: init.body })
        return new Promise((resolve, reject) => {
            pending = { resolve, reject }
        })
    }
    const client = createRecordClient({ transport })
    const settle = (value: unknown): void => {
        if (pending === null) {
            throw new Error("応答待ちのリクエストがない")
        }
        pending.resolve(value)
        pending = null
    }
    const fail = (): void => {
        if (pending === null) {
            throw new Error("応答待ちのリクエストがない")
        }
        pending.reject(new Error("network"))
        pending = null
    }
    return { client, calls, settle, fail }
}

describe("createRecordClient", () => {
    it("初期状態は idle", () => {
        const { client } = setup()
        expect(client.getSnapshot()).toEqual({
            status: "idle",
            episode: null,
            index: null,
            error: null,
        })
    })

    it("start で starting → 成功応答で recording になり URL/body を送る", async () => {
        const { client, calls, settle } = setup()

        const promise = client.start(BASE)
        expect(client.getSnapshot().status).toBe("starting")
        expect(calls[0]).toEqual({
            url: "http://pi:9002/record/start",
            method: "POST",
            body: "{}",
        })

        settle({ recording: true, index: 1, episode: "ep_001" })
        await promise

        expect(client.getSnapshot()).toEqual({
            status: "recording",
            episode: "ep_001",
            index: 1,
            error: null,
        })
    })

    it("録画中の start は無視する(二重開始を防ぐ)", async () => {
        const { client, calls, settle } = setup()
        const first = client.start(BASE)
        settle({ recording: true, index: 1, episode: "ep_001" })
        await first

        await client.start(BASE)
        expect(calls).toHaveLength(1)
    })

    it("stop で stopping → 成功応答で idle になり label を送る", async () => {
        const { client, calls, settle } = setup()
        const first = client.start(BASE)
        settle({ recording: true, index: 1, episode: "ep_001" })
        await first

        const promise = client.stop(BASE, "failure", "off route")
        expect(client.getSnapshot().status).toBe("stopping")
        expect(calls[1]).toEqual({
            url: "http://pi:9002/record/stop",
            method: "POST",
            body: '{"label":"failure","notes":"off route"}',
        })

        settle({ recording: false, saved: "ep_001", index: 1, label: "failure" })
        await promise
        expect(client.getSnapshot().status).toBe("idle")
        expect(client.getSnapshot().episode).toBe("ep_001")
    })

    it("discard で stopping → 成功応答で idle になる", async () => {
        const { client, calls, settle } = setup()
        const first = client.start(BASE)
        settle({ recording: true, index: 1, episode: "ep_001" })
        await first

        const promise = client.discard(BASE)
        expect(calls[1]?.url).toBe("http://pi:9002/record/discard")
        settle({ recording: false, discarded: true, episode: "ep_001", index: 1 })
        await promise
        expect(client.getSnapshot().status).toBe("idle")
    })

    it("録画していないときの stop/discard は無視する", async () => {
        const { client, calls } = setup()
        await client.stop(BASE, "success")
        await client.discard(BASE)
        expect(calls).toHaveLength(0)
    })

    it("通信失敗は error(unreachable) にする", async () => {
        const { client, fail } = setup()
        const promise = client.start(BASE)
        fail()
        await promise
        expect(client.getSnapshot().status).toBe("error")
        expect(client.getSnapshot().error).toBe("unreachable")
    })

    it("already_recording (409) はエラーにせず recording へ寄せて自己修復する", async () => {
        const { client, settle } = setup()
        const promise = client.start(BASE)
        settle({ recording: null, error: "already_recording" })
        await promise
        expect(client.getSnapshot().status).toBe("recording")
        expect(client.getSnapshot().error).toBeNull()
    })

    it("想定外のエラー応答は error に反映する", async () => {
        const { client, settle } = setup()
        const promise = client.start(BASE)
        settle({ recording: null, error: "invalid_response" })
        await promise
        expect(client.getSnapshot().status).toBe("error")
        expect(client.getSnapshot().error).toBe("invalid_response")
    })

    it("error からは start をやり直せる", async () => {
        const { client, calls, fail, settle } = setup()
        const first = client.start(BASE)
        fail()
        await first
        expect(client.getSnapshot().status).toBe("error")

        const second = client.start(BASE)
        expect(client.getSnapshot().status).toBe("starting")
        settle({ recording: true, index: 1, episode: "ep_001" })
        await second
        expect(client.getSnapshot().status).toBe("recording")
        expect(calls).toHaveLength(2)
    })

    it("refresh でサーバの現在状態を取り込む", async () => {
        const { client, calls, settle } = setup()
        const promise = client.refresh(BASE)
        expect(calls[0]).toEqual({
            url: "http://pi:9002/record/status",
            method: "GET",
            body: undefined,
        })
        settle({ recording: true, index: 5, episode: "ep_005" })
        await promise
        expect(client.getSnapshot()).toEqual({
            status: "recording",
            episode: "ep_005",
            index: 5,
            error: null,
        })
    })

    it("状態変化を購読でき、解除後は通知されない", async () => {
        const { client, settle } = setup()
        const listener = vi.fn()
        const unsubscribe = client.subscribe(listener)

        const promise = client.start(BASE)
        expect(listener).toHaveBeenCalledTimes(1) // starting
        settle({ recording: true, index: 1, episode: "ep_001" })
        await promise
        expect(listener).toHaveBeenCalledTimes(2) // recording

        unsubscribe()
        await client.start(BASE) // 録画中なので無視 → 通知なし
        expect(listener).toHaveBeenCalledTimes(2)
    })
})
