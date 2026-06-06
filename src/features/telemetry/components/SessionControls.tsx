import { PlayIcon, RotateCcwIcon, SquareIcon, TimerIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatElapsedTime } from "../logic/format"

interface SessionControlsProps {
    readonly isRunning: boolean
    readonly elapsedMs: number
    readonly onStart: () => void
    readonly onStop: () => void
    readonly onReset: () => void
}

/** 計測セッションの開始・停止・リセット操作(Presentational) */
export function SessionControls({
    isRunning,
    elapsedMs,
    onStart,
    onStop,
    onReset,
}: SessionControlsProps) {
    return (
        <div className="flex items-center gap-3">
            <p className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5">
                <TimerIcon aria-hidden className="size-4 text-muted-foreground" />
                <span className="font-mono text-sm font-medium tabular-nums">
                    {formatElapsedTime(elapsedMs)}
                </span>
            </p>
            {isRunning ? (
                <Button variant="destructive" onClick={onStop}>
                    <SquareIcon aria-hidden />
                    停止
                </Button>
            ) : (
                <Button onClick={onStart}>
                    <PlayIcon aria-hidden />
                    計測開始
                </Button>
            )}
            <Button variant="outline" disabled={isRunning} onClick={onReset}>
                <RotateCcwIcon aria-hidden />
                リセット
            </Button>
        </div>
    )
}
