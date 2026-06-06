import { activeDirectionsFromAxes, axesFromKeys, clampAxes, STOP_AXES } from "./axes"

describe("axesFromKeys", () => {
    it("何も押されていなければ停止指令を返す", () => {
        expect(axesFromKeys(new Set())).toEqual({ vx: 0, wz: 0 })
    })

    it("w で前進 (vx=+1)、s で後退 (vx=-1)", () => {
        expect(axesFromKeys(new Set(["w"]))).toEqual({ vx: 1, wz: 0 })
        expect(axesFromKeys(new Set(["s"]))).toEqual({ vx: -1, wz: 0 })
    })

    it("a で左旋回 (wz=+1, REP-103)、d で右旋回 (wz=-1)", () => {
        expect(axesFromKeys(new Set(["a"]))).toEqual({ vx: 0, wz: 1 })
        expect(axesFromKeys(new Set(["d"]))).toEqual({ vx: 0, wz: -1 })
    })

    it("前進と旋回は同時に成立する", () => {
        expect(axesFromKeys(new Set(["w", "a"]))).toEqual({ vx: 1, wz: 1 })
    })

    it("相反するキーの同時押しは相殺して 0 になる", () => {
        expect(axesFromKeys(new Set(["w", "s"]))).toEqual({ vx: 0, wz: 0 })
        expect(axesFromKeys(new Set(["a", "d"]))).toEqual({ vx: 0, wz: 0 })
    })

    it("操縦に関係しないキーは無視する", () => {
        expect(axesFromKeys(new Set(["x", "enter", "w"]))).toEqual({ vx: 1, wz: 0 })
    })
})

describe("clampAxes", () => {
    it("範囲内の値はそのまま返す", () => {
        expect(clampAxes({ vx: 0.5, wz: -0.25 })).toEqual({ vx: 0.5, wz: -0.25 })
    })

    it("[-1, 1] を超える値を丸める", () => {
        expect(clampAxes({ vx: 1.5, wz: -2 })).toEqual({ vx: 1, wz: -1 })
    })

    it("有限でない値は 0 に落とす(機体へ NaN を送らない)", () => {
        expect(clampAxes({ vx: Number.NaN, wz: Number.POSITIVE_INFINITY })).toEqual({
            vx: 0,
            wz: 1,
        })
    })
})

describe("activeDirectionsFromAxes", () => {
    it("停止指令ではどの方向も点灯しない", () => {
        expect(activeDirectionsFromAxes(STOP_AXES)).toEqual(new Set())
    })

    it("軸の符号から点灯方向を導出する", () => {
        expect(activeDirectionsFromAxes({ vx: 1, wz: 0 })).toEqual(new Set(["w"]))
        expect(activeDirectionsFromAxes({ vx: -0.5, wz: 0 })).toEqual(new Set(["s"]))
        expect(activeDirectionsFromAxes({ vx: 0, wz: 1 })).toEqual(new Set(["a"]))
        expect(activeDirectionsFromAxes({ vx: 0, wz: -1 })).toEqual(new Set(["d"]))
        expect(activeDirectionsFromAxes({ vx: 1, wz: -1 })).toEqual(new Set(["w", "d"]))
    })
})
