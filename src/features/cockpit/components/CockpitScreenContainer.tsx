import { useCallback, useEffect, useRef, useState } from "react"
import { buildStreamUrl, CAMERA_FEEDS } from "@/features/camera"
import {
    axesFromKeys,
    buildTeleopUrl,
    createKeyboardInput,
    createTeleopClient,
    useTeleop,
    type DriveCommandKey,
    type KeyboardInput,
    type TeleopClient,
} from "@/features/teleop"
import { RecordingControlContainer } from "@/features/recording"
import { useTranslation } from "@/i18n"
import { loadSavedHost, saveHost } from "../lib/hostStorage"
import { resolveInitialHost } from "../logic/hostConfig"
import { CockpitScreen } from "./CockpitScreen"

// アプリ全体で共有するデフォルト実体(モジュールシングルトン)。
// createKeyboardInput は購読されるまで DOM リスナーを付けないため生成自体に副作用はない。
const defaultClient = createTeleopClient()
const defaultKeyboard = createKeyboardInput(window)

interface CockpitScreenContainerProps {
    /** teleop クライアント。テストや Storybook では差し替える */
    readonly client?: TeleopClient
    /** キーボード入力ソース。テストでは差し替える */
    readonly keyboard?: KeyboardInput
    /** teleop 購読フック。外部から注入できるようにする(テスト容易性のため) */
    readonly useTeleopSnapshot?: typeof useTeleop
    /** 接続先ホストの永続化先 */
    readonly storage?: Storage
}

/**
 * CockpitScreen の Container。
 * teleop クライアントの購読・キーボード配線・ホスト設定の永続化を担い、
 * 表示データを Presentational へ渡す。
 */
export function CockpitScreenContainer({
    client = defaultClient,
    keyboard = defaultKeyboard,
    useTeleopSnapshot = useTeleop,
    storage = window.localStorage,
}: CockpitScreenContainerProps) {
    const { t } = useTranslation()
    const snapshot = useTeleopSnapshot(client)
    const [host, setHost] = useState(() =>
        resolveInitialHost(loadSavedHost(storage), window.location.hostname),
    )

    // 画面の方向ボタンで現在押されている方向。表示はスナップショット由来なので
    // 再レンダー不要 → state ではなく ref に持つ。
    const pressedButtonsRef = useRef<Set<DriveCommandKey>>(new Set())

    // キーボード押下集合 ∪ 画面ボタン押下集合 → teleop クライアントの目標軸。
    const applyDriveAxes = useCallback((): void => {
        const keys = new Set<string>(keyboard.getKeys())
        for (const direction of pressedButtonsRef.current) {
            keys.add(direction)
        }
        client.setAxes(axesFromKeys(keys))
    }, [client, keyboard])

    // 外部システム同士の配線: キーボード押下集合 → 目標軸。
    // どちらも React 外のシステムなので useEffect で購読を管理する。
    useEffect(() => keyboard.subscribe(applyDriveAxes), [keyboard, applyDriveAxes])

    // 画面の方向ボタンの押下/解放を押下集合へ反映し、目標軸を更新する。
    const handleDirectionPress = (direction: DriveCommandKey): void => {
        pressedButtonsRef.current = new Set(pressedButtonsRef.current).add(direction)
        applyDriveAxes()
    }
    const handleDirectionRelease = (direction: DriveCommandKey): void => {
        const next = new Set(pressedButtonsRef.current)
        next.delete(direction)
        pressedButtonsRef.current = next
        applyDriveAxes()
    }

    // 外部システム同期: ページ離脱時に停止指令を送って切断する
    // (本体側のフェイルセーフより速く確実に止める。teleop-client.md 推奨)
    useEffect(() => {
        const handlePageHide = (): void => {
            client.disconnect()
        }
        window.addEventListener("pagehide", handlePageHide)
        return () => {
            window.removeEventListener("pagehide", handlePageHide)
        }
    }, [client])

    const handleHostChange = (nextHost: string): void => {
        setHost(nextHost)
        saveHost(storage, nextHost)
        // 操縦チャネルが生きている間のホスト変更は新しい接続先へ繋ぎ直す
        if (snapshot.status !== "idle") {
            client.connect(buildTeleopUrl(nextHost))
        }
    }

    // 派生データはレンダー中に計算する(useEffect は使わない)
    const cameras = CAMERA_FEEDS.map((feed) => ({
        id: feed.id,
        label: t(`camera.${feed.id}`),
        src: buildStreamUrl(host, feed.topic),
    }))

    return (
        <CockpitScreen
            host={host}
            status={snapshot.status}
            axes={snapshot.axes}
            cameras={cameras}
            onHostChange={handleHostChange}
            onConnect={() => {
                client.connect(buildTeleopUrl(host))
            }}
            onDisconnect={() => {
                client.disconnect()
            }}
            onDirectionPress={handleDirectionPress}
            onDirectionRelease={handleDirectionRelease}
            recordingSlot={<RecordingControlContainer host={host} />}
        />
    )
}
