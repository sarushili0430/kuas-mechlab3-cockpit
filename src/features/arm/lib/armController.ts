import {
    ARM_BUTTON_STEP,
    ARM_EASE,
    ARM_EASE_SNAP,
    ARM_HOME,
    ARM_JOG_INTERVAL_MS,
    ARM_KEY_STEP,
    ARM_SEND_INTERVAL_MS,
} from "../constants"
import { anglesEqual, easeAngles, jogAngles, servoPayload, stepJointAngles } from "../logic/arm"
import type { ArmAngles, ArmDirection, ArmJoint, ArmSnapshot } from "../types"

/** イージング後のサーボ目標 [肩, 肘] を送る出力口 (teleop クライアントの sendServo を注入する) */
export type SendServo = (servo: readonly [number, number]) => void

export interface ArmControllerOptions {
    /** サーボ指令の送信先 (接続していないときは no-op でよい) */
    readonly sendServo: SendServo
    readonly jogIntervalMs?: number
    readonly sendIntervalMs?: number
    readonly ease?: number
    readonly easeSnap?: number
    readonly keyStep?: number
    readonly buttonStep?: number
}

/**
 * アーム操作の外部データソース。
 * useSyncExternalStore で購読できる subscribe / getSnapshot を提供する。
 *
 * 目標角 (angles) は操作で即時更新し、実際に送るサーボ値はイージングで目標へ
 * 近づける (docs/cockpit.html と同じ手触り)。走行と違いファームが最後の値を
 * 保持するため、収束後は送信しない (変化があったときだけ送る)。
 */
export interface ArmController {
    readonly subscribe: (listener: () => void) => () => void
    readonly getSnapshot: () => ArmSnapshot
    /** 連続ジョグ方向を差し替える (矢印キー ∪ 画面パッドの押下方向) */
    readonly setDirections: (directions: ReadonlySet<ArmDirection>) => void
    /** ▼▲ ボタン: 指定関節を 1 段 (direction: +1 / -1) 動かす */
    readonly stepJoint: (joint: ArmJoint, direction: number) => void
    /** ホーム姿勢 (90/90) へ戻す */
    readonly home: () => void
}

const INITIAL_STATE: ArmSnapshot = { angles: ARM_HOME, directions: new Set() }

/** 2 つのジョグ方向集合が等しいか */
function sameDirections(a: ReadonlySet<ArmDirection>, b: ReadonlySet<ArmDirection>): boolean {
    if (a.size !== b.size) {
        return false
    }
    for (const direction of a) {
        if (!b.has(direction)) {
            return false
        }
    }
    return true
}

/**
 * アームコントローラを生成する (kuas-mechlab3 docs/cockpit.html のアーム挙動に準拠)。
 *
 * - 押下中は約 20Hz で目標角をジョグし続ける
 * - 約 40Hz で送信値を目標へイージングし、変化があったぶんだけ sendServo する
 * - ループは最初の購読で起動し、最後の購読解除で停止する (keyboardInput と同じ作法)
 */
export function createArmController(options: ArmControllerOptions): ArmController {
    const {
        sendServo,
        jogIntervalMs = ARM_JOG_INTERVAL_MS,
        sendIntervalMs = ARM_SEND_INTERVAL_MS,
        ease = ARM_EASE,
        easeSnap = ARM_EASE_SNAP,
        keyStep = ARM_KEY_STEP,
        buttonStep = ARM_BUTTON_STEP,
    } = options

    let state = INITIAL_STATE
    // 実際に送っているサーボ位置 (イージング後)。表示には出さないので snapshot に載せない
    let sent: ArmAngles = ARM_HOME
    let jogTimerId: ReturnType<typeof setInterval> | null = null
    let sendTimerId: ReturnType<typeof setInterval> | null = null
    const listeners = new Set<() => void>()

    const notify = (): void => {
        for (const listener of listeners) {
            listener()
        }
    }

    const setAngles = (angles: ArmAngles): void => {
        state = { ...state, angles }
        notify()
    }

    // 押下中ジョグ: 目標角を 1 tick 進める (変化があったときだけ通知)
    const jogTick = (): void => {
        if (state.directions.size === 0) {
            return
        }
        const next = jogAngles(state.angles, state.directions, keyStep)
        if (!anglesEqual(next, state.angles)) {
            setAngles(next)
        }
    }

    // イージング送信: 送信値を目標へ近づけ、変化があれば送る
    const sendTick = (): void => {
        const { next, changed } = easeAngles(sent, state.angles, ease, easeSnap)
        if (changed) {
            sent = next
            sendServo(servoPayload(sent))
        }
    }

    const startLoops = (): void => {
        jogTimerId ??= setInterval(jogTick, jogIntervalMs)
        sendTimerId ??= setInterval(sendTick, sendIntervalMs)
    }

    const stopLoops = (): void => {
        if (jogTimerId !== null) {
            clearInterval(jogTimerId)
            jogTimerId = null
        }
        if (sendTimerId !== null) {
            clearInterval(sendTimerId)
            sendTimerId = null
        }
    }

    return {
        subscribe: (listener) => {
            if (listeners.size === 0) {
                startLoops()
            }
            listeners.add(listener)
            return () => {
                listeners.delete(listener)
                if (listeners.size === 0) {
                    stopLoops()
                }
            }
        },
        getSnapshot: () => state,
        setDirections: (directions) => {
            if (sameDirections(state.directions, directions)) {
                return
            }
            state = { ...state, directions: new Set(directions) }
            notify()
        },
        stepJoint: (joint, direction) => {
            setAngles(stepJointAngles(state.angles, joint, buttonStep * direction))
        },
        home: () => {
            if (anglesEqual(state.angles, ARM_HOME)) {
                return
            }
            setAngles(ARM_HOME)
        },
    }
}
