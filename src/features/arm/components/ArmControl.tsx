import { ChevronDownIcon, ChevronUpIcon, HouseIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/i18n"
import { displayAngle } from "../logic/arm"
import type { ArmAngles, ArmDirection, ArmJoint } from "../types"
import { ArmKeypad } from "./ArmKeypad"

interface ArmControlProps {
    /** 目標角 (表示用) */
    readonly angles: ArmAngles
    /** ジョグ中の方向 (パッド点灯用) */
    readonly directions: ReadonlySet<ArmDirection>
    /** ▼▲ ボタン: 関節を 1 段 (+1 / -1) 動かす */
    readonly onStep: (joint: ArmJoint, direction: 1 | -1) => void
    /** ホームへ戻す */
    readonly onHome: () => void
    /** パッドの押下開始 (タッチジョグ) */
    readonly onPress?: ((direction: ArmDirection) => void) | undefined
    /** パッドの押下解放 (タッチジョグ) */
    readonly onRelease?: ((direction: ArmDirection) => void) | undefined
}

interface JointStepperProps {
    readonly joint: ArmJoint
    readonly label: string
    readonly value: number
    readonly onStep: (joint: ArmJoint, direction: 1 | -1) => void
}

/** 1 関節ぶんの ▼ [角度] ▲ ステッパー (docs/cockpit.html の肩/肘カード) */
function JointStepper({ joint, label, value, onStep }: JointStepperProps) {
    const { t } = useTranslation()

    return (
        <div className="flex items-center gap-1.5">
            <span className="w-16 shrink-0 text-xs text-muted-foreground">{label}</span>
            <Button
                type="button"
                size="icon-sm"
                variant="outline"
                aria-label={t("arm.decrease", { joint: label })}
                onClick={() => {
                    onStep(joint, -1)
                }}
            >
                <ChevronDownIcon aria-hidden />
            </Button>
            <span className="w-12 text-center font-heading text-sm tabular-nums">
                {`${String(displayAngle(value))}°`}
            </span>
            <Button
                type="button"
                size="icon-sm"
                variant="outline"
                aria-label={t("arm.increase", { joint: label })}
                onClick={() => {
                    onStep(joint, 1)
                }}
            >
                <ChevronUpIcon aria-hidden />
            </Button>
        </div>
    )
}

/**
 * アーム操作パネル (Presentational)。矢印パッド + 肩/肘ステッパー + ホームで
 * 2-DoF アームを上下させる (docs/cockpit.html の ARM / ARM KEYS カードを統合)。
 */
export function ArmControl({
    angles,
    directions,
    onStep,
    onHome,
    onPress,
    onRelease,
}: ArmControlProps) {
    const { t } = useTranslation()

    return (
        <div
            aria-label={t("arm.title")}
            className="flex flex-col gap-3 rounded-lg border border-border bg-card/60 p-3"
        >
            <span className="font-heading text-xs tracking-[0.2em] text-primary uppercase">
                {t("arm.title")}
            </span>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap">
                <div className="flex justify-center">
                    <ArmKeypad directions={directions} onPress={onPress} onRelease={onRelease} />
                </div>
                <div className="flex flex-col gap-2">
                    <JointStepper
                        joint="shoulder"
                        label={t("arm.shoulder")}
                        value={angles.shoulder}
                        onStep={onStep}
                    />
                    <JointStepper
                        joint="elbow"
                        label={t("arm.elbow")}
                        value={angles.elbow}
                        onStep={onStep}
                    />
                </div>
                <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={onHome}
                    className="sm:ml-auto"
                >
                    <HouseIcon aria-hidden data-icon="inline-start" />
                    {t("arm.home")}
                </Button>
            </div>
        </div>
    )
}
