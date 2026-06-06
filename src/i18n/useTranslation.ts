import { useContext } from "react"
import { I18nContext, type I18nContextValue } from "./context"

/** 現在の言語・言語切替・翻訳関数 `t` を取得するフック */
export function useTranslation(): I18nContextValue {
    return useContext(I18nContext)
}
