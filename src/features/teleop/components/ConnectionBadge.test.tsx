import { render, screen } from "@testing-library/react"
import { ConnectionBadge } from "./ConnectionBadge"

describe("ConnectionBadge", () => {
    it.each([
        ["idle", "未接続"],
        ["connecting", "接続中…"],
        ["open", "接続済"],
        ["reconnecting", "再接続中…"],
    ] as const)("status=%s でラベル「%s」を表示する", (status, label) => {
        render(<ConnectionBadge status={status} />)
        const badge = screen.getByRole("status")
        expect(badge).toHaveTextContent(label)
        expect(badge).toHaveAttribute("data-status", status)
    })

    it("接続済のスナップショットと一致する", () => {
        const { container } = render(<ConnectionBadge status="open" />)
        expect(container).toMatchSnapshot()
    })

    it("再接続中のスナップショットと一致する", () => {
        const { container } = render(<ConnectionBadge status="reconnecting" />)
        expect(container).toMatchSnapshot()
    })
})
