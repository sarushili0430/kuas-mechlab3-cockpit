import { formatElapsedTime, formatValue } from "./format"

describe("formatValue", () => {
    it("指定した小数桁で丸める", () => {
        expect(formatValue(3.14159, 2)).toBe("3.14")
    })

    it("precision 0 なら整数表示", () => {
        expect(formatValue(2456.7, 0)).toBe("2457")
    })

    it("桁が足りない場合はゼロ埋めする", () => {
        expect(formatValue(3.5, 2)).toBe("3.50")
    })
})

describe("formatElapsedTime", () => {
    it("0ms は 00:00", () => {
        expect(formatElapsedTime(0)).toBe("00:00")
    })

    it("秒は切り捨てで表示する", () => {
        expect(formatElapsedTime(1999)).toBe("00:01")
    })

    it("1分1秒は 01:01", () => {
        expect(formatElapsedTime(61_000)).toBe("01:01")
    })

    it("60分以上は分の桁が増える", () => {
        expect(formatElapsedTime(5_400_000)).toBe("90:00")
    })
})
