import { AlertTriangleIcon, CheckCircle2Icon, OctagonAlertIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ChannelStatus } from "../types"

interface StatusBadgeProps {
    readonly status: ChannelStatus
}

const STATUS_VIEW: Readonly<
    Record<ChannelStatus, { label: string; className: string; Icon: typeof CheckCircle2Icon }>
> = {
    normal: {
        label: "正常",
        className:
            "border-transparent bg-chart-3/15 text-chart-3 [a&]:hover:bg-chart-3/25 transition-colors",
        Icon: CheckCircle2Icon,
    },
    warning: {
        label: "警告",
        className:
            "border-transparent bg-warning/15 text-warning [a&]:hover:bg-warning/25 transition-colors",
        Icon: AlertTriangleIcon,
    },
    critical: {
        label: "危険",
        className:
            "border-transparent bg-destructive/15 text-destructive [a&]:hover:bg-destructive/25 transition-colors",
        Icon: OctagonAlertIcon,
    },
}

/** チャンネル状態を色とアイコンで示すバッジ(Presentational) */
export function StatusBadge({ status }: StatusBadgeProps) {
    const { label, className, Icon } = STATUS_VIEW[status]
    return (
        <Badge className={cn("gap-1 font-medium", className)}>
            <Icon aria-hidden className="size-3" />
            {label}
        </Badge>
    )
}
