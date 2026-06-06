const STORAGE_KEY = "ml3-cockpit.host"

/**
 * 保存済みの接続先ホストを読み出す。
 * ストレージが使えない環境(プライベートモード等)では null を返す。
 */
export function loadSavedHost(storage: Storage): string | null {
    try {
        return storage.getItem(STORAGE_KEY)
    } catch {
        return null
    }
}

/** 接続先ホストを保存する。失敗しても操縦は継続できるため握りつぶす */
export function saveHost(storage: Storage, host: string): void {
    try {
        storage.setItem(STORAGE_KEY, host)
    } catch {
        // 保存できなくても次回入力し直せばよい
    }
}
