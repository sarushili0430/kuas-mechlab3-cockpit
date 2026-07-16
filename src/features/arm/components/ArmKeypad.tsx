import { ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon, ArrowUpIcon } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useRef, type PointerEvent } from "react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/i18n"
import type { ArmDirection } from "../types"

interface ArmKeypadProps {
    /** 点灯するジョグ方向 (矢印キー ∪ 画面パッドの押下方向) */
    readonly directions: ReadonlySet<ArmDirection>
    /** 方向ボタンを押し始めたとき(指 / マウス / ペン)。省略時は表示専用 */
    readonly onPress?: ((direction: ArmDirection) => void) | undefined
    /** 方向ボタンを離した・押下が外れたとき。省略時は表示専用 */
    readonly onRelease?: ((direction: ArmDirection) => void) | undefined
}

interface KeyButtonProps {
    readonly direction: ArmDirection
    readonly icon: LucideIcon
    readonly label: string
    readonly active: boolean
    readonly onPress?: ((direction: ArmDirection) => void) | undefined
    readonly onRelease?: ((direction: ArmDirection) => void) | undefined
}

function KeyButton({ direction, icon: Icon, label, active, onPress, onRelease }: KeyButtonProps) {
    // 押し続けている間だけジョグする。タッチは pointerdown 時に暗黙のポインタ
    // キャプチャが効くので、指を離した pointerup が必ず同じ要素へ届き
    // 「押しっぱなしで止まらない」事故を防げる (DriveKeypad と同じ作法)。
    const pressedRef = useRef(false)

    const handlePointerDown = (event: PointerEvent<HTMLButtonElement>): void => {
        if (event.button !== 0) {
            return
        }
        pressedRef.current = true
        onPress?.(direction)
    }

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
            onPointerLeave={handleRelease}
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
 * アーム操作パッド (矢印)。DriveKeypad と同じインバート T 字配置で、
 * ↑↓ = 肘・←→ = 肩 を押下中ジョグする(スマホのタッチ操作対応)。
 * 点灯は現在ジョグ中の方向を表す(docs/cockpit.html の ARM KEYS の視覚ミラー)。
 */
export function ArmKeypad({ directions, onPress, onRelease }: ArmKeypadProps) {
    const { t } = useTranslation()

    return (
        <div role="group" aria-label={t("arm.pad")} className="inline-grid grid-cols-3 gap-1.5">
            <span />
            <KeyButton
                direction="up"
                icon={ArrowUpIcon}
                label={t("arm.elbowUp")}
                active={directions.has("up")}
                onPress={onPress}
                onRelease={onRelease}
            />
            <span />
            <KeyButton
                direction="left"
                icon={ArrowLeftIcon}
                label={t("arm.shoulderUp")}
                active={directions.has("left")}
                onPress={onPress}
                onRelease={onRelease}
            />
            <KeyButton
                direction="down"
                icon={ArrowDownIcon}
                label={t("arm.elbowDown")}
                active={directions.has("down")}
                onPress={onPress}
                onRelease={onRelease}
            />
            <KeyButton
                direction="right"
                icon={ArrowRightIcon}
                label={t("arm.shoulderDown")}
                active={directions.has("right")}
                onPress={onPress}
                onRelease={onRelease}
            />
        </div>
    )
}
