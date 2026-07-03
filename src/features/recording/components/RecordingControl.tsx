import { CircleDotIcon, SquareIcon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/i18n"
import { cn } from "@/lib/utils"
import type { EpisodeLabel, RecordStatus } from "../types"

interface RecordingControlProps {
    readonly status: RecordStatus
    readonly episode: string | null
    readonly error: string | null
    readonly label: EpisodeLabel
    readonly onLabelChange: (label: EpisodeLabel) => void
    readonly onStart: () => void
    readonly onStop: () => void
    readonly onDiscard: () => void
}

/**
 * AI データ収集 (エピソード録画) の開始/停止コントロール (Presentational)。
 * teleop とは独立したチャネル (record_server) を叩き、走行を 1 エピソードずつ
 * 記録する。色だけに頼らずラベルを併記する (MASTER.md Status Indicator)。
 */
export function RecordingControl({
    status,
    episode,
    error,
    label,
    onLabelChange,
    onStart,
    onStop,
    onDiscard,
}: RecordingControlProps) {
    const { t } = useTranslation()
    const recording = status === "recording"
    const busy = status === "starting" || status === "stopping"

    const stateText = recording
        ? t("recording.recording")
        : status === "starting"
          ? t("recording.starting")
          : status === "stopping"
            ? t("recording.stopping")
            : status === "error"
              ? t("recording.errorLabel")
              : t("recording.idle")

    // API が返すエラー種別を利用者向けメッセージへ翻訳する (生コードは出さない)
    const errorText =
        error === "unreachable"
            ? t("recording.errorUnreachable")
            : error === "already_recording"
              ? t("recording.errorAlready")
              : error === "not_recording"
                ? t("recording.errorNotRecording")
                : t("recording.error")

    return (
        <div
            data-status={status}
            className="flex flex-col gap-2 rounded-lg border border-border bg-card/60 p-3"
        >
            <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-xs font-medium">
                    <span
                        aria-hidden
                        className={cn(
                            "size-2 rounded-full transition-colors duration-200",
                            status === "idle" && "bg-muted-foreground",
                            busy && "animate-pulse bg-warning",
                            recording && "animate-pulse bg-destructive shadow-glow-destructive",
                            status === "error" && "bg-destructive",
                        )}
                    />
                    <span role="status">REC {stateText}</span>
                </span>
                {episode !== null ? (
                    <span className="truncate font-mono text-[0.7rem] text-muted-foreground">
                        {episode}
                    </span>
                ) : null}
            </div>

            {recording ? (
                <div className="flex flex-wrap items-center gap-2">
                    <div
                        role="group"
                        aria-label={t("recording.label")}
                        className="inline-flex items-center gap-1"
                    >
                        <Button
                            type="button"
                            size="sm"
                            variant={label === "success" ? "default" : "outline"}
                            aria-pressed={label === "success"}
                            onClick={() => {
                                onLabelChange("success")
                            }}
                        >
                            {t("recording.success")}
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant={label === "failure" ? "default" : "outline"}
                            aria-pressed={label === "failure"}
                            onClick={() => {
                                onLabelChange("failure")
                            }}
                        >
                            {t("recording.failure")}
                        </Button>
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        onClick={onStop}
                        className="bg-cta font-semibold text-cta-foreground hover:bg-cta/90"
                    >
                        <SquareIcon aria-hidden data-icon="inline-start" />
                        {t("recording.stopSave")}
                    </Button>
                    <Button type="button" size="sm" variant="destructive" onClick={onDiscard}>
                        <Trash2Icon aria-hidden data-icon="inline-start" />
                        {t("recording.discard")}
                    </Button>
                </div>
            ) : (
                <Button
                    type="button"
                    size="sm"
                    onClick={onStart}
                    disabled={busy}
                    className="w-full sm:w-auto"
                >
                    <CircleDotIcon aria-hidden data-icon="inline-start" />
                    {busy ? t("recording.starting") : t("recording.start")}
                </Button>
            )}

            {status === "error" ? <p className="text-xs text-destructive">{errorText}</p> : null}
        </div>
    )
}
