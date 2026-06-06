import { interpolate } from "./interpolate"

describe("interpolate", () => {
    it("params がなければテンプレートをそのまま返す", () => {
        expect(interpolate("接続中…")).toBe("接続中…")
    })

    it("{name} を params の値で差し替える", () => {
        expect(interpolate("{label}カメラ映像", { label: "前方" })).toBe("前方カメラ映像")
    })

    it("数値も文字列化して差し替える", () => {
        expect(interpolate("残り {count} 件", { count: 3 })).toBe("残り 3 件")
    })

    it("同じプレースホルダを複数回展開する", () => {
        expect(interpolate("{x}{x}", { x: "a" })).toBe("aa")
    })

    it("対応する値がないプレースホルダはそのまま残す", () => {
        expect(interpolate("{a}/{b}", { a: "x" })).toBe("x/{b}")
    })
})
