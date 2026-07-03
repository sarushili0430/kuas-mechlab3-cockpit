import type { ReactNode } from "react"
import { JoystickIcon, OctagonXIcon, PlugZapIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CameraFeed } from "@/features/camera"
import {
    activeDirectionsFromAxes,
    AxesIndicator,
    ConnectionBadge,
    DriveKeypad,
    type DriveAxes,
    type DriveCommandKey,
    type TeleopStatus,
} from "@/features/teleop"
import { LanguageSwitcher, useTranslation } from "@/i18n"
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
    /** 方向ボタンを押し始めたとき(タッチ操縦) */
    readonly onDirectionPress?: (direction: DriveCommandKey) => void
    /** 方向ボタンを離したとき(タッチ操縦) */
    readonly onDirectionRelease?: (direction: DriveCommandKey) => void
    /** AI データ収集コントロール(録画の開始/停止)。Container が差し込む */
    readonly recordingSlot?: ReactNode
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
    onDirectionPress,
    onDirectionRelease,
    recordingSlot,
}: CockpitScreenProps) {
    const { t } = useTranslation()
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
                        <p className="text-xs text-muted-foreground">{t("header.subtitle")}</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <ConnectionBadge status={status} />
                    <HostSettingsForm host={host} onHostChange={onHostChange} />
                    <LanguageSwitcher />
                </div>
            </header>

            <main
                aria-label={t("header.cameras")}
                className="grid flex-1 grid-cols-1 gap-4 p-4 md:grid-cols-2 md:px-6"
            >
                {cameras.map((camera) => (
                    <CameraFeed key={camera.id} label={camera.label} src={camera.src} />
                ))}
            </main>

            <section
                aria-label={t("console.area")}
                className="border-t border-border bg-card/50 px-4 py-4 md:px-6"
            >
                <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-10">
                    <div className="flex justify-center sm:block">
                        <DriveKeypad
                            directions={directions}
                            onPress={onDirectionPress}
                            onRelease={onDirectionRelease}
                        />
                    </div>
                    <div className="sm:min-w-56 sm:flex-1">
                        <AxesIndicator axes={axes} />
                    </div>
                    {status === "idle" ? (
                        <Button
                            size="lg"
                            onClick={onConnect}
                            className="w-full bg-cta font-semibold text-cta-foreground hover:bg-cta/90 sm:w-auto sm:min-w-36"
                        >
                            <PlugZapIcon aria-hidden data-icon="inline-start" />
                            {t("console.connect")}
                        </Button>
                    ) : (
                        <Button
                            size="lg"
                            onClick={onDisconnect}
                            className="w-full bg-destructive font-semibold text-destructive-foreground hover:bg-destructive/90 sm:w-auto sm:min-w-36"
                        >
                            <OctagonXIcon aria-hidden data-icon="inline-start" />
                            {status === "open"
                                ? t("console.emergencyStop")
                                : t("console.cancelConnect")}
                        </Button>
                    )}
                </div>
                {recordingSlot !== undefined ? <div className="mt-4">{recordingSlot}</div> : null}
                <p className="mt-3 text-xs text-muted-foreground">{t("console.hint")}</p>
            </section>
        </div>
    )
}
