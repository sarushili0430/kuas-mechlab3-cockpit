/** `{name}` プレースホルダを params の値で差し替える純粋関数 */
const PLACEHOLDER = /\{(\w+)\}/g

/**
 * 翻訳テンプレート中の `{name}` を params の値に展開する。
 * 対応する値がない場合はプレースホルダをそのまま残す(取りこぼしを可視化する)。
 */
export function interpolate(template: string, params?: Record<string, string | number>): string {
    if (params === undefined) {
        return template
    }
    return template.replace(PLACEHOLDER, (match, name: string) => {
        const value = params[name]
        return value === undefined ? match : String(value)
    })
}
