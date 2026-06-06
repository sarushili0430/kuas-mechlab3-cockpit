import type { Meta, StoryObj } from "@storybook/react-vite"
import { createTeleopClient, type WebSocketLike } from "@/features/teleop"
import { CockpitPage } from "./CockpitPage"

/** 常に接続に成功するデモ用ソケット(機体なしで操縦フローを試せる) */
function createDemoSocket(): WebSocketLike {
    let ready = 0
    const socket: WebSocketLike = {
        get readyState() {
            return ready
        },
        send: () => undefined,
        close: () => undefined,
        onopen: null,
        onclose: null,
        onerror: null,
    }
    setTimeout(() => {
        ready = 1
        socket.onopen?.()
    }, 400)
    return socket
}

function createMemoryStorage(): Storage {
    const data = new Map<string, string>()
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

const meta = {
    title: "Cockpit/CockpitPage",
    component: CockpitPage,
    parameters: {
        layout: "fullscreen",
    },
} satisfies Meta<typeof CockpitPage>

export default meta
type Story = StoryObj<typeof meta>

/**
 * 接続デモ。「接続」を押すと約0.4秒で接続済になり、
 * この画面にフォーカスして W / A / S / D を押すと操縦コンソールが反応する。
 * (カメラはデモ環境では届かないため NO SIGNAL になる)
 */
export const Demo: Story = {
    render: () => (
        <CockpitPage
            client={createTeleopClient({ createSocket: createDemoSocket })}
            storage={createMemoryStorage()}
        />
    ),
}
