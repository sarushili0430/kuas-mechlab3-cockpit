/**
 * ロボット操作アダプタ。cockpit 既存のクライアント (createTeleopClient /
 * createRecordClient) を Node からそのまま再利用し、ランナー向けの
 * connect / drive(bounded) / stop / record を提供する。
 */
import { SEND_INTERVAL_MS } from "../src/features/teleop/constants"
import { clampAxes, STOP_AXES } from "../src/features/teleop/logic/axes"
import type { TeleopClient } from "../src/features/teleop/lib/teleopClient"
import type { RecordClient } from "../src/features/recording/lib/recordClient"
import type { EpisodeLabel } from "../src/features/recording/types"

export interface RecordBinding {
    readonly client: RecordClient
    readonly baseUrl: string
}

export interface RobotOptions {
    readonly teleop: TeleopClient
    readonly teleopUrl: string
    readonly speedScale: number
    readonly maxDurationS: number
    readonly record?: RecordBinding
    readonly sendIntervalMs?: number
    readonly connectTimeoutMs?: number
    readonly sleep?: (ms: number) => Promise<void>
}

export interface Robot {
    readonly connect: () => Promise<void>
    readonly drive: (vx: number, wz: number, durationS: number) => Promise<void>
    readonly stop: () => void
    readonly disconnect: () => void
    readonly startRecording: (route: string, operator: string) => Promise<void>
    readonly stopRecording: (label: EpisodeLabel) => Promise<void>
}

const realSleep = (ms: number): Promise<void> =>
    new Promise((resolve) => {
        setTimeout(resolve, ms)
    })

export function createRobot(options: RobotOptions): Robot {
    const { teleop, teleopUrl, record } = options
    const scale = Math.min(1, Math.max(0, options.speedScale))
    const maxDurationS = Math.max(0, options.maxDurationS)
    const sendIntervalMs = options.sendIntervalMs ?? SEND_INTERVAL_MS
    const connectTimeoutMs = options.connectTimeoutMs ?? 5000
    const sleep = options.sleep ?? realSleep

    const connect = (): Promise<void> =>
        new Promise((resolve, reject) => {
            if (teleop.getSnapshot().status === "open") {
                resolve()
            } else {
                let unsubscribe: (() => void) | null = null
                const timer = setTimeout(() => {
                    unsubscribe?.()
                    reject(
                        new Error(
                            `teleop did not reach "open" within ${String(connectTimeoutMs)}ms`,
                        ),
                    )
                }, connectTimeoutMs)
                unsubscribe = teleop.subscribe(() => {
                    if (teleop.getSnapshot().status === "open") {
                        clearTimeout(timer)
                        unsubscribe?.()
                        resolve()
                    }
                })
                teleop.connect(teleopUrl)
            }
        })

    const drive = async (vx: number, wz: number, durationS: number): Promise<void> => {
        const axes = clampAxes({ vx: vx * scale, wz: wz * scale })
        const held = Math.max(0, Math.min(durationS, maxDurationS))
        teleop.setAxes(axes)
        await sleep(held * 1000)
        teleop.setAxes(STOP_AXES)
        await sleep(sendIntervalMs)
    }

    const startRecording = async (route: string, operator: string): Promise<void> => {
        if (record !== undefined) {
            await record.client.start(record.baseUrl, { route, operator })
        }
    }

    const stopRecording = async (label: EpisodeLabel): Promise<void> => {
        if (record !== undefined) {
            await record.client.stop(record.baseUrl, label)
        }
    }

    return {
        connect,
        drive,
        stop: () => {
            teleop.setAxes(STOP_AXES)
        },
        disconnect: () => {
            teleop.disconnect()
        },
        startRecording,
        stopRecording,
    }
}
