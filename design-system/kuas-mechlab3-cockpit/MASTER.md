# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/kuas-mechlab3-cockpit/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** KUAS MechLab3 Cockpit
**Updated:** 2026-06-06
**Category:** Robot Teleoperation / Mission Control Dashboard

ML3(4輪スキッドステアロボット)を遠隔操縦するコックピット UI。
暗い実験室・夜間運用を前提とした **Dark Mode (OLED) 専用**のミッションコントロール画面とする。

---

## Global Rules

### Theme Policy — Dark Only

本プロダクトはライトモードを提供しない。

- `index.html` の `<html>` に `class="dark"` を常時付与する(shadcn/ui の `dark:` バリアントを有効化するため)
- `:root`(ライト)のトークン定義は shadcn/ui 互換のため残置するが、**UI 設計・検証はダークトークンのみを前提とする**
- コントラスト検証はダーク背景(`#020617` / `#0F172A`)上で行う

### Color Palette

役割: **Blue = データ・情報 / Amber = 操作(CTA)・強調 / Green = 正常・接続 / Red = 危険・切断**。
色だけに意味を持たせず、必ずラベルまたはアイコンを併記する。

| Role | Hex | oklch | CSS Variable | Contrast vs #020617 |
|------|-----|-------|--------------|---------------------|
| Background | `#020617` | `oklch(0.129 0.042 264.695)` | `--background` | — |
| Surface / Card | `#0F172A` | `oklch(0.208 0.042 265.755)` | `--card` | — |
| Surface Raised | `#1E293B` | `oklch(0.279 0.041 260.031)` | `--secondary` `--muted` | — |
| Text | `#F8FAFC` | `oklch(0.984 0.003 247.858)` | `--foreground` | ≈ 17.5:1 |
| Muted Text | `#94A3B8` | `oklch(0.704 0.04 256.788)` | `--muted-foreground` | ≈ 7.0:1 |
| Primary (Blue) | `#3B82F6` | `oklch(0.623 0.214 259.815)` | `--primary` | ≈ 5.4:1 |
| Data Blue | `#60A5FA` | `oklch(0.707 0.165 254.624)` | `--chart-1` | ≈ 7.2:1 |
| CTA (Amber) | `#F59E0B` | `oklch(0.769 0.188 70.08)` | `--cta` | ≈ 9.6:1 |
| Success / Connected | `#22C55E` | `oklch(0.723 0.219 149.579)` | `--success` | ≈ 8.3:1 |
| Warning | `#FBBF24` | `oklch(0.828 0.189 84.429)` | `--warning` | ≈ 11.7:1 |
| Destructive / Lost | `#F87171` | `oklch(0.704 0.191 22.216)` | `--destructive` | ≈ 6.6:1 |

**Foreground ルール:** 彩度の高い背景(`--primary` `--cta` `--success`)の上に小さいテキストを置く場合、
foreground は白ではなく**深色**(例: `--primary-foreground: #020617` 系)を使い 4.5:1 以上を確保する。

### Typography

- **Heading / Data Font:** Fira Code(`--font-heading` = `--font-mono`)— 見出し・計測値・ステータスは等幅で
- **Body Font:** Fira Sans(`--font-sans`)
- **Mood:** cockpit, telemetry, technical, precise
- 数値表示には必ず `tabular-nums` を併用し、更新時の桁ブレを防ぐ

フォントは `@fontsource` パッケージからセルフホストする(オフラインの実験室 LAN でも崩れないこと)。

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |

### Elevation & Glow

OLED ダークでは drop shadow がほぼ見えないため、**階層はボーダーと面の明度差**で、
**状態はグロー(box-shadow ぼかし)**で表現する。

| Level | Value | Usage |
|-------|-------|-------|
| Border | `1px solid oklch(1 0 0 / 12%)` | パネル・カードの輪郭 |
| Border Strong | `1px solid oklch(1 0 0 / 24%)` | フォーカス周辺、アクティブパネル |
| `--glow-success` | `0 0 12px oklch(0.723 0.219 149.579 / 50%)` | 接続中インジケータ |
| `--glow-primary` | `0 0 12px oklch(0.623 0.214 259.815 / 50%)` | アクティブなデータ要素 |
| `--glow-destructive` | `0 0 12px oklch(0.704 0.191 22.216 / 50%)` | 危険状態・切断 |

---

## Component Specs

shadcn/ui のトークン(`bg-primary` `text-muted-foreground` など)を直接使い、生 HEX をコンポーネントに書かない。

### Buttons

