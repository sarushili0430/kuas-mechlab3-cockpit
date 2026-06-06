import type { Meta, StoryObj } from "@storybook/react-vite"
import { CockpitScreen } from "./CockpitScreen"

/** 実カメラの代わりに即 load が発火するダミーフレーム */
const DUMMY_FRAME =
    "data:image/svg+xml," +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240">' +
            '<rect width="320" height="240" fill="#1E293B"/>' +
            '<circle cx="160" cy="120" r="40" fill="#0F172A" stroke="#60A5FA"/>' +
            "</svg>",
    )

const cameras = [
    { id: "front", label: "前方", src: DUMMY_FRAME },
    { id: "rear", label: "後方", src: DUMMY_FRAME },
]

const meta = {
    title: "Cockpit/CockpitScreen",
    component: CockpitScreen,
    parameters: {
        layout: "fullscreen",
    },
    tags: ["autodocs"],
    args: {
        host: "192.168.1.42",
        cameras,
        onHostChange: () => undefined,
        onConnect: () => undefined,
        onDisconnect: () => undefined,
    },
} satisfies Meta<typeof CockpitScreen>

export default meta
type Story = StoryObj<typeof meta>

/** 起動直後(未接続) */
export const Idle: Story = {
    args: {
        status: "idle",
        axes: { vx: 0, wz: 0 },
    },
}

/** 接続済・前進+左旋回中 */
export const Driving: Story = {
    args: {
        status: "open",
        axes: { vx: 1, wz: 1 },
    },
}

/** 通信断から再接続待ち */
export const Reconnecting: Story = {
    args: {
        status: "reconnecting",
        axes: { vx: 0, wz: 0 },
        cameras: [
            { id: "front", label: "前方", src: null },
            { id: "rear", label: "後方", src: null },
        ],
    },
}
