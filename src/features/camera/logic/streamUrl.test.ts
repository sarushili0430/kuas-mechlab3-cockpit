import { buildStreamUrl } from "./streamUrl"

describe("buildStreamUrl", () => {
    it("ホストとトピックから MJPEG ストリーム URL を組み立てる", () => {
        expect(buildStreamUrl("192.168.1.42", "/front_camera/image_raw/compressed")).toBe(
            "http://192.168.1.42:8080/stream?topic=/front_camera/image_raw/compressed",
        )
    })

    it("ホスト名でも組み立てられる", () => {
        expect(buildStreamUrl("ml3.local", "/rear_camera/image_raw/compressed")).toBe(
            "http://ml3.local:8080/stream?topic=/rear_camera/image_raw/compressed",
        )
    })
})
