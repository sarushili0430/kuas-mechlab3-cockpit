import type { Meta, StoryObj } from "@storybook/react-vite"
import { CameraFeed } from "./CameraFeed"

/** 実カメラの代わりに即 load が発火するダミーフレーム (320x240 グレー) */
const DUMMY_FRAME =
    "data:image/svg+xml," +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240">' +
            '<rect width="320" height="240" fill="#1E293B"/>' +
            '<circle cx="160" cy="120" r="40" fill="#0F172A" stroke="#60A5FA"/>' +
            "</svg>",
    )

const meta = {
    title: "Camera/CameraFeed",
    component: CameraFeed,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    decorators: [
        (Story) => (
            <div className="aspect-[4/3] w-96">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof CameraFeed>

export default meta
type Story = StoryObj<typeof meta>

/** ストリーム受信中 (ダミーフレームで load を発火させ LIVE 表示を再現) */
export const Live: Story = {
    args: { label: "前方", src: DUMMY_FRAME },
}

/** 接続先未設定 */
export const NoSource: Story = {
    args: { label: "前方", src: null },
}

/** 接続失敗 (到達不能な URL で error を発火させる) */
export const SignalLost: Story = {
    args: { label: "後方", src: "http://127.0.0.1:1/unreachable" },
}
