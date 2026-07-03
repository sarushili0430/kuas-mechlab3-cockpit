import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { RecordingControl } from "./RecordingControl"

const baseProps = {
    status: "idle",
    episode: null,
    error: null,
    label: "success",
    onLabelChange: vi.fn(),
    onStart: vi.fn(),
    onStop: vi.fn(),
    onDiscard: vi.fn(),
} satisfies Parameters<typeof RecordingControl>[0]

function renderControl(overrides: Partial<Parameters<typeof RecordingControl>[0]> = {}) {
    // Provider 外でも既定言語(ja)で動く(I18nContext の既定値)。
    return render(<RecordingControl {...baseProps} {...overrides} />)
}

describe("RecordingControl", () => {
    it("停止中は開始ボタンを表示し、押すと onStart を呼ぶ", async () => {
        const user = userEvent.setup()
        const onStart = vi.fn()
        renderControl({ onStart })

        const button = screen.getByRole("button", { name: "データ収集を開始" })
        await user.click(button)
        expect(onStart).toHaveBeenCalledOnce()
    })

    it("開始要求中はボタンを無効化して開始中を表示する", () => {
        renderControl({ status: "starting" })
        expect(screen.getByRole("button", { name: "開始中…" })).toBeDisabled()
    })

    it("録画中は保存/破棄と成否ラベルを表示する", () => {
        renderControl({ status: "recording", episode: "ep_001" })
        expect(screen.getByRole("button", { name: "保存して停止" })).toBeInTheDocument()
        expect(screen.getByRole("button", { name: "破棄" })).toBeInTheDocument()
        expect(screen.getByRole("button", { name: "成功" })).toHaveAttribute("aria-pressed", "true")
        expect(screen.getByText("ep_001")).toBeInTheDocument()
    })

    it("保存/破棄ボタンで onStop/onDiscard を呼ぶ", async () => {
        const user = userEvent.setup()
        const onStop = vi.fn()
        const onDiscard = vi.fn()
        renderControl({ status: "recording", onStop, onDiscard })

        await user.click(screen.getByRole("button", { name: "保存して停止" }))
        expect(onStop).toHaveBeenCalledOnce()

        await user.click(screen.getByRole("button", { name: "破棄" }))
        expect(onDiscard).toHaveBeenCalledOnce()
    })

    it("ラベルボタンで onLabelChange を呼ぶ", async () => {
        const user = userEvent.setup()
        const onLabelChange = vi.fn()
        renderControl({ status: "recording", onLabelChange })

        await user.click(screen.getByRole("button", { name: "失敗" }))
        expect(onLabelChange).toHaveBeenCalledExactlyOnceWith("failure")
    })

    it("エラー時は種別に応じた案内を表示する", () => {
        renderControl({ status: "error", error: "unreachable" })
        expect(screen.getByText("録画 API に接続できません")).toBeInTheDocument()
    })
})
