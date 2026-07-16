import { describe, expect, it } from "vitest"
import { DEFAULT_MODELS, inferProviderFromModel, resolveProvider } from "./provider"

describe("inferProviderFromModel", () => {
    it("maps claude ids to anthropic", () => {
        expect(inferProviderFromModel("claude-sonnet-5")).toBe("anthropic")
        expect(inferProviderFromModel("claude-opus-4-8")).toBe("anthropic")
    })

    it("maps gpt / o-series / chatgpt ids to openai", () => {
        expect(inferProviderFromModel("gpt-4o")).toBe("openai")
        expect(inferProviderFromModel("o3")).toBe("openai")
        expect(inferProviderFromModel("chatgpt-4o-latest")).toBe("openai")
    })

    it("returns null when the id is empty or unrecognized", () => {
        expect(inferProviderFromModel("")).toBeNull()
        expect(inferProviderFromModel("llama-3")).toBeNull()
    })
})

describe("resolveProvider", () => {
    const NO_KEYS = { anthropic: false, openai: false }
    const BOTH_KEYS = { anthropic: true, openai: true }

    it("honors an explicit --provider and fills in its default model", () => {
        expect(resolveProvider({ provider: "openai", keys: NO_KEYS })).toEqual({
            provider: "openai",
            model: DEFAULT_MODELS.openai,
        })
    })

    it("keeps an explicit --model as-is under the chosen provider", () => {
        expect(resolveProvider({ provider: "openai", model: "gpt-4.1", keys: NO_KEYS })).toEqual({
            provider: "openai",
            model: "gpt-4.1",
        })
    })

    it("infers the provider from the model id when --provider is absent", () => {
        expect(resolveProvider({ model: "gpt-4o", keys: BOTH_KEYS }).provider).toBe("openai")
        expect(resolveProvider({ model: "claude-sonnet-5", keys: BOTH_KEYS }).provider).toBe(
            "anthropic",
        )
    })

    it("falls back to the single provider whose API key is present", () => {
        expect(resolveProvider({ keys: { anthropic: false, openai: true } })).toEqual({
            provider: "openai",
            model: DEFAULT_MODELS.openai,
        })
        expect(resolveProvider({ keys: { anthropic: true, openai: false } }).provider).toBe(
            "anthropic",
        )
    })

    it("defaults to anthropic when both keys exist and nothing is specified", () => {
        expect(resolveProvider({ keys: BOTH_KEYS }).provider).toBe("anthropic")
    })

    it("throws when no provider can be determined", () => {
        expect(() => resolveProvider({ keys: NO_KEYS })).toThrow(/no LLM provider/)
    })

    it("throws on an unknown --provider", () => {
        expect(() => resolveProvider({ provider: "gemini", keys: BOTH_KEYS })).toThrow(
            /unknown --provider/,
        )
    })
})
