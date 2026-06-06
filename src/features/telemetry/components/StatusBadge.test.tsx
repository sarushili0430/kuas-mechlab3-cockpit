import { render, screen } from "@testing-library/react"
import { StatusBadge } from "./StatusBadge"

describe("StatusBadge", () => {
    it.each([
        ["normal", "正常"],
        ["warning", "警告"],
        ["critical", "危険"],
    ] as const)("status %s ならラベル %s を表示する", (status, label) => {
        render(<StatusBadge status={status} />)
        expect(screen.getByText(label)).toBeInTheDocument()
    })

    it.each(["normal", "warning", "critical"] as const)(
        "status %s のスナップショットと一致する",
        (status) => {
            const { container } = render(<StatusBadge status={status} />)
            expect(container).toMatchSnapshot()
        },
    )
})
