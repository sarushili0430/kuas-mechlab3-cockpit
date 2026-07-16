import { createKeyboardInput } from "./keyboardInput"

function pressKey(target: EventTarget, key: string): void {
    target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }))
}

function releaseKey(target: EventTarget, key: string): void {
    target.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true }))
}

describe("createKeyboardInput", () => {
    it("初期状態では押下キーは空", () => {
        const input = createKeyboardInput(window)
        expect(input.getKeys()).toEqual(new Set())
    })

    it("購読中は keydown / keyup で押下集合が更新され、変化が通知される", () => {
        const input = createKeyboardInput(window)
        const listener = vi.fn()
        const unsubscribe = input.subscribe(listener)

        pressKey(window, "w")
        expect(input.getKeys()).toEqual(new Set(["w"]))
        expect(listener).toHaveBeenCalledTimes(1)

        releaseKey(window, "w")
        expect(input.getKeys()).toEqual(new Set())
        expect(listener).toHaveBeenCalledTimes(2)

        unsubscribe()
    })

    it("大文字キー(Shift 併用)も小文字に正規化する", () => {
        const input = createKeyboardInput(window)
        const unsubscribe = input.subscribe(vi.fn())

        pressKey(window, "W")
        expect(input.getKeys()).toEqual(new Set(["w"]))

        unsubscribe()
    })

    it("キーリピートで重複通知しない", () => {
        const input = createKeyboardInput(window)
        const listener = vi.fn()
        const unsubscribe = input.subscribe(listener)

        pressKey(window, "w")
        pressKey(window, "w")
        expect(listener).toHaveBeenCalledTimes(1)

        unsubscribe()
    })

    it("blur で押下集合をすべてクリアする(非アクティブ時の暴走防止)", () => {
        const input = createKeyboardInput(window)
        const listener = vi.fn()
        const unsubscribe = input.subscribe(listener)

        pressKey(window, "w")
        pressKey(window, "a")
        window.dispatchEvent(new Event("blur"))
        expect(input.getKeys()).toEqual(new Set())

        unsubscribe()
    })

    it("テキスト入力中のキーは操縦に拾わない(ホスト設定入力との干渉防止)", () => {
        const field = document.createElement("input")
        document.body.appendChild(field)
        const input = createKeyboardInput(window)
        const unsubscribe = input.subscribe(vi.fn())

        pressKey(field, "w")
        expect(input.getKeys()).toEqual(new Set())

        unsubscribe()
        field.remove()
    })

    it("preventDefaultKeys のキーは既定動作(スクロール等)を抑止する", () => {
        const input = createKeyboardInput(window, ["arrowdown"])
        const unsubscribe = input.subscribe(vi.fn())

        const event = new KeyboardEvent("keydown", { key: "ArrowDown", cancelable: true })
        window.dispatchEvent(event)

        expect(event.defaultPrevented).toBe(true)
        // 抑止しても押下集合には反映される
        expect(input.getKeys()).toEqual(new Set(["arrowdown"]))

        unsubscribe()
    })

    it("preventDefaultKeys 対象外のキーは既定動作を抑止しない", () => {
        const input = createKeyboardInput(window, ["arrowdown"])
        const unsubscribe = input.subscribe(vi.fn())

        const event = new KeyboardEvent("keydown", { key: "w", cancelable: true })
        window.dispatchEvent(event)

        expect(event.defaultPrevented).toBe(false)

        unsubscribe()
    })

    it("最後の購読解除で DOM リスナーを外す(以後のキー入力を追跡しない)", () => {
        const input = createKeyboardInput(window)
        const unsubscribe = input.subscribe(vi.fn())
        unsubscribe()

        pressKey(window, "w")
        expect(input.getKeys()).toEqual(new Set())
    })
})
