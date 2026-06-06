/** MJPEG 配信サーバの既定ポート (kuas-mechlab3 mjpeg_server) */
export const MJPEG_PORT = 8080

export interface CameraFeedConfig {
    readonly id: "front" | "rear"
    readonly topic: string
}

/**
 * ML3 に搭載された前後カメラの配信トピック。
 * 表示ラベルは id をキーに i18n 側(`camera.front` / `camera.rear`)で解決する。
 */
export const CAMERA_FEEDS: readonly CameraFeedConfig[] = [
    { id: "front", topic: "/front_camera/image_raw/compressed" },
    { id: "rear", topic: "/rear_camera/image_raw/compressed" },
]
