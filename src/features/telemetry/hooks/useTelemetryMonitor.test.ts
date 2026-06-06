import { act, renderHook } from "@testing-library/react"
import { createSimulatedTelemetrySource } from "../lib/telemetrySource"
import { useTelemetryMonitor } from "./useTelemetryMonitor"

describe("useTelemetryMonitor", () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    // ソースはレンダーをまたいで安定した参照であることが契約
    // (実アプリではモジュールシングルトンまたは useRef で保持する)
    const createSource = () =>
        createSimulatedTelemetrySource({ intervalMs: 100, maxHistoryLength: 5 })

    it("ソースの初期状態を返す", () => {
        const source = createSource()
        const { result } = renderHook(() => useTelemetryMonitor(source))

        expect(result.current.isRunning).toBe(false)
        expect(result.current.history).toEqual([])
        expect(result.current.elapsedMs).toBe(0)
    })

    it("start で計測が始まり状態が更新される", () => {
        const source = createSource()
        const { result } = renderHook(() => useTelemetryMonitor(source))

        act(() => {
            result.current.start()
            vi.advanceTimersByTime(300)
        })

        expect(result.current.isRunning).toBe(true)
        expect(result.current.history).toHaveLength(3)
        expect(result.current.elapsedMs).toBe(300)
    })

    it("stop で計測が止まる", () => {
        const source = createSource()
        const { result } = renderHook(() => useTelemetryMonitor(source))

        act(() => {
            result.current.start()
            vi.advanceTimersByTime(200)
        })
        act(() => {
            result.current.stop()
        })

        expect(result.current.isRunning).toBe(false)
        expect(result.current.history).toHaveLength(2)
    })

    it("reset で履歴と経過時間がクリアされる", () => {
        const source = createSource()
        const { result } = renderHook(() => useTelemetryMonitor(source))

        act(() => {
            result.current.start()
            vi.advanceTimersByTime(300)
        })
        act(() => {
            result.current.reset()
        })

        expect(result.current.isRunning).toBe(false)
        expect(result.current.history).toEqual([])
        expect(result.current.elapsedMs).toBe(0)
    })
})
