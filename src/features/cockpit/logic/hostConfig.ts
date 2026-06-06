/** 接続先ホストの既定値 (kuas-mechlab3 docs/cockpit.html と同じ) */
export const DEFAULT_HOST = "192.168.1.42"

/** ローカル開発サーバのホスト名(機体の接続先としては採用しない) */
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"])

/**
 * ユーザー入力をホスト名へ正規化する。
 * URL を貼り付けられてもホスト部を取り出せるようスキームと末尾スラッシュを剥がす。
 * 無効な入力(空・空白含み)は null。
 */
export function sanitizeHost(raw: string): string | null {
    const host = raw
        .trim()
        .replace(/^[a-z][a-z0-9+.-]*:\/\//i, "")
        .replace(/\/+$/, "")
    if (host === "" || /\s/.test(host)) {
        return null
    }
    return host
}

/**
 * 初期表示で使う接続先ホストを決める。
 * 優先順: 保存済み設定 → 配信元ホスト名(Pi から配信されるケース)→ 既定値。
 * ローカル開発サーバ (localhost) は機体ではないため既定値へ落とす。
 */
export function resolveInitialHost(saved: string | null, locationHostname: string): string {
    if (saved !== null) {
        return saved
    }
    if (locationHostname !== "" && !LOCAL_HOSTNAMES.has(locationHostname)) {
        return locationHostname
    }
    return DEFAULT_HOST
}
