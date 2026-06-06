import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
    type ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { toChartPoints } from "../logic/readings"
import type { ChannelConfig, TelemetrySample } from "../types"

interface TelemetryChartProps {
    readonly history: readonly TelemetrySample[]
    readonly config: ChannelConfig
}

/** 1チャンネルのトレンドを描画するエリアチャート(Presentational) */
export function TelemetryChart({ history, config }: TelemetryChartProps) {
    const points = toChartPoints(history, config.id)

    const chartConfig = {
        value: {
            label: `${config.label} (${config.unit})`,
            color: "var(--chart-1)",
        },
    } satisfies ChartConfig

    return (
        <div className="flex h-full flex-col gap-2">
            <h3 className="text-sm font-medium text-muted-foreground">
                {config.label}トレンド ({config.unit})
            </h3>
            {points.length === 0 ? (
                <div className="flex min-h-48 flex-1 items-center justify-center rounded-md border border-dashed border-border">
                    <p className="text-sm text-muted-foreground">
                        計測を開始するとトレンドが表示されます
                    </p>
                </div>
            ) : (
                <ChartContainer config={chartConfig} className="min-h-48 w-full flex-1">
                    <AreaChart data={[...points]} margin={{ left: 0, right: 8, top: 8 }}>
                        <defs>
                            <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-value)"
                                    stopOpacity={0.45}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-value)"
                                    stopOpacity={0.05}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeOpacity={0.4} />
                        <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis
                            width={48}
                            tickLine={false}
                            axisLine={false}
                            domain={["auto", "auto"]}
                            tickFormatter={(value: number) => value.toFixed(config.precision)}
                        />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                        <Area
                            dataKey="value"
                            type="monotone"
                            fill="url(#fillValue)"
                            stroke="var(--color-value)"
                            strokeWidth={2}
                            isAnimationActive={false}
                        />
                    </AreaChart>
                </ChartContainer>
            )}
        </div>
    )
}
