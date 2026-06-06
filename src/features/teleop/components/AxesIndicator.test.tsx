import { render, screen } from "@testing-library/react"
import { AxesIndicator } from "./AxesIndicator"

describe("AxesIndicator", () => {
    it("前後 (vx) と旋回 (wz) のラベルを表示する", () => {
        render(<AxesIndicator axes={{ vx: 0, wz: 0 }} />)
        expect(screen.getByText("前後 vx")).toBeInTheDocument()
        expect(screen.getByText("旋回 wz")).toBeInTheDocument()
    })

    it("軸値を符号付き2桁で表示する", () => {
        render(<AxesIndicator axes={{ vx: 1, wz: -0.5 }} />)
        expect(screen.getByText("+1.00")).toBeInTheDocument()
        expect(screen.getByText("-0.50")).toBeInTheDocument()
    })

    it("停止中のスナップショットと一致する", () => {
        const { container } = render(<AxesIndicator axes={{ vx: 0, wz: 0 }} />)
        expect(container).toMatchSnapshot()
    })

    it("前進+左旋回のスナップショットと一致する", () => {
        const { container } = render(<AxesIndicator axes={{ vx: 1, wz: 0.5 }} />)
        expect(container).toMatchSnapshot()
    })
})
