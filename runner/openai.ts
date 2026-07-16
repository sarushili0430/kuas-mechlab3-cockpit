/** OpenAI TypeScript SDK を LlmClient へ適合させる薄いアダプタ。 */
import OpenAI from "openai"
import type { LlmClient, LlmRequest } from "./llm"

/**
 * SDK クライアントを生成する。OPENAI_API_KEY は SDK が環境から読む。
 * ここだけが `openai` に依存する境界 (ランナー本体は llm.ts 抽象のみ)。
 * 画像は Chat Completions の `image_url` (data URL) として渡す。
 */
export function createOpenAiClient(model: string): LlmClient {
    const openai = new OpenAI()
    return {
        complete: async (request: LlmRequest): Promise<string> => {
            const imageBlocks = request.images.map((image) => ({
                type: "image_url" as const,
                image_url: { url: `data:${image.mediaType};base64,${image.base64}` },
            }))
            const completion = await openai.chat.completions.create({
                model,
                max_completion_tokens: request.maxTokens,
                messages: [
                    { role: "system", content: request.system },
                    {
                        role: "user",
                        content: [...imageBlocks, { type: "text" as const, text: request.text }],
                    },
                ],
            })
            const content = completion.choices[0]?.message.content
            if (content === undefined || content === null || content === "") {
                throw new Error("OpenAI returned no text content")
            }
            return content
        },
    }
}
