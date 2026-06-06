import { JoystickIcon, OctagonXIcon, PlugZapIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CameraFeed } from "@/features/camera"
import {
    activeDirectionsFromAxes,
    AxesIndicator,
    ConnectionBadge,
    DriveKeypad,
    type DriveAxes,
    type TeleopStatus,
} from "@/features/teleop"
import { HostSettingsForm } from "./HostSettingsForm"

/** 画面に表示するカメラ1面分のデータ */
export interface CameraView {
    readonly id: string
    readonly label: string
    readonly src: string | null
}

interface CockpitScreenProps {
    readonly host: string
    readonly status: TeleopStatus
    readonly axes: DriveAxes
    readonly cameras: readonly CameraView[]
    readonly onHostChange: (host: string) => void
    readonly onConnect: () => void
    readonly onDisconnect: () => void
}

/**
 * ML3 遠隔操縦コックピット(Presentational)。
 * Mission Control Grid: ヘッダー / カメラ面 / 操縦コンソールの1画面常駐構成
 * (design-system/kuas-mechlab3-cockpit/pages/cockpit.md)。
 */
export function CockpitScreen({
    host,
    status,
    axes,
    cameras,
    onHostChange,
    onConnect,
    onDisconnect,
}: CockpitScreenProps) {
    // 表示はキーの生状態ではなく「実際に機体へ送信している指令」から導出する
    const directions = activeDirectionsFromAxes(axes)

    return (
        <div className="flex min-h-svh flex-col bg-background">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-6">
                <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15">
                        <JoystickIcon aria-hidden className="size-5 text-primary" />
                    </span>
                    <div>
                        <h1 className="font-heading text-lg font-semibold tracking-widest">
                            ML3 COCKPIT
                        </h1>
                        <p className="text-xs text-muted-foreground">KUAS MechLab3 遠隔操縦</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <ConnectionBadge status={status} />
                    <HostSettingsForm host={host} onHostChange={onHostChange} />
                </div>
            </header>

            <main
                aria-label="カメラ映像"
                className="grid flex-1 grid-cols-1 gap-4 p-4 md:grid-cols-2 md:px-6"
            >
                {cameras.map((camera) => (
                    <CameraFeed key={camera.id} label={camera.label} src={camera.src} />
                ))}
            </main>

            <section
                aria-label="操縦コンソール"
                className="border-t border-border bg-card/50 px-4 py-4 md:px-6"
            >
                <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-4">
                    <DriveKeypad directions={directions} />
                    <div className="min-w-56 flex-1">
                        <AxesIndicator axes={axes} />
                    </div>
                    {status === "idle" ? (
                        <Button
                            size="lg"
                            onClick={onConnect}
                            className="min-w-36 bg-cta font-semibold text-cta-foreground hover:bg-cta/90"
                        >
                            <PlugZapIcon aria-hidden data-icon="inline-start" />
                            接続
                        </Button>
                    ) : (
                        <Button
                            size="lg"
                            onClick={onDisconnect}
                            className="min-w-36 bg-destructive font-semibold text-destructive-foreground hover:bg-destructive/90"
                        >
                            <OctagonXIcon aria-hidden data-icon="inline-start" />
                            {status === "open" ? "緊急停止" : "接続中止"}
                        </Button>
                    )}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                    この画面にフォーカスして W / A / S / D で操縦できます
                    (キーを離すと停止・切断時も機体は自動停止します)
                </p>
            </section>
        </div>
    )
}
