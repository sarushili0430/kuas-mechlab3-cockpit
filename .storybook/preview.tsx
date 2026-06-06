import type { Preview } from "@storybook/react-vite"
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
}

export default preview
