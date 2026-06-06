import { createContext } from "react"
import { createTranslator, DEFAULT_LANGUAGE, type Language, type TranslateFn } from "./translations"

export interface I18nContextValue {
    readonly language: Language
    readonly setLanguage: (language: Language) => void
    readonly t: TranslateFn
}

/**
 * 言語コンテキスト。Provider 外(単体テストや Storybook)でも
 * 既定言語で動くよう、既定値に翻訳関数を備える。
 */
export const I18nContext = createContext<I18nContextValue>({
    language: DEFAULT_LANGUAGE,
    setLanguage: () => undefined,
    t: createTranslator(DEFAULT_LANGUAGE),
})
