import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CockpitScreen } from "./CockpitScreen"

const baseProps = {
    host: "192.168.1.42",
    status: "idle",
    axes: { vx: 0, wz: 0 },
    cameras: [
        { id: "front", label: "前方", src: "http://pi:8080/stream?topic=/front" },
        { id: "rear", label: "後方", src: "http://pi:8080/stream?topic=/rear" },
    ],
    onHostChange: vi.fn(),
    onConnect: vi.fn(),
    onDisconnect: vi.fn(),
} satisfies Parameters<typeof CockpitScreen>[0]

describe("CockpitScreen", () => {
    it("タイトルと前後カメラ・操縦ヒントを表示する", () => {
        render(<CockpitScreen {...baseProps} />)
        expect(screen.getByRole("heading", { name: "ML3 COCKPIT" })).toBeInTheDocument()
        expect(screen.getByRole("img", { name: "前方カメラ映像" })).toBeInTheDocument()
        expect(screen.getByRole("img", { name: "後方カメラ映像" })).toBeInTheDocument()
        expect(screen.getByText(/W \/ A \/ S \/ D/)).toBeInTheDocument()
    })

    it("未接続では接続ボタンを表示し、押すと onConnect を呼ぶ", async () => {
        const user = userEvent.setup()
        const onConnect = vi.fn()
        render(<CockpitScreen {...baseProps} onConnect={onConnect} />)

        await user.click(screen.getByRole("button", { name: "接続" }))
        expect(onConnect).toHaveBeenCalledOnce()
    })

    it("接続済では緊急停止ボタンを表示し、押すと onDisconnect を呼ぶ", async () => {
        const user = userEvent.setup()
        const onDisconnect = vi.fn()
        render(<CockpitScreen {...baseProps} status="open" onDisconnect={onDisconnect} />)

        expect(screen.queryByRole("button", { name: "接続" })).not.toBeInTheDocument()
        await user.click(screen.getByRole("button", { name: "緊急停止" }))
        expect(onDisconnect).toHaveBeenCalledOnce()
    })

    it("接続試行中は接続中止ボタンを表示する", () => {
        render(<CockpitScreen {...baseProps} status="connecting" />)
        expect(screen.getByRole("button", { name: "接続中止" })).toBeInTheDocument()
    })

    it("送信中の軸値が操縦コンソールに反映される", () => {
        render(<CockpitScreen {...baseProps} status="open" axes={{ vx: 1, wz: -0.5 }} />)
        expect(screen.getByText("+1.00")).toBeInTheDocument()
        expect(screen.getByText("-0.50")).toBeInTheDocument()
        // vx>0 → 前進(W)、wz<0 → 右旋回(D) が点灯
        expect(screen.getByRole("button", { name: "前進" })).toHaveAttribute("data-active", "true")
        expect(screen.getByRole("button", { name: "右旋回" })).toHaveAttribute(
            "data-active",
            "true",
        )
    })

    it("方向ボタンの押下/解放を onDirectionPress/onDirectionRelease へ流す", () => {
        const onDirectionPress = vi.fn()
        const onDirectionRelease = vi.fn()
        render(
            <CockpitScreen
                {...baseProps}
                onDirectionPress={onDirectionPress}
                onDirectionRelease={onDirectionRelease}
            />,
        )
        const forward = screen.getByRole("button", { name: "前進" })

        fireEvent.pointerDown(forward, { button: 0 })
        expect(onDirectionPress).toHaveBeenCalledExactlyOnceWith("w")

        fireEvent.pointerUp(forward)
        expect(onDirectionRelease).toHaveBeenCalledExactlyOnceWith("w")
    })

    it("未接続のスナップショットと一致する", () => {
        const { container } = render(<CockpitScreen {...baseProps} />)
        expect(container).toMatchSnapshot()
    })

    it("操縦中のスナップショットと一致する", () => {
        const { container } = render(
            <CockpitScreen {...baseProps} status="open" axes={{ vx: 1, wz: 0 }} />,
        )
        expect(container).toMatchSnapshot()
    })
})
