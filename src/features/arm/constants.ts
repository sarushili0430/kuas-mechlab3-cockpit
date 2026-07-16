import type { ArmAngles, ArmDirection } from "./types"

/** サーボ可動域の下限 (度)。docs/cockpit.html の clamp(0..180) と一致 */
export const ARM_MIN_ANGLE = 0

/** サーボ可動域の上限 (度) */
export const ARM_MAX_ANGLE = 180

/** ホーム姿勢 (肩/肘とも中央 90°)。docs/cockpit.html の Home 90/90 */
export const ARM_HOME: ArmAngles = { shoulder: 90, elbow: 90 }

/** ▼▲ ボタン 1 回の角度変化 (度)。docs/cockpit.html の STEP=5 */
export const ARM_BUTTON_STEP = 5

/** 矢印キー / パッド押下 1 tick の角度変化 (度)。docs/cockpit.html の ARM_KEY_STEP=1.5 */
export const ARM_KEY_STEP = 1.5

/** 押下中ジョグの更新間隔 (ms)。約 20Hz (docs/cockpit.html の RATE_HZ=20) */
export const ARM_JOG_INTERVAL_MS = 50

/** イージング送信の間隔 (ms)。約 40Hz (docs/cockpit.html の 1000/40) */
export const ARM_SEND_INTERVAL_MS = 25

/** イージング係数。目標へ毎 tick この割合だけ近づく (docs/cockpit.html の EASE=0.22) */
export const ARM_EASE = 0.22

/** この差 (度) 以下になったら目標へスナップする (docs/cockpit.html の 0.15) */
export const ARM_EASE_SNAP = 0.15

/**
 * アーム操作に使う矢印キー (小文字・KeyboardEvent.key.toLowerCase 準拠)。
 * 押下時の画面スクロールを抑止するため createKeyboardInput へ渡す。
 */
export const ARM_ARROW_KEYS: readonly string[] = ["arrowup", "arrowdown", "arrowleft", "arrowright"]

/** 矢印キー → ジョグ方向の対応 */
export const ARM_KEY_TO_DIRECTION: Readonly<Record<string, ArmDirection>> = {
    arrowup: "up",
    arrowdown: "down",
    arrowleft: "left",
    arrowright: "right",
}
