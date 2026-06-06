import { render, screen } from "@testing-library/react"
import App from "./App"

describe("App", () => {
    it("ML3 コックピット画面を表示する", () => {
        render(<App />)
        expect(screen.getByRole("heading", { name: "ML3 COCKPIT" })).toBeInTheDocument()
    })

    it("スナップショットと一致する", () => {
        const { container } = render(<App />)
        expect(container).toMatchSnapshot()
    })
})
