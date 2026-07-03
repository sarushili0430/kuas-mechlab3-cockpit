import { useState } from "react"
import { buildRecordUrl } from "../constants"
import { useRecording } from "../hooks/useRecording"
import { createRecordClient, type RecordClient } from "../lib/recordClient"
import type { EpisodeLabel } from "../types"
import { RecordingControl } from "./RecordingControl"

// アプリ全体で共有するデフォルト実体 (モジュールシングルトン)。
// 生成自体に副作用はなく、購読・操作されて初めて record_server を叩く。
const defaultRecordClient = createRecordClient()

interface RecordingControlContainerProps {
    /** 録画コントロール API の接続先ホスト (teleop と同じホスト) */
    readonly host: string
    /** 録画クライアント。テストや Storybook では差し替える */
    readonly client?: RecordClient
    /** 録画購読フック。外部から注入できるようにする (テスト容易性のため) */
    readonly useRecordingSnapshot?: typeof useRecording
}

/**
 * RecordingControl の Container。
 * 録画クライアントの購読と保存ラベルの UI 状態を担い、host から組んだ URL で
 * start / stop / discard を呼ぶ。teleop の接続状態とは独立して動く。
 */
export function RecordingControlContainer({
    host,
    client = defaultRecordClient,
    useRecordingSnapshot = useRecording,
}: RecordingControlContainerProps) {
    const snapshot = useRecordingSnapshot(client)
    // 保存時のラベルは単純な UI 状態なのでコンポーネント内 useState で持つ
    const [label, setLabel] = useState<EpisodeLabel>("success")
    const baseUrl = buildRecordUrl(host)

    return (
        <RecordingControl
            status={snapshot.status}
            episode={snapshot.episode}
            error={snapshot.error}
            label={label}
            onLabelChange={setLabel}
            onStart={() => {
                void client.start(baseUrl)
            }}
            onStop={() => {
                void client.stop(baseUrl, label)
            }}
            onDiscard={() => {
                void client.discard(baseUrl)
            }}
        />
    )
}
