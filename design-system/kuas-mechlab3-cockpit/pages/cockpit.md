# Cockpit Page Overrides

> **PROJECT:** KUAS MechLab3 Cockpit
> **Updated:** 2026-06-06
> **Page Type:** Robot Teleoperation Console(メイン画面・単一ページ)

> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`design-system/kuas-mechlab3-cockpit/MASTER.md`).
> Only deviations from the Master are documented here. For all other rules, refer to the Master.

---

## Screen Layout

```
┌──────────────────────────────────────────────────────┐
│ Header: ML3 COCKPIT | 接続ステータス | ホスト設定      │  h-14 程度・常時固定
├───────────────────────────┬──────────────────────────┤
│ FRONT CAMERA (4:3)        │ REAR CAMERA (4:3)        │  md 以上で 2 列
│ LIVE バッジ / NO SIGNAL   │                          │  (375px では縦積み)
├───────────────────────────┴──────────────────────────┤
│ Drive Console:                                       │
│  [キーパッド W/A/S/D] [vx・wz インジケータ] [E-STOP]   │  1 行に収まらない幅では折返し
│  操作ヒント(フォーカスして W/A/S/D、離すと停止)        │
└──────────────────────────────────────────────────────┘
```

- 全体は `min-h-svh` の縦 flex。**ページスクロールを発生させない**ことを優先し、
  カメラ面が `flex-1` で余白を吸収する
- 操縦パネル(接続状態・E-STOP)は常に画面下部の固定位置

## Data & Interface(本体仕様への準拠)

`kuas-mechlab3` リポジトリ `docs/teleop-client.md` が正本。UI はこの仕様を逸脱しない。

| Channel | Endpoint | Format |
|---------|----------|--------|
| 操縦 OUT | `ws://<host>:9001` | `{"vx": -1..1, "wz": -1..1}` を 20Hz で連続送信 |
| 映像 IN | `http://<host>:8080/stream?topic=<topic>` | MJPEG(`<img>` で受信) |

- `vx > 0` = 前進、`wz > 0` = 左旋回(REP-103)
- 送信が約 0.4s 途絶えると機体側が自動停止する(フェイルセーフに「乗る」)
- カメラトピック: `/front_camera/image_raw/compressed` / `/rear_camera/image_raw/compressed`

## Component Overrides

### Connection Status(ヘッダー右)

Master の Status Indicator 仕様に加え、状態は 4 値:
`idle`(未接続)/ `connecting`(接続中)/ `open`(接続済・グロー)/ `reconnecting`(再接続待ち・パルス)

### Drive Keypad

- 表示は押下キーの生状態ではなく、**送信中の軸値から導出した方向**を点灯する
  (相殺入力 W+S では何も点灯しない = 機体に送られる指令と一致)
- 横列: A / W(上段)・S / D 配列のインバートT字。`size-12` 以上のセル

### Axes Indicator

- `vx` / `wz` をラベル + 符号付き数値(`+0.00` 形式、`tabular-nums`)+ 双方向バーで表示
- バーは中央ゼロ、右(正)= Blue、数値は `font-heading`

### Emergency Stop

- `destructive` の大型ボタン(`h-12` 以上)。押下で **WebSocket を切断**して機体を停止させる
- 切断状態では「接続」(CTA Amber)ボタンに切り替わる

### Host Settings

- ヘッダー内のコンパクトなフォーム(input + 適用)。適用でカメラ URL・WS 接続先を即時切替
- 操縦キーと干渉しないよう、入力フォーカス中はキーボード操縦を無効化(Master の Safety UX)

## Recommendations

- Effects: 接続グロー、reconnecting パルス、LIVE バッジの点滅は `prefers-reduced-motion` で停止
- カメラ映像はブラウザネイティブの MJPEG デコードに任せ、JS での描画処理を挟まない(Sustainability)
- 将来拡張: ホイールテレメトリ(`wheel_rpm` / `wheel_pwm`)は rosbridge 導入後に
  Drive Console 横へパネル追加する(チャートは Data Blue 系)
