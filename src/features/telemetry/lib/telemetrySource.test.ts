import { createSimulatedTelemetrySource } from "./telemetrySource"

describe("createSimulatedTelemetrySource", () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    const createSource = () =>
        createSimulatedTelemetrySource({ intervalMs: 100, maxHistoryLength: 5 })

    it("初期状態は停止中・履歴なし・経過時間ゼロ", () => {
        const source = createSource()
        expect(source.getSnapshot()).toEqual({
            isRunning: false,
            history: [],
            elapsedMs: 0,
        })
    })

    it("start すると稼働中になりリスナーへ通知する", () => {
        const source = createSource()
        const listener = vi.fn()
        source.subscribe(listener)

        source.start()

        expect(source.getSnapshot().isRunning).toBe(true)
        expect(listener).toHaveBeenCalledTimes(1)
    })

    it("稼働中はサンプリング間隔ごとに履歴へサンプルを追加する", () => {
        const source = createSource()
        source.start()

        vi.advanceTimersByTime(300)

        const { history, elapsedMs } = source.getSnapshot()
        expect(history).toHaveLength(3)
        expect(elapsedMs).toBe(300)
    })

    it("履歴は maxHistoryLength でリングバッファとして保持する", () => {
        const source = createSource()
        source.start()

        vi.advanceTimersByTime(800)

        expect(source.getSnapshot().history).toHaveLength(5)
    })

    it("stop するとサンプリングが止まる", () => {
        const source = createSource()
        source.start()
        vi.advanceTimersByTime(200)

        source.stop()
        vi.advanceTimersByTime(500)

        const { history, isRunning } = source.getSnapshot()
        expect(isRunning).toBe(false)
        expect(history).toHaveLength(2)
    })

    it("stop 後に start すると経過時間を引き継いで再開する", () => {
        const source = createSource()
        source.start()
        vi.advanceTimersByTime(200)
        source.stop()

        source.start()
        vi.advanceTimersByTime(100)

        expect(source.getSnapshot().elapsedMs).toBe(300)
    })

    it("reset すると履歴と経過時間がクリアされる", () => {
        const source = createSource()
        source.start()
        vi.advanceTimersByTime(300)
        source.stop()

        source.reset()

        expect(source.getSnapshot()).toEqual({
            isRunning: false,
            history: [],
            elapsedMs: 0,
        })
    })

    it("unsubscribe したリスナーには通知しない", () => {
        const source = createSource()
        const listener = vi.fn()
        const unsubscribe = source.subscribe(listener)

        unsubscribe()
        source.start()

        expect(listener).not.toHaveBeenCalled()
    })

    it("状態が変わらない限り getSnapshot は同一参照を返す(useSyncExternalStore 要件)", () => {
        const source = createSource()
        const first = source.getSnapshot()
        const second = source.getSnapshot()
        expect(first).toBe(second)
    })
})
