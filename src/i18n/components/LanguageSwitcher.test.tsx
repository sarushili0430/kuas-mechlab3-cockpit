import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { LanguageProvider } from "../LanguageProvider"
import { useTranslation } from "../useTranslation"
import { LanguageSwitcher } from "./LanguageSwitcher"

function createMemoryStorage(initial: Record<string, string> = {}): Storage {
    const data = new Map(Object.entries(initial))
    return {
        get length() {
            return data.size
        },
        clear: () => {
            data.clear()
        },
        getItem: (key) => data.get(key) ?? null,
        key: () => null,
        removeItem: (key) => {
            data.delete(key)
        },
        setItem: (key, value) => {
            data.set(key, value)
        },
    }
}

/** 翻訳結果を観測するための小さな consumer */
function Probe() {
    const { t } = useTranslation()
    return <p>{t("console.connect")}</p>
}

function renderWithProvider(storage: Storage) {
    return render(
        <LanguageProvider storage={storage}>
            <LanguageSwitcher />
            <Probe />
        </LanguageProvider>,
    )
}

describe("LanguageSwitcher", () => {
    it("既定では日本語で表示し、日本語ボタンが選択状態になる", () => {
        renderWithProvider(createMemoryStorage())
        expect(screen.getByText("接続")).toBeInTheDocument()
        expect(screen.getByRole("button", { name: "日本語" })).toHaveAttribute(
            "aria-pressed",
            "true",
        )
    })

    it("English を押すと表示が英語に切り替わり、設定を保存する", async () => {
        const user = userEvent.setup()
        const storage = createMemoryStorage()
        renderWithProvider(storage)

        await user.click(screen.getByRole("button", { name: "English" }))

        expect(screen.getByText("Connect")).toBeInTheDocument()
        expect(screen.getByRole("button", { name: "English" })).toHaveAttribute(
            "aria-pressed",
            "true",
        )
        expect(storage.getItem("ml3-cockpit.language")).toBe("en")
    })

    it("保存済みの言語を初期表示に反映する", () => {
        renderWithProvider(createMemoryStorage({ "ml3-cockpit.language": "en" }))
        expect(screen.getByText("Connect")).toBeInTheDocument()
    })
})
