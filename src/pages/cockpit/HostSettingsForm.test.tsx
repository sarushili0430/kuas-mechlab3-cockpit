import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HostSettingsForm } from "./HostSettingsForm"

describe("HostSettingsForm", () => {
    it("現在のホストを初期値にしたラベル付き入力欄を表示する", () => {
        render(<HostSettingsForm host="192.168.1.42" onHostChange={vi.fn()} />)
        expect(screen.getByLabelText("接続先ホスト")).toHaveValue("192.168.1.42")
    })

    it("入力を適用すると正規化したホストでコールバックする", async () => {
        const user = userEvent.setup()
        const onHostChange = vi.fn()
        render(<HostSettingsForm host="192.168.1.42" onHostChange={onHostChange} />)

        const input = screen.getByLabelText("接続先ホスト")
        await user.clear(input)
        await user.type(input, " http://ml3.local/ ")
        await user.click(screen.getByRole("button", { name: "適用" }))

        expect(onHostChange).toHaveBeenCalledExactlyOnceWith("ml3.local")
    })

    it("Enter キーでも適用できる(操縦前にマウス操作を強制しない)", async () => {
        const user = userEvent.setup()
        const onHostChange = vi.fn()
        render(<HostSettingsForm host="192.168.1.42" onHostChange={onHostChange} />)

        const input = screen.getByLabelText("接続先ホスト")
        await user.clear(input)
        await user.type(input, "10.0.0.7{Enter}")

        expect(onHostChange).toHaveBeenCalledExactlyOnceWith("10.0.0.7")
    })

    it("無効な入力では適用せずエラーを表示する", async () => {
        const user = userEvent.setup()
        const onHostChange = vi.fn()
        render(<HostSettingsForm host="192.168.1.42" onHostChange={onHostChange} />)

        const input = screen.getByLabelText("接続先ホスト")
        await user.clear(input)
        await user.click(screen.getByRole("button", { name: "適用" }))

        expect(onHostChange).not.toHaveBeenCalled()
        expect(screen.getByText("ホスト名が無効です")).toBeInTheDocument()
        expect(input).toHaveAttribute("aria-invalid", "true")
    })

    it("スナップショットと一致する", () => {
        const { container } = render(
            <HostSettingsForm host="192.168.1.42" onHostChange={vi.fn()} />,
        )
        expect(container).toMatchSnapshot()
    })
})
