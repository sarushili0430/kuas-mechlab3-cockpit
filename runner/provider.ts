/**
 * LLM プロバイダの選択と、モデル ID / API キー環境変数の解決。
 * SDK には依存しない純ロジックなので、そのまま単体テストできる。
 */

/** 対応する LLM プロバイダ。 */
export type Provider = "anthropic" | "openai"

/** プロバイダ・モデル未指定時の既定モデル。 */
export const DEFAULT_MODELS: Record<Provider, string> = {
    anthropic: "claude-sonnet-5",
    openai: "gpt-4o",
}

/** プロバイダごとに API キーを読む環境変数名。 */
export const API_KEY_ENV: Record<Provider, string> = {
    anthropic: "ANTHROPIC_API_KEY",
    openai: "OPENAI_API_KEY",
}

const OPENAI_MODEL_PREFIXES = ["gpt", "o1", "o3", "o4", "chatgpt"] as const

/** モデル ID からプロバイダを推定する。判定できなければ null。 */
export function inferProviderFromModel(model: string): Provider | null {
    const id = model.trim().toLowerCase()
    if (id === "") {
        return null
    }
    if (id.startsWith("claude")) {
        return "anthropic"
    }
    if (OPENAI_MODEL_PREFIXES.some((prefix) => id.startsWith(prefix))) {
        return "openai"
    }
    return null
}

function normalizeProvider(value: string | undefined): Provider | null {
    if (value === undefined) {
        return null
    }
    const id = value.trim().toLowerCase()
    return id === "anthropic" || id === "openai" ? id : null
}

/** どのプロバイダの API キーが環境に存在するか。 */
export interface ProviderKeys {
    readonly anthropic: boolean
    readonly openai: boolean
}

function providerFromKeys(keys: ProviderKeys): Provider | null {
    if (keys.openai && !keys.anthropic) {
        return "openai"
    }
    if (keys.anthropic && !keys.openai) {
        return "anthropic"
    }
    if (keys.anthropic && keys.openai) {
        // 両方あるときは既存挙動を維持して anthropic。--provider / --model で上書き可。
        return "anthropic"
    }
    return null
}

export interface ResolveInput {
    /** CLI の --provider (あれば最優先)。 */
    readonly provider?: string | undefined
    /** CLI の --model (プロバイダ推定とモデル決定に使う)。 */
    readonly model?: string | undefined
    /** 環境変数に存在する API キー。 */
    readonly keys: ProviderKeys
}

export interface ResolvedProvider {
    readonly provider: Provider
    readonly model: string
}

/**
 * --provider → --model からの推定 → API キーの有無、の順にプロバイダを決める。
 * モデル未指定ならプロバイダ既定モデルを補う。決められない / 不正な指定なら Error。
 */
export function resolveProvider(input: ResolveInput): ResolvedProvider {
    const explicit = normalizeProvider(input.provider)
    if (input.provider !== undefined && explicit === null) {
        throw new Error(`unknown --provider "${input.provider}" (use "anthropic" or "openai")`)
    }
    const fromModel = input.model !== undefined ? inferProviderFromModel(input.model) : null
    const provider = explicit ?? fromModel ?? providerFromKeys(input.keys)
    if (provider === null) {
        throw new Error(
            `no LLM provider configured: set ${API_KEY_ENV.openai} or ${API_KEY_ENV.anthropic} ` +
                "in .env, or pass --provider anthropic|openai",
        )
    }
    return { provider, model: input.model ?? DEFAULT_MODELS[provider] }
}
