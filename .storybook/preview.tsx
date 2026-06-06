import type { Preview } from "@storybook/react-vite"
import { LanguageProvider } from "../src/i18n"
import "../src/index.css"

// Cockpit はダーク専用(design-system/kuas-mechlab3-cockpit/MASTER.md — Theme Policy)
document.documentElement.classList.add("dark")

const preview: Preview = {
    parameters: {
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },

        backgrounds: {
            options: {
                dark: { name: "Dark", value: "oklch(0.129 0.042 264.695)" },
            },
        },

        a11y: {
            // 'todo' - show a11y violations in the test UI only
            // 'error' - fail CI on a11y violations
            // 'off' - skip a11y checks entirely
            test: "todo",
        },
    },

    initialGlobals: {
        backgrounds: { value: "dark" },
    },

    // 言語切替を Storybook 上でも操作できるよう Provider を全ストーリーに供給する
    decorators: [
        (Story) => (
            <LanguageProvider>
                <Story />
            </LanguageProvider>
        ),
    ],
}

export default preview
