import { LanguagesIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { LANGUAGES, type Language } from "../translations"
import { useTranslation } from "../useTranslation"

/** 言語名は各言語の自称で表示するのが慣例なので固定マップで持つ */
const LANGUAGE_NAMES: Record<Language, string> = {
    ja: "日本語",
    en: "English",
}

/**
 * 表示言語の切替トグル(日本語 / English)。
 * 色だけでなく aria-pressed で選択状態を伝える。
 */
export function LanguageSwitcher() {
    const { language, setLanguage, t } = useTranslation()

    return (
        <div
            role="group"
            aria-label={t("language.label")}
            className="inline-flex items-center gap-0.5 rounded-full border border-border bg-card p-0.5"
        >
            <LanguagesIcon aria-hidden className="mx-1 size-3.5 text-muted-foreground" />
            {LANGUAGES.map((lang) => (
                <button
                    key={lang}
                    type="button"
                    aria-pressed={language === lang}
                    data-active={language === lang}
                    onClick={() => {
                        setLanguage(lang)
                    }}
                    className={cn(
                        "rounded-full px-2 py-0.5 font-heading text-xs tracking-wide transition-colors",
                        language === lang
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground",
                    )}
                >
                    {LANGUAGE_NAMES[lang]}
                </button>
            ))}
        </div>
    )
}
