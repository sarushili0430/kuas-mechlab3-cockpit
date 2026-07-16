import { ARM_HOME } from "../constants"
import {
    anglesEqual,
    armDirectionsFromKeys,
    clampAngle,
    displayAngle,
    easeAngles,
    jogAngles,
    roundAngle,
    servoPayload,
    stepJointAngles,
} from "./arm"

describe("clampAngle", () => {
    it("可動域内はそのまま返す", () => {
        expect(clampAngle(90)).toBe(90)
    })

    it("下限・上限を超えたら丸める", () => {
        expect(clampAngle(-10)).toBe(0)
        expect(clampAngle(200)).toBe(180)
    })

    it("非有限値は下限へ落とす (機体へ NaN を送らない)", () => {
        expect(clampAngle(Number.NaN)).toBe(0)
        expect(clampAngle(Number.POSITIVE_INFINITY)).toBe(0)
    })
})

describe("stepJointAngles", () => {
    it("指定関節だけを動かす", () => {
        expect(stepJointAngles({ shoulder: 90, elbow: 90 }, "shoulder", 5)).toEqual({
            shoulder: 95,
            elbow: 90,
        })
        expect(stepJointAngles({ shoulder: 90, elbow: 90 }, "elbow", -5)).toEqual({
            shoulder: 90,
            elbow: 85,
        })
    })

    it("可動域端でクランプする", () => {
        expect(stepJointAngles({ shoulder: 178, elbow: 2 }, "shoulder", 5)).toEqual({
            shoulder: 180,
            elbow: 2,
        })
        expect(stepJointAngles({ shoulder: 178, elbow: 2 }, "elbow", -5)).toEqual({
            shoulder: 178,
            elbow: 0,
        })
    })
})

describe("jogAngles", () => {
    it("up/down は肘、left/right は肩を動かす", () => {
        expect(jogAngles({ shoulder: 90, elbow: 90 }, new Set(["up"]), 1.5)).toEqual({
            shoulder: 90,
            elbow: 91.5,
        })
        expect(jogAngles({ shoulder: 90, elbow: 90 }, new Set(["down"]), 1.5)).toEqual({
            shoulder: 90,
            elbow: 88.5,
        })
        expect(jogAngles({ shoulder: 90, elbow: 90 }, new Set(["left"]), 1.5)).toEqual({
            shoulder: 91.5,
            elbow: 90,
        })
        expect(jogAngles({ shoulder: 90, elbow: 90 }, new Set(["right"]), 1.5)).toEqual({
            shoulder: 88.5,
            elbow: 90,
        })
    })

    it("肩と肘を同時に動かせる", () => {
        expect(jogAngles({ shoulder: 90, elbow: 90 }, new Set(["up", "left"]), 2)).toEqual({
            shoulder: 92,
            elbow: 92,
        })
    })

    it("相反方向は相殺する", () => {
        expect(jogAngles({ shoulder: 90, elbow: 90 }, new Set(["up", "down"]), 1.5)).toEqual({
            shoulder: 90,
            elbow: 90,
        })
    })

    it("可動域端でクランプする", () => {
        expect(jogAngles({ shoulder: 90, elbow: 180 }, new Set(["up"]), 1.5)).toEqual({
            shoulder: 90,
            elbow: 180,
        })
    })
})

describe("easeAngles", () => {
    it("差が snap より大きい間は割合で近づける (changed=true)", () => {
        const result = easeAngles(
            { shoulder: 90, elbow: 90 },
            { shoulder: 100, elbow: 90 },
            0.5,
            0.15,
        )
        expect(result.changed).toBe(true)
        expect(result.next.shoulder).toBeCloseTo(95)
        expect(result.next.elbow).toBe(90)
    })

    it("差が snap 以下なら目標へスナップする", () => {
        const result = easeAngles(
            { shoulder: 89.95, elbow: 90 },
            { shoulder: 90, elbow: 90 },
            0.5,
            0.15,
        )
        expect(result.changed).toBe(true)
        expect(result.next.shoulder).toBe(90)
    })

    it("既に一致していれば変化なし (changed=false)", () => {
        const result = easeAngles(
            { shoulder: 90, elbow: 90 },
            { shoulder: 90, elbow: 90 },
            0.5,
            0.15,
        )
        expect(result.changed).toBe(false)
        expect(result.next).toEqual({ shoulder: 90, elbow: 90 })
    })

    it("繰り返すと目標へ収束する", () => {
        let current = { shoulder: 90, elbow: 90 }
        const target = { shoulder: 120, elbow: 60 }
        for (let i = 0; i < 200; i++) {
            current = easeAngles(current, target, 0.22, 0.15).next
        }
        expect(current).toEqual(target)
    })
})

describe("roundAngle / servoPayload", () => {
    it("小数第 1 位へ丸める", () => {
        expect(roundAngle(90.04)).toBe(90)
        expect(roundAngle(90.06)).toBe(90.1)
    })

    it("servoPayload は [肩, 肘] を丸めて返す", () => {
        expect(servoPayload({ shoulder: 90.04, elbow: 45.16 })).toEqual([90, 45.2])
    })
})

describe("displayAngle", () => {
    it("整数度へ丸める", () => {
        expect(displayAngle(90.4)).toBe(90)
        expect(displayAngle(90.6)).toBe(91)
    })
})

describe("anglesEqual", () => {
    it("両関節が一致するときだけ真", () => {
        expect(anglesEqual({ shoulder: 90, elbow: 90 }, { shoulder: 90, elbow: 90 })).toBe(true)
        expect(anglesEqual({ shoulder: 90, elbow: 90 }, { shoulder: 91, elbow: 90 })).toBe(false)
    })
})

describe("armDirectionsFromKeys", () => {
    it("矢印キーだけをジョグ方向へ写す", () => {
        expect(armDirectionsFromKeys(new Set(["arrowup", "arrowleft", "w"]))).toEqual(
            new Set(["up", "left"]),
        )
    })

    it("矢印キーがなければ空集合", () => {
        expect(armDirectionsFromKeys(new Set(["w", "a", "s", "d"]))).toEqual(new Set())
    })
})

describe("ARM_HOME", () => {
    it("肩/肘とも 90°", () => {
        expect(ARM_HOME).toEqual({ shoulder: 90, elbow: 90 })
    })
})
