import { DEFAULT_HOST, resolveInitialHost, sanitizeHost } from "./hostConfig"

describe("sanitizeHost", () => {
    it("前後の空白を取り除く", () => {
        expect(sanitizeHost("  192.168.1.42  ")).toBe("192.168.1.42")
    })

    it("貼り付けられがちな URL からホスト部を取り出す(スキーム・末尾スラッシュ除去)", () => {
        expect(sanitizeHost("http://192.168.1.42/")).toBe("192.168.1.42")
        expect(sanitizeHost("ws://ml3.local")).toBe("ml3.local")
    })

    it("空文字・空白のみは無効として null を返す", () => {
        expect(sanitizeHost("")).toBeNull()
        expect(sanitizeHost("   ")).toBeNull()
    })

    it("空白を含むホストは無効", () => {
        expect(sanitizeHost("192.168 1.42")).toBeNull()
    })
})

describe("resolveInitialHost", () => {
    it("保存済みホストを最優先で使う", () => {
        expect(resolveInitialHost("10.0.0.5", "ml3.local")).toBe("10.0.0.5")
    })

    it("保存がなければ配信元ホスト名を使う(Pi から配信されるケース)", () => {
        expect(resolveInitialHost(null, "192.168.1.42")).toBe("192.168.1.42")
    })

    it("ローカル開発 (localhost) の配信元は採用せず既定値に落とす", () => {
        expect(resolveInitialHost(null, "localhost")).toBe(DEFAULT_HOST)
        expect(resolveInitialHost(null, "127.0.0.1")).toBe(DEFAULT_HOST)
    })

    it("配信元が空 (file:// で開いた場合) は既定値に落とす", () => {
        expect(resolveInitialHost(null, "")).toBe(DEFAULT_HOST)
    })
})
