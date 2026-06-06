import { DEFAULT_LANGUAGE, LANGUAGES, type Language } from "../translations"

/** 文字列が対応言語コードかを判定する型ガード */
export function isLanguage(value: string | null): value is Language {
    return value !== null && (LANGUAGES as readonly string[]).includes(value)
}

/**
 * 初期表示で使う言語を決める。
 * 保存済みの有効な設定があればそれを、なければ既定言語を採用する。
 */
export function resolveInitialLanguage(saved: string | null): Language {
    return isLanguage(saved) ? saved : DEFAULT_LANGUAGE
}
