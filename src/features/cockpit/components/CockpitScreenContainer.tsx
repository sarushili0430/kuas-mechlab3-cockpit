import { useEffect, useState } from "react"
import { buildStreamUrl, CAMERA_FEEDS } from "@/features/camera"
import {
    axesFromKeys,
    buildTeleopUrl,
    createKeyboardInput,
    createTeleopClient,
    useTeleop,
    type KeyboardInput,
    type TeleopClient,
} from "@/features/teleop"
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

    // 外部システム同士の配線: キーボード押下集合 → teleop クライアントの目標軸。
    // どちらも React 外のシステムなので useEffect で購読を管理する。
    useEffect(() => {
        return keyboard.subscribe(() => {
            client.setAxes(axesFromKeys(keyboard.getKeys()))
        })
    }, [client, keyboard])

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
        />
    )
}
