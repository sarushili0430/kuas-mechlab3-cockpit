/** Anthropic TypeScript SDK を LlmClient へ適合させる薄いアダプタ。 */
import Anthropic from "@anthropic-ai/sdk"
import type { LlmClient, LlmRequest } from "./llm"

/** 既定モデル: 視覚 + エージェント性能と低レイテンシ・低コストのバランス。 */
export const DEFAULT_MODEL = "claude-sonnet-5"

/**
 * SDK クライアントを生成する。ANTHROPIC_API_KEY は SDK が環境から読む。
 * ここだけが `@anthropic-ai/sdk` に依存する境界 (ランナー本体は llm.ts 抽象のみ)。
 */
export function createAnthropicClient(model: string): LlmClient {
    const anthropic = new Anthropic()
    return {
        complete: async (request: LlmRequest): Promise<string> => {
            const imageBlocks = request.images.map((image) => ({
                type: "image" as const,
                source: {
                    type: "base64" as const,
                    media_type: image.mediaType,
                    data: image.base64,
                },
            }))
            const message = await anthropic.messages.create({
                model,
                max_tokens: request.maxTokens,
                system: request.system,
                messages: [
                    {
                        role: "user",
                        content: [...imageBlocks, { type: "text" as const, text: request.text }],
                    },
                ],
            })
            const textBlock = message.content.find((block) => block.type === "text")
            if (textBlock === undefined) {
                throw new Error("Claude returned no text block")
            }
            return textBlock.text
        },
    }
}
