import { cn } from "@/lib/utils"
import { useTranslation } from "@/i18n"
import { formatAxisValue } from "../logic/format"
import type { DriveAxes } from "../types"

interface AxesIndicatorProps {
    readonly axes: DriveAxes
}

interface AxisRowProps {
    readonly label: string
    readonly value: number
}

/** 中央ゼロの双方向バー + 符号付き数値で 1 軸を表示する */
function AxisRow({ label, value }: AxisRowProps) {
    const magnitudePercent = Math.min(1, Math.abs(value)) * 50

    return (
        <div className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-xs text-muted-foreground">{label}</span>
            <div className="relative h-1.5 min-w-24 flex-1 overflow-hidden rounded-full bg-muted">
                {/* 中央ゼロ位置のマーカー */}
                <span
                    aria-hidden
                    className="absolute left-1/2 h-full w-px -translate-x-1/2 bg-border"
                />
                <span
                    aria-hidden
                    data-testid={`axis-fill-${label}`}
                    className={cn(
                        "absolute h-full bg-chart-1 transition-all duration-150",
                        value >= 0 ? "left-1/2" : "right-1/2",
                    )}
                    style={{ width: `${String(magnitudePercent)}%` }}
                />
            </div>
            <span
                className={cn(
                    "w-14 shrink-0 text-right font-heading text-sm tabular-nums",
                    value === 0 ? "text-muted-foreground" : "text-chart-1",
                )}
            >
                {formatAxisValue(value)}
            </span>
        </div>
    )
}

/**
 * 送信中の正規化ドライブ軸 (vx / wz) の表示(Presentational)。
 * 正方向 = バー右側(vx: 前進 / wz: 左旋回, REP-103)。
 */
export function AxesIndicator({ axes }: AxesIndicatorProps) {
    const { t } = useTranslation()

    return (
        <div className="flex w-full flex-col gap-2">
            <AxisRow label={t("axes.vx")} value={axes.vx} />
            <AxisRow label={t("axes.wz")} value={axes.wz} />
        </div>
    )
}
