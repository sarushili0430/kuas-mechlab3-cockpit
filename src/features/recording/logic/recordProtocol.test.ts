import { parseRecordResponse, startBody, stopBody } from "./recordProtocol"

describe("parseRecordResponse", () => {
    it("status/start レスポンスを録画状態へ畳み込む", () => {
        const result = parseRecordResponse({
            recording: true,
            index: 3,
            episode: "20260703-120000_route-a_003",
            started_at: "2026-07-03T12:00:00",
        })
        expect(result).toEqual({
            ok: true,
            state: {
                recording: true,
                episode: "20260703-120000_route-a_003",
                index: 3,
            },
        })
    })

    it("stop レスポンスの saved をエピソード名として採用する", () => {
        const result = parseRecordResponse({
            recording: false,
            saved: "ep_001",
            index: 1,
            label: "success",
            duration_s: 34,
        })
        expect(result).toEqual({
            ok: true,
            state: { recording: false, episode: "ep_001", index: 1 },
        })
    })

    it("discard レスポンスを idle 状態として扱う", () => {
        const result = parseRecordResponse({
            recording: false,
            discarded: true,
            episode: "ep_002",
            index: 2,
        })
        expect(result).toEqual({
            ok: true,
            state: { recording: false, episode: "ep_002", index: 2 },
        })
    })

    it("error フィールドを持つレスポンスはエラーにする", () => {
        expect(parseRecordResponse({ recording: null, error: "already_recording" })).toEqual({
            ok: false,
            error: "already_recording",
        })
    })

    it("オブジェクトでない値は invalid_response にする", () => {
        expect(parseRecordResponse("nope")).toEqual({ ok: false, error: "invalid_response" })
        expect(parseRecordResponse(null)).toEqual({ ok: false, error: "invalid_response" })
    })
})

describe("startBody", () => {
    it("未指定フィールドは省く(サーバ既定を使う)", () => {
        expect(startBody()).toEqual({})
        expect(startBody({ route: "loop_1" })).toEqual({ route: "loop_1" })
        expect(startBody({ route: "r", operator: "koyu" })).toEqual({
            route: "r",
            operator: "koyu",
        })
    })
})

describe("stopBody", () => {
    it("label は必須、notes は空なら省く", () => {
        expect(stopBody("success")).toEqual({ label: "success" })
        expect(stopBody("failure", "  ")).toEqual({ label: "failure" })
        expect(stopBody("success", "  clear  ")).toEqual({
            label: "success",
            notes: "clear",
        })
    })
})
