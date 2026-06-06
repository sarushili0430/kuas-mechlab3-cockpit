import type { Meta, StoryObj } from "@storybook/react-vite"
import { PlayIcon } from "lucide-react"
import { Button } from "./button"

const meta = {
    title: "UI/Button",
    component: Button,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    argTypes: {
        variant: {
            control: "select",
            options: ["default", "destructive", "outline", "secondary", "ghost", "link"],
        },
        size: {
            control: "select",
            options: ["default", "sm", "lg", "icon"],
        },
    },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: {
        children: "計測開始",
    },
}

export const Destructive: Story = {
    args: {
        variant: "destructive",
        children: "緊急停止",
    },
}

export const Outline: Story = {
    args: {
        variant: "outline",
        children: "リセット",
    },
}

export const WithIcon: Story = {
    args: {
        children: (
            <>
                <PlayIcon />
                計測開始
            </>
        ),
    },
}
