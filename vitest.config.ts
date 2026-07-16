import path from "node:path"
import { fileURLToPath } from "node:url"
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin"
import react from "@vitejs/plugin-react"
import { playwright } from "@vitest/browser-playwright"
import { defineConfig } from "vitest/config"

const dirname =
    typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url))

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(dirname, "./src"),
        },
    },
    test: {
        coverage: {
            provider: "v8",
            reporter: ["text", "html", "lcov", "json-summary", "json"],
            include: ["src/**/*.{ts,tsx}"],
            exclude: [
                // shadcn/ui のベンダーコードと型定義・エントリポイントは対象外
                "src/components/ui/**",
                "src/**/*.stories.tsx",
                "src/**/*.d.ts",
                "src/main.tsx",
                "src/test/**",
            ],
        },
        projects: [
            {
                extends: true,
                test: {
                    name: "unit",
                    globals: true,
                    environment: "jsdom",
                    setupFiles: ["./src/test/setup.ts"],
                    include: ["src/**/*.{test,spec}.{ts,tsx}"],
                },
            },
            {
                extends: true,
                test: {
                    name: "runner",
                    globals: true,
                    environment: "node",
                    include: ["runner/**/*.{test,spec}.ts"],
                },
            },
            {
                extends: true,
                plugins: [
                    // The plugin will run tests for the stories defined in your Storybook config
                    // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
                    storybookTest({
                        configDir: path.join(dirname, ".storybook"),
                    }),
                ],
                test: {
                    name: "storybook",
                    browser: {
                        enabled: true,
                        headless: true,
                        provider: playwright({}),
                        instances: [
                            {
                                browser: "chromium",
                            },
                        ],
                    },
                },
            },
        ],
    },
})
