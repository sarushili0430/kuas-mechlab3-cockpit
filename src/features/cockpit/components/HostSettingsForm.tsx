import { useState, type ComponentProps } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from "@/i18n"
import { sanitizeHost } from "../logic/hostConfig"

interface HostSettingsFormProps {
    readonly host: string
    readonly onHostChange: (host: string) => void
}

/**
 * 接続先ホスト(Raspberry Pi)のコンパクトな設定フォーム。
 * 1フィールドの単純なフォームなので draft 状態はコンポーネント内で持つ。
 */
export function HostSettingsForm({ host, onHostChange }: HostSettingsFormProps) {
    const { t } = useTranslation()
    const [draft, setDraft] = useState(host)
    const [showError, setShowError] = useState(false)

    const handleSubmit: ComponentProps<"form">["onSubmit"] = (event) => {
        event.preventDefault()
        const sanitized = sanitizeHost(draft)
        if (sanitized === null) {
            setShowError(true)
            return
        }
        setShowError(false)
        // 正規化結果(スキーム除去など)を入力欄にも反映する
        setDraft(sanitized)
        onHostChange(sanitized)
    }

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Label
                htmlFor="cockpit-host"
                className="font-heading text-xs tracking-widest text-muted-foreground"
            >
                {t("host.label")}
            </Label>
            <div className="flex flex-col gap-1">
                <Input
                    id="cockpit-host"
                    name="host"
                    value={draft}
                    onChange={(event) => {
                        setDraft(event.target.value)
                    }}
                    aria-invalid={showError}
                    aria-describedby={showError ? "cockpit-host-error" : undefined}
                    autoComplete="off"
                    spellCheck={false}
                    className="h-8 w-40 font-heading text-sm"
                />
                {showError && (
                    <p id="cockpit-host-error" className="text-xs text-destructive">
                        {t("host.invalid")}
                    </p>
                )}
            </div>
            <Button type="submit" variant="outline" size="sm">
                {t("host.apply")}
            </Button>
        </form>
    )
}
