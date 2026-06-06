import { render, screen } from "@testing-library/react"
import { DriveKeypad } from "./DriveKeypad"

describe("DriveKeypad", () => {
    it("W/A/S/D の4キーを表示する", () => {
        render(<DriveKeypad directions={new Set()} />)
        for (const key of ["W", "A", "S", "D"]) {
            expect(screen.getByText(key)).toBeInTheDocument()
        }
    })

    it("アクティブな方向のキーだけ点灯する", () => {
        render(<DriveKeypad directions={new Set(["w", "d"])} />)
        expect(screen.getByText("W")).toHaveAttribute("data-active", "true")
        expect(screen.getByText("D")).toHaveAttribute("data-active", "true")
        expect(screen.getByText("A")).toHaveAttribute("data-active", "false")
        expect(screen.getByText("S")).toHaveAttribute("data-active", "false")
    })

    it("全消灯のスナップショットと一致する", () => {
        const { container } = render(<DriveKeypad directions={new Set()} />)
        expect(container).toMatchSnapshot()
    })

    it("前進+右旋回点灯のスナップショットと一致する", () => {
        const { container } = render(<DriveKeypad directions={new Set(["w", "d"])} />)
        expect(container).toMatchSnapshot()
    })
})
