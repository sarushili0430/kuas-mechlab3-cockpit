import { useState } from "react"
import { RotateCwIcon, VideoOffIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CameraFeedProps {
    readonly label: string
    /** MJPEG ストリーム URL。接続先未設定なら null */
    readonly src: string | null
}

/** ストリームから最後に受け取ったイベントの記録 */
interface StreamEvent {
    readonly src: string
    readonly kind: "live" | "error"
}

type FeedStatus = "no-source" | "connecting" | "live" | "error"

/**
 * MJPEG カメラフィード(`<img>` によるネイティブ受信)。
 * 状態は「最後に観測したイベント」から レンダー中に導出する。
 * src が変われば導出結果が connecting に戻るため、useEffect での同期は不要。
 */
export function CameraFeed({ label, src }: CameraFeedProps) {
    const [lastEvent, setLastEvent] = useState<StreamEvent | null>(null)
    const [retryNonce, setRetryNonce] = useState(0)

    const status: FeedStatus =
        src === null ? "no-source" : lastEvent?.src === src ? lastEvent.kind : "connecting"

    const handleRetry = (): void => {
        setLastEvent(null)
        // img を再マウントしてブラウザにストリームへ再接続させる
        setRetryNonce((nonce) => nonce + 1)
    }

    return (
        <figure className="relative flex size-full min-h-40 flex-col overflow-hidden rounded-xl border border-border bg-black">
            {/* 接続中はストリーム描画開始までの背面表示(最初のフレームで自然に隠れる) */}
            {status === "connecting" && (
                <p className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground motion-safe:animate-pulse">
                    接続中…
                </p>
            )}

            {src !== null && status !== "error" && (
                <img
                    key={`${src}#${String(retryNonce)}`}
                    src={src}
                    alt={`${label}カメラ映像`}
                    className="relative size-full flex-1 object-contain"
                    onLoad={() => {
                        setLastEvent({ src, kind: "live" })
                    }}
                    onError={() => {
                        setLastEvent({ src, kind: "error" })
                    }}
                />
            )}

            {(status === "no-source" || status === "error") && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <VideoOffIcon aria-hidden className="size-6" />
                    <p className="font-heading text-sm tracking-widest">NO SIGNAL</p>
                    {status === "error" && (
                        <Button variant="outline" size="sm" onClick={handleRetry}>
                            <RotateCwIcon aria-hidden data-icon="inline-start" />
                            再試行
                        </Button>
                    )}
                </div>
            )}

            <figcaption className="absolute top-2 right-2 rounded-md bg-background/70 px-2 py-0.5 font-heading text-xs tracking-widest text-foreground backdrop-blur-sm">
                {label}
            </figcaption>

            {status === "live" && (
                <span className="absolute top-2 left-2 inline-flex items-center gap-1.5 rounded-md bg-background/70 px-2 py-0.5 font-heading text-xs tracking-widest text-success backdrop-blur-sm">
                    <span
                        aria-hidden
                        className="size-1.5 rounded-full bg-success shadow-glow-success motion-safe:animate-pulse"
                    />
                    LIVE
                </span>
            )}
        </figure>
    )
}
