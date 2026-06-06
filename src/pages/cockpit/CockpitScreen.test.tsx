import { render, screen } from "@testing-library/react"
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
        expect(screen.getByText(/W \/ A \/ S \/ D で操縦/)).toBeInTheDocument()
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
        // vx>0 → W、wz<0 → D が点灯
        expect(screen.getByText("W")).toHaveAttribute("data-active", "true")
        expect(screen.getByText("D")).toHaveAttribute("data-active", "true")
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
