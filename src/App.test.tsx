import { render, screen } from "@testing-library/react"
import App from "./App"

describe("App", () => {
    it("タイトルを表示する", () => {
        render(<App />)
        expect(screen.getByRole("heading", { name: "KUAS MechLab3 Cockpit" })).toBeInTheDocument()
    })

    it("スナップショットと一致する", () => {
        const { container } = render(<App />)
        expect(container).toMatchSnapshot()
    })
})
