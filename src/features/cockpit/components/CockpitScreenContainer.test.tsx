import { act, render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createKeyboardInput, type TeleopClient, type TeleopSnapshot } from "@/features/teleop"
import { CockpitScreenContainer } from "./CockpitScreenContainer"

function createFakeClient() {
    let state: TeleopSnapshot = { status: "idle", axes: { vx: 0, wz: 0 } }
    const listeners = new Set<() => void>()
    const client: TeleopClient = {
        subscribe: (listener) => {
            listeners.add(listener)
            return () => {
                listeners.delete(listener)
            }
        },
        getSnapshot: () => state,
        connect: vi.fn(),
        disconnect: vi.fn(),
        setAxes: vi.fn(),
    }
    const setState = (next: TeleopSnapshot): void => {
        state = next
        for (const listener of listeners) {
            listener()
        }
    }
    return { client, setState }
}

function createMemoryStorage(initial: Record<string, string> = {}): Storage {
    const data = new Map(Object.entries(initial))
    return {
        get length() {
            return data.size
        },
        clear: () => {
            data.clear()
        },
        getItem: (key) => data.get(key) ?? null,
        key: () => null,
        removeItem: (key) => {
            data.delete(key)
        },
        setItem: (key, value) => {
            data.set(key, value)
        },
    }
}

function renderContainer(overrides: Partial<Parameters<typeof CockpitScreenContainer>[0]> = {}) {
    const { client, setState } = createFakeClient()
    const storage = createMemoryStorage()
    const view = render(
        <CockpitScreenContainer
            client={client}
            keyboard={createKeyboardInput(window)}
            storage={storage}
            {...overrides}
        />,
    )
    return { client, setState, storage, view }
}

describe("CockpitScreenContainer", () => {
    it("保存済みホストを初期値として表示し、カメラ URL に反映する", () => {
        renderContainer({ storage: createMemoryStorage({ "ml3-cockpit.host": "10.0.0.7" }) })

        expect(screen.getByLabelText("接続先ホスト")).toHaveValue("10.0.0.7")
        expect(screen.getByRole("img", { name: "前方カメラ映像" })).toHaveAttribute(
            "src",
            "http://10.0.0.7:8080/stream?topic=/front_camera/image_raw/compressed",
        )
    })

    it("接続ボタンで現在ホストの teleop URL へ接続する", async () => {
        const user = userEvent.setup()
        const { client } = renderContainer({
            storage: createMemoryStorage({ "ml3-cockpit.host": "10.0.0.7" }),
        })

        await user.click(screen.getByRole("button", { name: "接続" }))

        expect(client.connect).toHaveBeenCalledExactlyOnceWith("ws://10.0.0.7:9001")
    })

    it("キー押下を軸指令としてクライアントへ流す", () => {
        const { client } = renderContainer()

        fireEvent.keyDown(window, { key: "w" })
        expect(client.setAxes).toHaveBeenLastCalledWith({ vx: 1, wz: 0 })

        fireEvent.keyUp(window, { key: "w" })
        expect(client.setAxes).toHaveBeenLastCalledWith({ vx: 0, wz: 0 })
    })

    it("アンマウント後はキー入力を流さない", () => {
        const { client, view } = renderContainer()
        view.unmount()

        fireEvent.keyDown(window, { key: "w" })
        expect(client.setAxes).not.toHaveBeenCalled()
    })

    it("ホスト適用で保存し、カメラ URL を切り替える", async () => {
        const user = userEvent.setup()
        const { storage } = renderContainer()

        const input = screen.getByLabelText("接続先ホスト")
        await user.clear(input)
        await user.type(input, "ml3.local{Enter}")

        expect(storage.getItem("ml3-cockpit.host")).toBe("ml3.local")
        expect(screen.getByRole("img", { name: "前方カメラ映像" })).toHaveAttribute(
            "src",
            "http://ml3.local:8080/stream?topic=/front_camera/image_raw/compressed",
        )
    })

    it("接続中のホスト変更は新しい teleop URL へ繋ぎ直す", async () => {
        const user = userEvent.setup()
        const { client, setState } = renderContainer()
        act(() => {
            setState({ status: "open", axes: { vx: 0, wz: 0 } })
        })

        const input = screen.getByLabelText("接続先ホスト")
        await user.clear(input)
        await user.type(input, "ml3.local{Enter}")

        expect(client.connect).toHaveBeenCalledExactlyOnceWith("ws://ml3.local:9001")
    })

    it("未接続でのホスト変更では接続を開始しない", async () => {
        const user = userEvent.setup()
        const { client } = renderContainer()

        const input = screen.getByLabelText("接続先ホスト")
        await user.clear(input)
        await user.type(input, "ml3.local{Enter}")

        expect(client.connect).not.toHaveBeenCalled()
    })

    it("ページ離脱 (pagehide) で切断して機体を止める", () => {
        const { client } = renderContainer()

        fireEvent(window, new Event("pagehide"))
        expect(client.disconnect).toHaveBeenCalledOnce()
    })

    it("クライアントの状態変化が画面へ反映される", () => {
        const { setState } = renderContainer()

        act(() => {
            setState({ status: "open", axes: { vx: 1, wz: 0 } })
        })

        expect(screen.getByRole("button", { name: "緊急停止" })).toBeInTheDocument()
        expect(screen.getByText("+1.00")).toBeInTheDocument()
    })
})
