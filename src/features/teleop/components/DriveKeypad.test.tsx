import { fireEvent, render, screen } from "@testing-library/react"
import { DriveKeypad } from "./DriveKeypad"

/** 各方向ボタンの既定 (ja) ラベル */
const LABEL = { w: "前進", a: "左旋回", s: "後退", d: "右旋回" } as const

describe("DriveKeypad", () => {
    it("前後左右の4つの方向ボタンを表示する", () => {
        render(<DriveKeypad directions={new Set()} />)
        for (const label of Object.values(LABEL)) {
            expect(screen.getByRole("button", { name: label })).toBeInTheDocument()
        }
    })

    it("アクティブな方向のボタンだけ点灯する", () => {
        render(<DriveKeypad directions={new Set(["w", "d"])} />)
        expect(screen.getByRole("button", { name: LABEL.w })).toHaveAttribute("data-active", "true")
        expect(screen.getByRole("button", { name: LABEL.d })).toHaveAttribute("data-active", "true")
        expect(screen.getByRole("button", { name: LABEL.a })).toHaveAttribute(
            "data-active",
            "false",
        )
        expect(screen.getByRole("button", { name: LABEL.s })).toHaveAttribute(
            "data-active",
            "false",
        )
        // スクリーンリーダー向けにも押下状態を伝える
        expect(screen.getByRole("button", { name: LABEL.w })).toHaveAttribute(
            "aria-pressed",
            "true",
        )
    })

    it("押下で onPress、解放で onRelease を方向付きで呼ぶ", () => {
        const onPress = vi.fn()
        const onRelease = vi.fn()
        render(<DriveKeypad directions={new Set()} onPress={onPress} onRelease={onRelease} />)
        const forward = screen.getByRole("button", { name: LABEL.w })

        fireEvent.pointerDown(forward, { button: 0 })
        expect(onPress).toHaveBeenCalledExactlyOnceWith("w")
        expect(onRelease).not.toHaveBeenCalled()

        fireEvent.pointerUp(forward)
        expect(onRelease).toHaveBeenCalledExactlyOnceWith("w")
    })

    it("押下中にボタン外へ出たら(マウス)解放する", () => {
        const onRelease = vi.fn()
        render(<DriveKeypad directions={new Set()} onRelease={onRelease} />)
        const right = screen.getByRole("button", { name: LABEL.d })

        fireEvent.pointerDown(right, { button: 0 })
        fireEvent.pointerLeave(right)
        expect(onRelease).toHaveBeenCalledExactlyOnceWith("d")
    })

    it("押していないボタンのホバー離脱では解放しない", () => {
        const onRelease = vi.fn()
        render(<DriveKeypad directions={new Set()} onRelease={onRelease} />)

        fireEvent.pointerLeave(screen.getByRole("button", { name: LABEL.s }))
        expect(onRelease).not.toHaveBeenCalled()
    })

    it("左ボタン以外(右クリック等)では操縦しない", () => {
        const onPress = vi.fn()
        render(<DriveKeypad directions={new Set()} onPress={onPress} />)

        fireEvent.pointerDown(screen.getByRole("button", { name: LABEL.a }), { button: 2 })
        expect(onPress).not.toHaveBeenCalled()
    })

    it("全消灯のスナップショットと一致する", () => {
        const { container } = render(<DriveKeypad directions={new Set()} />)
        expect(container).toMatchSnapshot()
    })

    it("前進+右旋回点灯のスナップショットと一致する", () => {
        const { container } = render(<DriveKeypad directions={new Set(["w", "d"])} />)
        expect(container).toMatchSnapshot()
    })
})
