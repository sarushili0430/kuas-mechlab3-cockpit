import { ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon, ArrowUpIcon } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useRef, type PointerEvent } from "react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/i18n"
import type { DriveCommandKey } from "../logic/axes"

interface DriveKeypadProps {
    /** 点灯する方向。押下キーの生状態ではなく送信中の軸から導出した値を渡す */
    readonly directions: ReadonlySet<DriveCommandKey>
    /** 方向ボタンを押し始めたとき(指 / マウス / ペン)。省略時は表示専用 */
    readonly onPress?: ((direction: DriveCommandKey) => void) | undefined
    /** 方向ボタンを離した・押下が外れたとき。省略時は表示専用 */
    readonly onRelease?: ((direction: DriveCommandKey) => void) | undefined
}

interface KeyButtonProps {
    readonly direction: DriveCommandKey
    readonly icon: LucideIcon
    readonly label: string
    readonly active: boolean
    readonly onPress?: ((direction: DriveCommandKey) => void) | undefined
    readonly onRelease?: ((direction: DriveCommandKey) => void) | undefined
}

function KeyButton({ direction, icon: Icon, label, active, onPress, onRelease }: KeyButtonProps) {
    // 押し続けている間だけ操縦する。タッチは pointerdown 時に暗黙のポインタ
    // キャプチャが効くので、指を離した pointerup が必ず同じ要素へ届き
    // 「押しっぱなしで止まらない」事故を防げる。
    const pressedRef = useRef(false)

    const handlePointerDown = (event: PointerEvent<HTMLButtonElement>): void => {
        // 左ボタン / タッチ / ペン接触 (button === 0) のみ操縦に使う
        if (event.button !== 0) {
            return
        }
        pressedRef.current = true
        onPress?.(direction)
    }

    // 解放は押下していたときだけ通知する(ホバーで素通りしたときは何もしない)
    const handleRelease = (): void => {
        if (!pressedRef.current) {
            return
        }
        pressedRef.current = false
        onRelease?.(direction)
    }

    return (
        <button
            type="button"
            aria-label={label}
            aria-pressed={active}
            data-active={active}
            onPointerDown={handlePointerDown}
            onPointerUp={handleRelease}
            onPointerCancel={handleRelease}
            // マウスで押したまま外へ出たら停止する(タッチはキャプチャ中で発火しない)
            onPointerLeave={handleRelease}
            // 長押しのコンテキストメニュー/コールアウトを抑止する
            onContextMenu={(event) => {
                event.preventDefault()
            }}
            className={cn(
                "flex size-14 touch-none items-center justify-center rounded-lg border transition-all duration-150 select-none active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                active
                    ? "border-primary bg-primary text-primary-foreground shadow-glow-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
        >
            <Icon aria-hidden className="size-6" />
        </button>
    )
}

/**
 * WASD 操縦パッド。送信中の軸から導出した方向を点灯しつつ、
 * 方向ボタンの押下/解放で機体を操縦できる(スマホからのタッチ操作対応)。
 * 点灯は「実際に機体へ送信している指令」を表す(cockpit.md Drive Keypad)。
 * インバート T 字配置: 上段中央 W / 下段 A・S・D。
 */
export function DriveKeypad({ directions, onPress, onRelease }: DriveKeypadProps) {
    const { t } = useTranslation()

    return (
        <div
            role="group"
            aria-label={t("keypad.label")}
            className="inline-grid grid-cols-3 gap-1.5"
        >
            <span />
            <KeyButton
                direction="w"
                icon={ArrowUpIcon}
                label={t("keypad.forward")}
                active={directions.has("w")}
                onPress={onPress}
                onRelease={onRelease}
            />
            <span />
            <KeyButton
                direction="a"
                icon={ArrowLeftIcon}
                label={t("keypad.left")}
                active={directions.has("a")}
                onPress={onPress}
                onRelease={onRelease}
            />
            <KeyButton
                direction="s"
                icon={ArrowDownIcon}
                label={t("keypad.backward")}
                active={directions.has("s")}
                onPress={onPress}
                onRelease={onRelease}
            />
            <KeyButton
                direction="d"
                icon={ArrowRightIcon}
                label={t("keypad.right")}
                active={directions.has("d")}
                onPress={onPress}
                onRelease={onRelease}
            />
        </div>
    )
}
