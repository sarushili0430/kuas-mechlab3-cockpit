import { Buffer } from "node:buffer"
import { createServer } from "node:http"
import type { AddressInfo } from "node:net"
import { describe, expect, it } from "vitest"
import { extractFirstJpeg, fetchFrame } from "./camera"

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 0xff, 0xd9])

function part(jpeg: Buffer): Buffer {
    const header = Buffer.from(
        `--ml3frame\r\nContent-Type: image/jpeg\r\nContent-Length: ${String(jpeg.length)}\r\n\r\n`,
    )
    return Buffer.concat([header, jpeg, Buffer.from("\r\n")])
}

describe("extractFirstJpeg", () => {
    it("extracts a full multipart JPEG via Content-Length", () => {
        const jpeg = extractFirstJpeg(part(JPEG))
        expect(jpeg?.equals(JPEG)).toBe(true)
    })

    it("returns null when the frame is incomplete", () => {
        expect(extractFirstJpeg(part(JPEG).subarray(0, 20))).toBeNull()
    })

    it("assembles a frame across chunk boundaries", () => {
        const full = part(JPEG)
        expect(extractFirstJpeg(full.subarray(0, 15))).toBeNull()
        const joined = extractFirstJpeg(Buffer.concat([full.subarray(0, 15), full.subarray(15)]))
        expect(joined?.equals(JPEG)).toBe(true)
    })

    it("falls back to SOI/EOI markers when there is no boundary", () => {
        const buf = Buffer.concat([
            Buffer.from("garbage"),
            Buffer.from([0xff, 0xd8]),
            Buffer.from("body"),
            Buffer.from([0xff, 0xd9]),
            Buffer.from("tail"),
        ])
        const expected = Buffer.concat([
            Buffer.from([0xff, 0xd8]),
            Buffer.from("body"),
            Buffer.from([0xff, 0xd9]),
        ])
        expect(extractFirstJpeg(buf)?.equals(expected)).toBe(true)
    })
})

function mjpegPart(jpeg: Buffer): Buffer {
    return Buffer.concat([
        Buffer.from(
            `--ml3frame\r\nContent-Type: image/jpeg\r\nContent-Length: ${String(jpeg.length)}\r\n\r\n`,
        ),
        jpeg,
        Buffer.from("\r\n"),
    ])
}

describe("fetchFrame", () => {
    it("reads one JPEG frame from a live MJPEG stream", async () => {
        const server = createServer((_req, res) => {
            res.writeHead(200, {
                "Content-Type": "multipart/x-mixed-replace; boundary=ml3frame",
                Connection: "close",
            })
            res.end(mjpegPart(JPEG))
        })
        await new Promise<void>((resolve) => {
            server.listen(0, "127.0.0.1", resolve)
        })
        try {
            const { port } = server.address() as AddressInfo
            const image = await fetchFrame(`http://127.0.0.1:${String(port)}/stream?topic=/front`)
            expect(image.mediaType).toBe("image/jpeg")
            expect(Buffer.from(image.base64, "base64").equals(JPEG)).toBe(true)
        } finally {
            server.close()
        }
    })
})
