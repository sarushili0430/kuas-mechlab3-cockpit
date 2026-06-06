import { useState } from "react"
import { GaugeIcon, OctagonAlertIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { worstStatus } from "../logic/readings"
import type { ChannelId, ChannelReading, TelemetrySample } from "../types"
import { MetricCard } from "./MetricCard"
import { SessionControls } from "./SessionControls"
import { StatusBadge } from "./StatusBadge"
import { TelemetryChart } from "./TelemetryChart"

interface CockpitDashboardProps {
    readonly isRunning: boolean
    readonly elapsedMs: number
    readonly readings: readonly ChannelReading[]
    readonly history: readonly TelemetrySample[]
    readonly onStart: () => void
    readonly onStop: () => void
    readonly onReset: () => void
}

/**
 * モーター実験テレメトリの cockpit 画面(Presentational)。
 * 状態と操作はすべて props で受け取り、自身は表示のみに責任を持つ。
 * (チャート表示チャンネルの切り替えはローカルなUI状態なので内部 useState でよい)
 */
export function CockpitDashboard({
    isRunning,
    elapsedMs,
    readings,
    history,
    onStart,
    onStop,
    onReset,
}: CockpitDashboardProps) {
    const [activeChannelId, setActiveChannelId] = useState<ChannelId>("rpm")

    const overallStatus = worstStatus(readings.map((reading) => reading.status))
    const criticalReadings = readings.filter((reading) => reading.status === "critical")
    const activeReading = readings.find((reading) => reading.config.id === activeChannelId)

    return (
        <div className="min-h-svh bg-background p-4 md:p-8">
            <div className="mx-auto flex max-w-6xl flex-col gap-6">
                <header className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-lg bg-primary/15">
                            <GaugeIcon aria-hidden className="size-5 text-primary" />
                        </span>
                        <div>
                            <h1 className="font-heading text-xl font-semibold tracking-tight">
                                KUAS MechLab3 Cockpit
                            </h1>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                モーター特性計測実験
                                <StatusBadge status={overallStatus} />
                            </p>
                        </div>
                    </div>
                    <SessionControls
                        isRunning={isRunning}
                        elapsedMs={elapsedMs}
                        onStart={onStart}
                        onStop={onStop}
                        onReset={onReset}
                    />
                </header>

                {criticalReadings.length > 0 && (
                    <Alert variant="destructive">
                        <OctagonAlertIcon aria-hidden className="size-4" />
                        <AlertTitle>危険域のチャンネルがあります</AlertTitle>
                        <AlertDescription>
                            {criticalReadings.map((reading) => reading.config.label).join("・")}{" "}
                            がしきい値を超えています。装置を確認してください。
                        </AlertDescription>
                    </Alert>
                )}

                <section
                    aria-label="計測値"
                    className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
                >
                    {readings.map((reading) => (
                        <MetricCard key={reading.config.id} reading={reading} />
                    ))}
                </section>

                <Separator />

                <section
                    aria-label="トレンド"
                    className="rounded-xl border border-border bg-card p-4 md:p-6"
                >
                    <Tabs
                        value={activeChannelId}
                        onValueChange={(value) => {
                            setActiveChannelId(value as ChannelId)
                        }}
                    >
                        <TabsList className="mb-4">
                            {readings.map((reading) => (
                                <TabsTrigger key={reading.config.id} value={reading.config.id}>
                                    {reading.config.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                    {activeReading !== undefined && (
                        <TelemetryChart history={history} config={activeReading.config} />
                    )}
                </section>
            </div>
        </div>
    )
}
