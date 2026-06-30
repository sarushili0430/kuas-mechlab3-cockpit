import { interpolate } from "./logic/interpolate"

/** 対応言語(表示順) */
export const LANGUAGES = ["ja", "en"] as const

export type Language = (typeof LANGUAGES)[number]

/** 保存された設定がない場合の既定言語。日本語ファーストの運用に合わせる */
export const DEFAULT_LANGUAGE: Language = "ja"

// ja を正本(キーの源泉)とし、en は同じキー集合を満たすことを型で強制する。
const ja = {
    "header.subtitle": "KUAS MechLab3 遠隔操縦",
    "header.cameras": "カメラ映像",
    "console.area": "操縦コンソール",
    "console.connect": "接続",
    "console.emergencyStop": "緊急停止",
    "console.cancelConnect": "接続中止",
    "console.hint":
        "W / A / S / D キーまたは画面の方向ボタンで操縦できます (指やキーを離すと停止・切断時も機体は自動停止します)",
    "connection.idle": "未接続",
    "connection.connecting": "接続中…",
    "connection.open": "接続済",
    "connection.reconnecting": "再接続中…",
    "host.label": "接続先ホスト",
    "host.invalid": "ホスト名が無効です",
    "host.apply": "適用",
    "camera.connecting": "接続中…",
    "camera.alt": "{label}カメラ映像",
    "camera.retry": "再試行",
    "camera.front": "前方",
    "camera.rear": "後方",
    "keypad.label": "操縦パッド",
    "keypad.forward": "前進",
    "keypad.backward": "後退",
    "keypad.left": "左旋回",
    "keypad.right": "右旋回",
    "axes.vx": "前後 vx",
    "axes.wz": "旋回 wz",
    "language.label": "言語",
}

export type TranslationKey = keyof typeof ja

const en = {
    "header.subtitle": "KUAS MechLab3 Teleoperation",
    "header.cameras": "Camera feeds",
    "console.area": "Drive console",
    "console.connect": "Connect",
    "console.emergencyStop": "Emergency stop",
    "console.cancelConnect": "Cancel",
    "console.hint":
        "Drive with the W / A / S / D keys or the on-screen arrow buttons (release to stop; the robot also stops automatically on disconnect)",
    "connection.idle": "Offline",
    "connection.connecting": "Connecting…",
    "connection.open": "Connected",
    "connection.reconnecting": "Reconnecting…",
    "host.label": "Host",
    "host.invalid": "Invalid host name",
    "host.apply": "Apply",
    "camera.connecting": "Connecting…",
    "camera.alt": "{label} camera feed",
    "camera.retry": "Retry",
    "camera.front": "Front",
    "camera.rear": "Rear",
    "keypad.label": "Drive pad",
    "keypad.forward": "Forward",
    "keypad.backward": "Backward",
    "keypad.left": "Turn left",
    "keypad.right": "Turn right",
    "axes.vx": "Fwd/back vx",
    "axes.wz": "Yaw wz",
    "language.label": "Language",
} satisfies Record<TranslationKey, string>

const dictionaries = { ja, en }

export type TranslateParams = Record<string, string | number>

/** 翻訳キー(と任意の補間パラメータ)を表示文字列へ変換する関数 */
export type TranslateFn = (key: TranslationKey, params?: TranslateParams) => string

/** 指定言語に束縛した翻訳関数を生成する(レンダー中に呼べる純粋な構成) */
export function createTranslator(language: Language): TranslateFn {
    const dictionary = dictionaries[language]
    return (key, params) => interpolate(dictionary[key], params)
}
