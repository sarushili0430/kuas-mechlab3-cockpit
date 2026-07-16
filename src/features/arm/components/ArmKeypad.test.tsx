import { fireEvent, render, screen } from "@testing-library/react"
import { ArmKeypad } from "./ArmKeypad"

/** 各方向ボタンの既定 (ja) ラベル */
const LABEL = {
    up: "肘を上げる",
    down: "肘を下げる",
    left: "肩を上げる",
    right: "肩を下げる",
} as const

describe("ArmKeypad", () => {
    it("上下左右の4つの方向ボタンを表示する", () => {
        render(<ArmKeypad directions={new Set()} />)
        for (const label of Object.values(LABEL)) {
            expect(screen.getByRole("button", { name: label })).toBeInTheDocument()
        }
    })

    it("アクティブな方向のボタンだけ点灯する", () => {
        render(<ArmKeypad directions={new Set(["up", "left"])} />)
        expect(screen.getByRole("button", { name: LABEL.up })).toHaveAttribute(
            "data-active",
            "true",
        )
        expect(screen.getByRole("button", { name: LABEL.left })).toHaveAttribute(
            "data-active",
            "true",
        )
        expect(screen.getByRole("button", { name: LABEL.down })).toHaveAttribute(
            "data-active",
            "false",
        )
        expect(screen.getByRole("button", { name: LABEL.up })).toHaveAttribute(
            "aria-pressed",
            "true",
        )
    })

    it("押下で onPress、解放で onRelease を方向付きで呼ぶ", () => {
        const onPress = vi.fn()
        const onRelease = vi.fn()
        render(<ArmKeypad directions={new Set()} onPress={onPress} onRelease={onRelease} />)
        const up = screen.getByRole("button", { name: LABEL.up })

        fireEvent.pointerDown(up, { button: 0 })
        expect(onPress).toHaveBeenCalledExactlyOnceWith("up")
        expect(onRelease).not.toHaveBeenCalled()

        fireEvent.pointerUp(up)
        expect(onRelease).toHaveBeenCalledExactlyOnceWith("up")
    })

    it("押下中にボタン外へ出たら(マウス)解放する", () => {
        const onRelease = vi.fn()
        render(<ArmKeypad directions={new Set()} onRelease={onRelease} />)
        const left = screen.getByRole("button", { name: LABEL.left })

        fireEvent.pointerDown(left, { button: 0 })
        fireEvent.pointerLeave(left)
        expect(onRelease).toHaveBeenCalledExactlyOnceWith("left")
    })

    it("左ボタン以外(右クリック等)では操作しない", () => {
        const onPress = vi.fn()
        render(<ArmKeypad directions={new Set()} onPress={onPress} />)

        fireEvent.pointerDown(screen.getByRole("button", { name: LABEL.down }), { button: 2 })
        expect(onPress).not.toHaveBeenCalled()
    })

    it("全消灯のスナップショットと一致する", () => {
        const { container } = render(<ArmKeypad directions={new Set()} />)
        expect(container).toMatchSnapshot()
    })
})
