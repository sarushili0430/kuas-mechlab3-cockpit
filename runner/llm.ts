/**
 * Claude 呼び出しの最小抽象。実装は anthropic.ts (SDK アダプタ) と、
 * テスト用のフェイク。ランナー本体は SDK 型に直接依存しない。
 */

/** モデルへ渡す画像 (JPEG を base64 化したもの)。 */
export interface LlmImage {
    readonly mediaType: "image/jpeg"
    readonly base64: string
}

export interface LlmRequest {
    readonly system: string
    readonly text: string
    readonly images: readonly LlmImage[]
    readonly maxTokens: number
}

export interface LlmClient {
    /** system + テキスト + 画像を送り、モデルの本文テキストを返す。 */
    readonly complete: (request: LlmRequest) => Promise<string>
}
