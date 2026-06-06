import { loadSavedHost, saveHost } from "./hostStorage"

function createMemoryStorage(): Storage {
    const data = new Map<string, string>()
    return {
        get length() {
            return data.size
        },
        clear: () => {
            data.clear()
        },
        getItem: (key) => data.get(key) ?? null,
        key: () => null,
        removeItem: (key) => {
            data.delete(key)
        },
        setItem: (key, value) => {
            data.set(key, value)
        },
    }
}

describe("hostStorage", () => {
    it("保存したホストを読み出せる", () => {
        const storage = createMemoryStorage()
        saveHost(storage, "192.168.1.42")
        expect(loadSavedHost(storage)).toBe("192.168.1.42")
    })

    it("未保存なら null を返す", () => {
        expect(loadSavedHost(createMemoryStorage())).toBeNull()
    })

    it("ストレージが例外を投げても落ちない(プライベートモード等)", () => {
        const broken: Storage = {
            length: 0,
            clear: () => undefined,
            key: () => null,
            removeItem: () => undefined,
            getItem: () => {
                throw new Error("denied")
            },
            setItem: () => {
                throw new Error("denied")
            },
        }
        expect(loadSavedHost(broken)).toBeNull()
        expect(() => {
            saveHost(broken, "192.168.1.42")
        }).not.toThrow()
    })
})
