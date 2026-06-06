import { cn } from "@/lib/utils"
import type { DriveCommandKey } from "../logic/axes"

interface DriveKeypadProps {
    /** 点灯する方向。押下キーの生状態ではなく送信中の軸から導出した値を渡す */
    readonly directions: ReadonlySet<DriveCommandKey>
}

interface KeycapProps {
    readonly label: string
    readonly active: boolean
}

function Keycap({ label, active }: KeycapProps) {
    return (
        <span
            data-active={active}
            className={cn(
                "flex size-12 items-center justify-center rounded-lg border font-heading text-base font-semibold transition-all duration-150",
                active
                    ? "border-primary bg-primary text-primary-foreground shadow-glow-primary"
                    : "border-border bg-card text-muted-foreground",
            )}
        >
            {label}
        </span>
    )
}

/**
 * WASD 操縦キーの状態表示(Presentational)。
 * 「実際に機体へ送信している指令」を点灯で表す(cockpit.md Drive Keypad)。
 */
export function DriveKeypad({ directions }: DriveKeypadProps) {
    return (
        <div
            role="img"
            aria-label="操縦方向インジケータ"
            className="inline-grid grid-cols-3 gap-1.5"
        >
            <span />
            <Keycap label="W" active={directions.has("w")} />
            <span />
            <Keycap label="A" active={directions.has("a")} />
            <Keycap label="S" active={directions.has("s")} />
            <Keycap label="D" active={directions.has("d")} />
        </div>
    )
}
