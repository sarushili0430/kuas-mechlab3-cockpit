import { useCallback, useMemo, useState, type ReactNode } from "react"
import { I18nContext, type I18nContextValue } from "./context"
import { loadSavedLanguage, saveLanguage } from "./lib/languageStorage"
import { resolveInitialLanguage } from "./logic/resolveLanguage"
import { createTranslator, type Language } from "./translations"

interface LanguageProviderProps {
    readonly children: ReactNode
    /** 言語設定の永続化先。テストでは差し替える */
    readonly storage?: Storage
}

/**
 * 表示言語を保持・永続化し、翻訳関数を配下へ供給する Provider。
 * 言語は React の state(外部システムではない)なので useState で管理する。
 */
export function LanguageProvider({
    children,
    storage = window.localStorage,
}: LanguageProviderProps) {
    const [language, setLanguageState] = useState<Language>(() =>
        resolveInitialLanguage(loadSavedLanguage(storage)),
    )

    const setLanguage = useCallback(
        (next: Language): void => {
            setLanguageState(next)
            saveLanguage(storage, next)
        },
        [storage],
    )

    // 言語が変わったときだけ翻訳関数を作り直す(レンダー中の派生値)
    const value = useMemo<I18nContextValue>(
        () => ({ language, setLanguage, t: createTranslator(language) }),
        [language, setLanguage],
    )

    return <I18nContext value={value}>{children}</I18nContext>
}