- **CTA(接続・適用など肯定的操作):** `bg-cta text-cta-foreground hover:bg-cta/90` — Amber
- **Secondary / 通常操作:** shadcn `outline` バリアント(暗面 + 白ボーダー 12%)
- **Emergency Stop / 切断:** `destructive` バリアント。操縦パネル内では最も大きく、常に可視
- すべて `cursor-pointer`、`transition-colors duration-200`、`focus-visible` リング必須
- ホバーは色・透明度の変化のみ(レイアウトシフトする scale は禁止)

### Panels / Cards

```
bg-card border border-border rounded-xl p-4 (高密度部は p-3)
```

- クリックできないパネルに hover effect・cursor-pointer を付けない
- パネル見出しは `font-heading text-xs uppercase tracking-widest text-muted-foreground`

### Inputs

- `bg-input/30 border-input` の暗面入力。フォーカスで `ring-ring/50`(Blue)
- ラベルは必ず `<label htmlFor>` で関連付ける

### Status Indicator(接続状態)

- ドット + ラベルの組(色のみで伝えない)
- `connected`: `bg-success` ドット + `--glow-success` + ラベル「接続中」
- `connecting / reconnecting`: `bg-warning` ドット + `animate-pulse` + ラベル
- `disconnected`: `bg-muted-foreground` または `bg-destructive` ドット + ラベル
- パルス・グローは `prefers-reduced-motion` で停止する

### Video Feed(カメラ)

- `bg-black` の枠に `aspect-[4/3]`(カメラは 320×240)、`object-contain`
- 映像が無い状態は黒画面ではなく **「NO SIGNAL」プレースホルダ**(アイコン + 説明 + 再試行)を表示
- ストリーム受信中は左上に LIVE バッジ(success ドット併用)
- `<img>` には必ず意味のある `alt`(例:「前方カメラ映像」)

### Keypad / 操縦入力表示

- キーキャップ風の正方形セル(`font-heading`、`border`、暗面)
- アクティブ時: `bg-primary text-primary-foreground` + `--glow-primary`
- 表示は「実際に機体へ送信している指令」を反映する(押下キーの生状態ではなく合成後の軸)

---

## Style Guidelines

**Style:** Dark Mode (OLED) — Mission Control

**Keywords:** deep black, midnight blue, high contrast, low light, OLED, telemetry, eye-friendly, night ops

**Key Effects:** minimal glow、状態パルス(接続・警告)、150–300ms のトランジション、高い可読性、可視フォーカス

### Page Pattern — Mission Control Grid

LP 的なスクロールジャーニーは採用しない。**1 画面常駐・スクロールなし**を基本とする。

- **構成:** 1. Header Bar(機体名 / 接続状態 / 接続設定) 2. Camera Grid(前後 2 面) 3. Drive Console(操縦状態 + 緊急停止)
- **Grid:** 12-column、`max-w` 制限なし(フル幅)。`min-h-svh` で全画面を占有
- **Density:** 高情報密度。ただし操縦中に視線移動が最小になるよう、安全系(接続状態・停止)は常に同じ位置に固定
- **CTA Placement:** 緊急停止は操縦コンソール内の固定位置(スクロールや開閉で隠れる場所に置かない)

### Safety UX(コックピット固有)

- 接続状態の変化は色 + ラベル + アニメーションで即時に伝える
- 「切断 = 機体は自動停止する」ことを UI 上に明記し、操縦者の不安を残さない
- キーボード操縦はテキスト入力中(input / textarea フォーカス中)には反応させない
- ウィンドウ非アクティブ(blur)で操縦指令をゼロに戻す

---

## Anti-Patterns (Do NOT Use)

- ❌ **Light mode default** — 本プロダクトはダーク専用
- ❌ Slow updates / 遅延した状態表示(接続状態・指令値は即時反映)
- ❌ **Emojis as icons** — SVG アイコン(Lucide)を使う
- ❌ **Missing cursor:pointer** — クリック可能要素には必須(非クリック要素には付けない)
- ❌ **Layout-shifting hovers** — レイアウトをずらす scale 変形禁止
- ❌ **Low contrast text** — ダーク背景上で 4.5:1 未満のテキスト禁止
- ❌ **Instant state changes** — 150–300ms のトランジションを入れる
- ❌ **Invisible focus states** — キーボード操作前提のため特に厳守

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use Lucide SVG instead)
- [ ] All icons from Lucide with consistent sizing
- [ ] `cursor-pointer` on all clickable elements (and **not** on non-clickable panels)
- [ ] Hover states with smooth transitions (150–300ms)
- [ ] Text contrast 4.5:1 minimum **on dark surfaces** (#020617 / #0F172A)
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected (pulse / glow animations stop)
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] Status is conveyed by label + color (never color alone)
- [ ] Numeric readouts use `tabular-nums` (no width jitter)
