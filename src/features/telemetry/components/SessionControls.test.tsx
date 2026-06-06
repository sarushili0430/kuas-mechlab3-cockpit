import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SessionControls } from "./SessionControls"

const defaultProps = {
    isRunning: false,
    elapsedMs: 0,
    onStart: vi.fn(),
    onStop: vi.fn(),
    onReset: vi.fn(),
}

describe("SessionControls", () => {
    it("経過時間を MM:SS 形式で表示する", () => {
        render(<SessionControls {...defaultProps} elapsedMs={61_000} />)
        expect(screen.getByText("01:01")).toBeInTheDocument()
    })

    it("停止中は計測開始ボタンを表示し、クリックで onStart を呼ぶ", async () => {
        const user = userEvent.setup()
        const onStart = vi.fn()
        render(<SessionControls {...defaultProps} onStart={onStart} />)

        await user.click(screen.getByRole("button", { name: "計測開始" }))

        expect(onStart).toHaveBeenCalledTimes(1)
    })

    it("稼働中は停止ボタンを表示し、クリックで onStop を呼ぶ", async () => {
        const user = userEvent.setup()
        const onStop = vi.fn()
        render(<SessionControls {...defaultProps} isRunning onStop={onStop} />)

        await user.click(screen.getByRole("button", { name: "停止" }))

        expect(onStop).toHaveBeenCalledTimes(1)
    })

    it("リセットボタンのクリックで onReset を呼ぶ", async () => {
        const user = userEvent.setup()
        const onReset = vi.fn()
        render(<SessionControls {...defaultProps} onReset={onReset} />)

        await user.click(screen.getByRole("button", { name: "リセット" }))

        expect(onReset).toHaveBeenCalledTimes(1)
    })

    it("稼働中はリセットボタンが無効になる", () => {
        render(<SessionControls {...defaultProps} isRunning />)
        expect(screen.getByRole("button", { name: "リセット" })).toBeDisabled()
    })

    it("停止中のスナップショットと一致する", () => {
        const { container } = render(<SessionControls {...defaultProps} />)
        expect(container).toMatchSnapshot()
    })

    it("稼働中のスナップショットと一致する", () => {
        const { container } = render(
            <SessionControls {...defaultProps} isRunning elapsedMs={61_000} />,
        )
        expect(container).toMatchSnapshot()
    })
})
