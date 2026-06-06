import { isLanguage, resolveInitialLanguage } from "./resolveLanguage"

describe("isLanguage", () => {
    it("対応言語コードを真と判定する", () => {
        expect(isLanguage("ja")).toBe(true)
        expect(isLanguage("en")).toBe(true)
    })

    it("非対応値や null を偽と判定する", () => {
        expect(isLanguage("fr")).toBe(false)
        expect(isLanguage("")).toBe(false)
        expect(isLanguage(null)).toBe(false)
    })
})

describe("resolveInitialLanguage", () => {
    it("保存済みの有効な言語をそのまま採用する", () => {
        expect(resolveInitialLanguage("en")).toBe("en")
        expect(resolveInitialLanguage("ja")).toBe("ja")
    })

    it("未保存・不正値では既定言語(ja)へフォールバックする", () => {
        expect(resolveInitialLanguage(null)).toBe("ja")
        expect(resolveInitialLanguage("xx")).toBe("ja")
    })
})
