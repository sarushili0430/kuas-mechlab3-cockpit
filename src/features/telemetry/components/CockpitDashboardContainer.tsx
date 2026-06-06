import { CHANNEL_CONFIGS } from "../constants"
import { useTelemetryMonitor, type UseTelemetryMonitor } from "../hooks/useTelemetryMonitor"
import { createSimulatedTelemetrySource, type TelemetrySource } from "../lib/telemetrySource"
import { buildReadings } from "../logic/readings"
import { CockpitDashboard } from "./CockpitDashboard"

// アプリ全体で共有するデフォルトのテレメトリソース(モジュールシングルトン)
const defaultSource = createSimulatedTelemetrySource()

interface CockpitDashboardContainerProps {
    /** テレメトリソース。テストやStorybookでは差し替える。 */
    readonly source?: TelemetrySource
    /** 計測状態フック。複雑なステートは外部から注入する(テスト容易性のため)。 */
    readonly useTelemetry?: UseTelemetryMonitor
}

/**
 * CockpitDashboard の Container。
 * フックから計測状態を取得し、純粋関数で表示データへ導出して Presentational へ渡す。
 */
export function CockpitDashboardContainer({
    source = defaultSource,
    useTelemetry = useTelemetryMonitor,
}: CockpitDashboardContainerProps) {
    const monitor = useTelemetry(source)

    // 派生データはレンダー中に純粋関数で計算する(useEffect は使わない)
    const readings = buildReadings(monitor.history, CHANNEL_CONFIGS)

    return (
        <CockpitDashboard
            isRunning={monitor.isRunning}
            elapsedMs={monitor.elapsedMs}
            readings={readings}
            history={monitor.history}
            onStart={monitor.start}
            onStop={monitor.stop}
            onReset={monitor.reset}
        />
    )
}
