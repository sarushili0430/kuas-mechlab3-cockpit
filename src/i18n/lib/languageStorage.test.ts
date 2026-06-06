import { loadSavedLanguage, saveLanguage } from "./languageStorage"

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

describe("languageStorage", () => {
    it("保存した言語を読み出せる", () => {
        const storage = createMemoryStorage()
        saveLanguage(storage, "en")
        expect(loadSavedLanguage(storage)).toBe("en")
    })

    it("未保存なら null を返す", () => {
        expect(loadSavedLanguage(createMemoryStorage())).toBeNull()
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
        expect(loadSavedLanguage(broken)).toBeNull()
        expect(() => {
            saveLanguage(broken, "en")
        }).not.toThrow()
    })
})
