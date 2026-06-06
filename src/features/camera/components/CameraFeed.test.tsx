import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CameraFeed } from "./CameraFeed"

const SRC = "http://pi:8080/stream?topic=/front_camera/image_raw/compressed"

describe("CameraFeed", () => {
    it("接続先未設定 (src=null) では NO SIGNAL を表示し再試行は出さない", () => {
        render(<CameraFeed label="前方" src={null} />)
        expect(screen.getByText("NO SIGNAL")).toBeInTheDocument()
        expect(screen.queryByRole("button", { name: "再試行" })).not.toBeInTheDocument()
        expect(screen.queryByRole("img")).not.toBeInTheDocument()
    })

    it("src を渡すとストリーム画像と接続中表示を出す", () => {
        render(<CameraFeed label="前方" src={SRC} />)
        const img = screen.getByRole("img", { name: "前方カメラ映像" })
        expect(img).toHaveAttribute("src", SRC)
        expect(screen.getByText("接続中…")).toBeInTheDocument()
    })

    it("最初のフレーム受信 (load) で LIVE バッジに切り替わる", () => {
        render(<CameraFeed label="前方" src={SRC} />)
        fireEvent.load(screen.getByRole("img", { name: "前方カメラ映像" }))

        expect(screen.getByText("LIVE")).toBeInTheDocument()
        expect(screen.queryByText("接続中…")).not.toBeInTheDocument()
    })

    it("読み込み失敗で NO SIGNAL と再試行ボタンを表示する", () => {
        render(<CameraFeed label="前方" src={SRC} />)
        fireEvent.error(screen.getByRole("img", { name: "前方カメラ映像" }))

        expect(screen.getByText("NO SIGNAL")).toBeInTheDocument()
        expect(screen.getByRole("button", { name: "再試行" })).toBeInTheDocument()
        expect(screen.queryByRole("img")).not.toBeInTheDocument()
    })

    it("再試行で再び接続中に戻る", async () => {
        const user = userEvent.setup()
        render(<CameraFeed label="前方" src={SRC} />)
        fireEvent.error(screen.getByRole("img", { name: "前方カメラ映像" }))

        await user.click(screen.getByRole("button", { name: "再試行" }))

        expect(screen.getByRole("img", { name: "前方カメラ映像" })).toBeInTheDocument()
        expect(screen.getByText("接続中…")).toBeInTheDocument()
    })

    it("エラー後に src が変わると自動的に接続し直す", () => {
        const { rerender } = render(<CameraFeed label="前方" src={SRC} />)
        fireEvent.error(screen.getByRole("img", { name: "前方カメラ映像" }))

        rerender(<CameraFeed label="前方" src="http://pi-b:8080/stream?topic=/front" />)

        expect(screen.getByRole("img", { name: "前方カメラ映像" })).toBeInTheDocument()
        expect(screen.getByText("接続中…")).toBeInTheDocument()
    })

    it("ライブ中のスナップショットと一致する", () => {
        const { container } = render(<CameraFeed label="前方" src={SRC} />)
        fireEvent.load(screen.getByRole("img", { name: "前方カメラ映像" }))
        expect(container).toMatchSnapshot()
    })

    it("信号なしのスナップショットと一致する", () => {
        const { container } = render(<CameraFeed label="前方" src={null} />)
        expect(container).toMatchSnapshot()
    })
})
