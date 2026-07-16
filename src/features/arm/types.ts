/**
 * 2-DoF アームの関節角 (度)。kuas-mechlab3 docs/cockpit.html と同じ肩/肘の 2 軸。
 * teleop_server へ `{"servo":[肩, 肘]}` として送られる (0..180)。
 */
export interface ArmAngles {
    /** 肩 shoulder [0, 180] */
    readonly shoulder: number
    /** 肘 elbow [0, 180] */
    readonly elbow: number
}

/** アームの関節識別子 */
export type ArmJoint = "shoulder" | "elbow"

/**
 * アームの連続ジョグ方向 (矢印キー / 画面パッド)。
 * up/down = 肘, left/right = 肩 (docs/cockpit.html の ←→肩・↑↓肘 と一致)。
 */
export type ArmDirection = "up" | "down" | "left" | "right"

/** アームコントローラの購読スナップショット */
export interface ArmSnapshot {
    /** 目標角 (表示用)。イージング後の送信値ではなく操作者が指示した目標 */
    readonly angles: ArmAngles
    /** 現在ジョグ中の方向 (パッド点灯用) */
    readonly directions: ReadonlySet<ArmDirection>
}
