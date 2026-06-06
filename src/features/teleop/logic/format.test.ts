import { formatAxisValue } from "./format"

describe("formatAxisValue", () => {
    it("正の値は + 符号付き小数2桁で整形する", () => {
        expect(formatAxisValue(1)).toBe("+1.00")
        expect(formatAxisValue(0.5)).toBe("+0.50")
    })

    it("負の値は - 符号付きで整形する", () => {
        expect(formatAxisValue(-1)).toBe("-1.00")
        expect(formatAxisValue(-0.25)).toBe("-0.25")
    })

    it("ゼロは +0.00 とする(桁ブレ防止のため常に符号を出す)", () => {
        expect(formatAxisValue(0)).toBe("+0.00")
        expect(formatAxisValue(-0)).toBe("+0.00")
    })
})
