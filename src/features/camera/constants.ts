/** MJPEG 配信サーバの既定ポート (kuas-mechlab3 mjpeg_server) */
export const MJPEG_PORT = 8080

export interface CameraFeedConfig {
    readonly id: "front" | "rear"
    readonly label: string
    readonly topic: string
}

/** ML3 に搭載された前後カメラの配信トピック */
export const CAMERA_FEEDS: readonly CameraFeedConfig[] = [
    { id: "front", label: "前方", topic: "/front_camera/image_raw/compressed" },
    { id: "rear", label: "後方", topic: "/rear_camera/image_raw/compressed" },
]
