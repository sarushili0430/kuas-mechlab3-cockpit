/** 計測値を指定の小数桁で文字列化する */
export function formatValue(value: number, precision: number): string {
    return value.toFixed(precision)
}

/** 経過時間 (ms) を "MM:SS" 形式に整形する。60分以上は分の桁が増える。 */
export function formatElapsedTime(elapsedMs: number): string {
    const totalSeconds = Math.floor(elapsedMs / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}
