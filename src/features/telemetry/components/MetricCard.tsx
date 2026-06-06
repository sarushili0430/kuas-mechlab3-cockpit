import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatValue } from "../logic/format"
import type { ChannelReading } from "../types"
import { StatusBadge } from "./StatusBadge"

interface MetricCardProps {
    readonly reading: ChannelReading
}

const PLACEHOLDER = "--"

/** 1チャンネル分の計測値カード(Presentational) */
export function MetricCard({ reading }: MetricCardProps) {
    const { config, stats, status } = reading

    return (
        <Card
            data-status={status}
            className={cn(
                "gap-3 transition-colors duration-200",
                status === "warning" && "border-warning/50",
                status === "critical" && "border-destructive/60 bg-destructive/5",
            )}
        >
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {config.label}
                </CardTitle>
                <StatusBadge status={status} />
            </CardHeader>
            <CardContent>
                <p className="flex items-baseline gap-1.5">
                    <span
                        className={cn(
                            "font-mono text-3xl font-semibold tabular-nums tracking-tight",
                            status === "critical" && "text-destructive",
                            status === "warning" && "text-warning",
                        )}
                    >
                        {stats === null ? PLACEHOLDER : formatValue(stats.latest, config.precision)}
                    </span>
                    <span className="text-sm text-muted-foreground">{config.unit}</span>
                </p>
                <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3 font-mono text-xs tabular-nums">
                    <div>
                        <dt className="text-muted-foreground">最小</dt>
                        <dd>
                            {stats === null
                                ? PLACEHOLDER
                                : formatValue(stats.min, config.precision)}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">平均</dt>
                        <dd>
                            {stats === null
                                ? PLACEHOLDER
                                : formatValue(stats.mean, config.precision)}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">最大</dt>
                        <dd>
                            {stats === null
                                ? PLACEHOLDER
                                : formatValue(stats.max, config.precision)}
                        </dd>
                    </div>
                </dl>
            </CardContent>
        </Card>
    )
}
