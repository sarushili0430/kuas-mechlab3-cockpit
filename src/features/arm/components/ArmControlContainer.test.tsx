import { act, fireEvent, render, screen } from "@testing-library/react"
import { createKeyboardInput } from "@/features/teleop"
import type { ArmController } from "../lib/armController"
import type { ArmSnapshot } from "../types"
import { ArmControlContainer } from "./ArmControlContainer"

function createFakeArm() {
    let state: ArmSnapshot = { angles: { shoulder: 90, elbow: 90 }, directions: new Set() }
    const listeners = new Set<() => void>()
    const arm: ArmController = {
        subscribe: (listener) => {
            listeners.add(listener)
            return () => {
                listeners.delete(listener)
            }
        },
        getSnapshot: () => state,
        setDirections: vi.fn(),
        stepJoint: vi.fn(),
        home: vi.fn(),
    }
    const setState = (next: ArmSnapshot): void => {
        state = next
        for (const listener of listeners) {
            listener()
        }
    }
    return { arm, setState }
}

function renderContainer() {
    const { arm, setState } = createFakeArm()
    const view = render(<ArmControlContainer arm={arm} keyboard={createKeyboardInput(window)} />)
    return { arm, setState, view }
}

describe("ArmControlContainer", () => {
    it("矢印キーの押下/解放をジョグ方向としてコントローラへ流す", () => {
        const { arm } = renderContainer()

        fireEvent.keyDown(window, { key: "ArrowDown" })
        expect(arm.setDirections).toHaveBeenLastCalledWith(new Set(["down"]))

        fireEvent.keyUp(window, { key: "ArrowDown" })
        expect(arm.setDirections).toHaveBeenLastCalledWith(new Set())
    })

    it("画面パッドの押下/解放をジョグ方向としてコントローラへ流す", () => {
        const { arm } = renderContainer()
        const up = screen.getByRole("button", { name: "肘を上げる" })

        fireEvent.pointerDown(up, { button: 0 })
        expect(arm.setDirections).toHaveBeenLastCalledWith(new Set(["up"]))

        fireEvent.pointerUp(up)
        expect(arm.setDirections).toHaveBeenLastCalledWith(new Set())
    })

    it("矢印キーと画面パッドの同時入力を合成する", () => {
        const { arm } = renderContainer()

        fireEvent.keyDown(window, { key: "ArrowLeft" })
        expect(arm.setDirections).toHaveBeenLastCalledWith(new Set(["left"]))

        fireEvent.pointerDown(screen.getByRole("button", { name: "肘を上げる" }), { button: 0 })
        expect(arm.setDirections).toHaveBeenLastCalledWith(new Set(["left", "up"]))
    })

    it("▲/▼ ボタンで stepJoint を呼ぶ", () => {
        const { arm } = renderContainer()

        fireEvent.click(screen.getByRole("button", { name: "肩の角度を増やす" }))
        expect(arm.stepJoint).toHaveBeenLastCalledWith("shoulder", 1)

        fireEvent.click(screen.getByRole("button", { name: "肘の角度を減らす" }))
        expect(arm.stepJoint).toHaveBeenLastCalledWith("elbow", -1)
    })

    it("ホームボタンで home を呼ぶ", () => {
        const { arm } = renderContainer()

        fireEvent.click(screen.getByRole("button", { name: "ホーム" }))
        expect(arm.home).toHaveBeenCalledOnce()
    })

    it("目標角の変化が画面に反映される", () => {
        const { setState } = renderContainer()

        act(() => {
            setState({ angles: { shoulder: 120, elbow: 60 }, directions: new Set() })
        })

        expect(screen.getByText("120°")).toBeInTheDocument()
        expect(screen.getByText("60°")).toBeInTheDocument()
    })

    it("アンマウント後はキー入力を流さない", () => {
        const { arm, view } = renderContainer()
        view.unmount()
        vi.mocked(arm.setDirections).mockClear()

        fireEvent.keyDown(window, { key: "ArrowDown" })
        expect(arm.setDirections).not.toHaveBeenCalled()
    })
})
