/**
 * 軸値を符号付き小数2桁 (+0.50 / -1.00) に整形する。
 * 常に符号を出すことで tabular-nums 表示時の桁ブレを防ぐ。
 */
export function formatAxisValue(value: number): string {
    // -0 を +0.00 に正規化する
    const normalized = value === 0 ? 0 : value
    const sign = normalized < 0 ? "-" : "+"
    return `${sign}${Math.abs(normalized).toFixed(2)}`
}
