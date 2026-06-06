const STORAGE_KEY = "ml3-cockpit.language"

/**
 * 保存済みの表示言語を読み出す。
 * ストレージが使えない環境では null を返し、既定言語へフォールバックさせる。
 */
export function loadSavedLanguage(storage: Storage): string | null {
    try {
        return storage.getItem(STORAGE_KEY)
    } catch {
        return null
    }
}

/** 表示言語を保存する。失敗しても操作は継続できるため握りつぶす */
export function saveLanguage(storage: Storage, language: string): void {
    try {
        storage.setItem(STORAGE_KEY, language)
    } catch {
        // 保存できなくても次回選び直せばよい
    }
}
