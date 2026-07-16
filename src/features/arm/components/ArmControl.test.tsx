import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ArmDirection } from "../types"
import { ArmControl } from "./ArmControl"

const baseProps = {
    angles: { shoulder: 95, elbow: 85 },
    directions: new Set<ArmDirection>(),
    onStep: vi.fn(),
    onHome: vi.fn(),
} satisfies Parameters<typeof ArmControl>[0]

describe("ArmControl", () => {
    it("肩・肘の目標角を整数度で表示する", () => {
        render(<ArmControl {...baseProps} angles={{ shoulder: 95.4, elbow: 84.6 }} />)
        expect(screen.getByText("95°")).toBeInTheDocument()
        expect(screen.getByText("85°")).toBeInTheDocument()
    })

    it("▲(増やす)/▼(減らす)で onStep を関節と向き付きで呼ぶ", async () => {
        const user = userEvent.setup()
        const onStep = vi.fn()
        render(<ArmControl {...baseProps} onStep={onStep} />)

        await user.click(screen.getByRole("button", { name: "肩の角度を増やす" }))
        expect(onStep).toHaveBeenLastCalledWith("shoulder", 1)

        await user.click(screen.getByRole("button", { name: "肘の角度を減らす" }))
        expect(onStep).toHaveBeenLastCalledWith("elbow", -1)
    })

    it("ホームボタンで onHome を呼ぶ", async () => {
        const user = userEvent.setup()
        const onHome = vi.fn()
        render(<ArmControl {...baseProps} onHome={onHome} />)

        await user.click(screen.getByRole("button", { name: "ホーム" }))
        expect(onHome).toHaveBeenCalledOnce()
    })

    it("パッドの押下/解放を onPress/onRelease へ流す", () => {
        const onPress = vi.fn()
        const onRelease = vi.fn()
        render(<ArmControl {...baseProps} onPress={onPress} onRelease={onRelease} />)
        const up = screen.getByRole("button", { name: "肘を上げる" })

        fireEvent.pointerDown(up, { button: 0 })
        expect(onPress).toHaveBeenCalledExactlyOnceWith("up")

        fireEvent.pointerUp(up)
        expect(onRelease).toHaveBeenCalledExactlyOnceWith("up")
    })

    it("ジョグ中の方向がパッドに点灯する", () => {
        render(<ArmControl {...baseProps} directions={new Set(["up"])} />)
        expect(screen.getByRole("button", { name: "肘を上げる" })).toHaveAttribute(
            "data-active",
            "true",
        )
    })

    it("スナップショットと一致する", () => {
        const { container } = render(<ArmControl {...baseProps} />)
        expect(container).toMatchSnapshot()
    })
})
