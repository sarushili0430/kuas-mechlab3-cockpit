import { createArmController, type ArmControllerOptions } from "./armController"

function setup(overrides: Partial<ArmControllerOptions> = {}) {
    const sendServo = vi.fn()
    const controller = createArmController({
        sendServo,
        jogIntervalMs: 50,
        sendIntervalMs: 25,
        ease: 0.5,
        easeSnap: 0.15,
        keyStep: 1.5,
        buttonStep: 5,
        ...overrides,
    })
    return { controller, sendServo }
}

describe("createArmController", () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it("初期状態はホーム姿勢・ジョグ方向なし", () => {
        const { controller } = setup()
        expect(controller.getSnapshot()).toEqual({
            angles: { shoulder: 90, elbow: 90 },
            directions: new Set(),
        })
    })

    it("目標が変わらなければ送信しない (ホーム保持は送らない)", () => {
        const { controller, sendServo } = setup()
        controller.subscribe(vi.fn())
        vi.advanceTimersByTime(500)
        expect(sendServo).not.toHaveBeenCalled()
    })

    it("stepJoint で目標が動く", () => {
        const { controller } = setup()
        controller.subscribe(vi.fn())

        controller.stepJoint("shoulder", 1)
        controller.stepJoint("elbow", -1)

        expect(controller.getSnapshot().angles).toEqual({ shoulder: 95, elbow: 85 })
    })

    it("stepJoint 後にイージングで目標へ送信し、収束したら送信を止める", () => {
        const { controller, sendServo } = setup({ ease: 0.5 })
        controller.subscribe(vi.fn())

        controller.stepJoint("shoulder", 1) // 目標 95
        vi.advanceTimersByTime(1000)

        expect(sendServo).toHaveBeenCalled()
        expect(sendServo.mock.calls.at(-1)?.[0]).toEqual([95, 90])

        const settledCalls = sendServo.mock.calls.length
        vi.advanceTimersByTime(1000)
        expect(sendServo.mock.calls.length).toBe(settledCalls)
    })

    it("setDirections の方向へ押下中ジョグする", () => {
        const { controller } = setup()
        controller.subscribe(vi.fn())

        controller.setDirections(new Set(["up"]))
        vi.advanceTimersByTime(150) // 50ms x3 tick

        expect(controller.getSnapshot().angles.elbow).toBeCloseTo(94.5)

        controller.setDirections(new Set())
        const held = controller.getSnapshot().angles.elbow
        vi.advanceTimersByTime(150)
        expect(controller.getSnapshot().angles.elbow).toBe(held) // 離すと止まる
    })

    it("相反方向の同時押しは目標を動かさない", () => {
        const { controller } = setup()
        controller.subscribe(vi.fn())

        controller.setDirections(new Set(["up", "down"]))
        vi.advanceTimersByTime(200)

        expect(controller.getSnapshot().angles).toEqual({ shoulder: 90, elbow: 90 })
    })

    it("home で目標を 90/90 に戻す", () => {
        const { controller } = setup()
        controller.subscribe(vi.fn())

        controller.stepJoint("shoulder", 1)
        controller.stepJoint("elbow", -1)
        expect(controller.getSnapshot().angles).toEqual({ shoulder: 95, elbow: 85 })

        controller.home()
        expect(controller.getSnapshot().angles).toEqual({ shoulder: 90, elbow: 90 })
    })

    it("同じ方向集合では再通知しない", () => {
        const { controller } = setup()
        const listener = vi.fn()
        controller.subscribe(listener)

        controller.setDirections(new Set(["up"]))
        expect(listener).toHaveBeenCalledTimes(1)

        controller.setDirections(new Set(["up"]))
        expect(listener).toHaveBeenCalledTimes(1)

        controller.setDirections(new Set())
        expect(listener).toHaveBeenCalledTimes(2)
    })

    it("最後の購読解除でループが止まり送信されない", () => {
        const { controller, sendServo } = setup()
        const unsubscribe = controller.subscribe(vi.fn())
        unsubscribe()

        controller.stepJoint("shoulder", 1)
        vi.advanceTimersByTime(1000)

        expect(sendServo).not.toHaveBeenCalled()
    })

    it("状態変化を購読でき、解除後は通知されない", () => {
        const { controller } = setup()
        const listener = vi.fn()
        const unsubscribe = controller.subscribe(listener)

        controller.stepJoint("shoulder", 1)
        expect(listener).toHaveBeenCalledTimes(1)

        unsubscribe()
        controller.stepJoint("shoulder", 1)
        expect(listener).toHaveBeenCalledTimes(1)
    })
})
