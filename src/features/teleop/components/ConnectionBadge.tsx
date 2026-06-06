import { cn } from "@/lib/utils"
import type { TeleopStatus } from "../types"

interface ConnectionBadgeProps {
    readonly status: TeleopStatus
}

const STATUS_LABELS: Record<TeleopStatus, string> = {
    idle: "未接続",
    connecting: "接続中…",
    open: "接続済",
    reconnecting: "再接続中…",
}

/**
 * teleop WebSocket の接続状態バッジ(Presentational)。
 * 色だけに依存せずラベルを併記する(MASTER.md Status Indicator)。
 */
export function ConnectionBadge({ status }: ConnectionBadgeProps) {
    return (
        <span
            role="status"
            data-status={status}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium"
        >
            <span
                aria-hidden
                className={cn(
                    "size-2 rounded-full transition-colors duration-200",
                    status === "idle" && "bg-muted-foreground",
                    status === "connecting" && "animate-pulse bg-warning",
                    status === "open" && "bg-success shadow-glow-success",
                    status === "reconnecting" && "animate-pulse bg-destructive",
                )}
            />
            <span
                className={cn(
                    status === "idle" && "text-muted-foreground",
                    status === "connecting" && "text-warning",
                    status === "open" && "text-success",
                    status === "reconnecting" && "text-destructive",
                )}
            >
                WS {STATUS_LABELS[status]}
            </span>
        </span>
    )
}
