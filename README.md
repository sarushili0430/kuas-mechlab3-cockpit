# kuas-mechlab3-cockpit

[KUAS MechLab3 (ML3)](https://github.com/sarushili0430/kuas-mechlab3) ―
4輪スキッドステアロボットの**遠隔操縦コックピット**。
前後カメラの MJPEG 映像を見ながら、WebSocket 経由の WASD 操縦で機体を走らせる。

本体側のクライアント仕様は `kuas-mechlab3` リポジトリの `docs/teleop-client.md` が正本。

| チャネル                | 方向 | プロトコル                | 既定エンドポイント                |
| ----------------------- | ---- | ------------------------- | --------------------------------- |
| カメラ映像              | 受信 | HTTP / MJPEG              | `http://<pi>:8080/stream?topic=…` |
| 操縦指令 `{"vx","wz"}`  | 送信 | WebSocket(約20Hz連続送信) | `ws://<pi>:9001`                  |
| AI データ収集 開始/終了 | 送信 | HTTP / JSON               | `http://<pi>:9002/record/…`       |

## 使い方

1. ラズパイ側で `cameras_launch.py`(:8080)と `teleop_launch.py`(:9001)を起動する
2. このコックピットを開き、ヘッダーの**接続先ホスト**に Pi の IP を設定する(保存される)
3. **接続**を押し、画面にフォーカスして **W / A / S / D** で操縦する
   (キーを離すと停止。切断・無入力でも機体側のフェイルセーフで自動停止する)
4. **緊急停止**は停止指令を送って WebSocket を切断する
5. **AI データ収集**は操縦コンソールの **REC** で開始し、走行後に成功/失敗ラベルを選んで
   **保存して停止**(失敗走行は**破棄**)。Pi 側で `record_server`(:9002)が起動している前提
   (`kuas-mechlab3` の `start-all.sh` または `start-record-server.sh`)。API 仕様は本体側
   `docs/record-control.md` が正本

> HTTPS で配信すると `http://` の映像と `ws://` が混在コンテンツでブロックされるため、
> コックピットは `http://` 配信か `file://` で開くこと。

## 技術スタック

| 区分          | 採用技術                                                                           |
| ------------- | ---------------------------------------------------------------------------------- |
| ビルド        | Vite + React 19 + TypeScript(厳格設定・`any` 禁止)                                 |
| UI            | Tailwind CSS v4 + shadcn/ui(Dark Mode (OLED) 専用)                                 |
| 国際化        | 自前の軽量 i18n(React Context + `t()`・日本語 / 英語)                              |
| テスト        | Vitest(unit + Storybook browser tests)+ カバレッジ                                 |
| カタログ      | Storybook(a11y / vitest アドオン付き)                                              |
| Lint / Format | ESLint(typescript-eslint strict-type-checked)/ Prettier(セミコロンなし・スペース4) |
| Git hooks     | lefthook(pre-commit: lint + format + test、commit-msg: commitlint)                 |
| CI            | GitHub Actions(lint / test+coverage / build)                                       |

## セットアップ

```sh
pnpm install                            # 依存インストール(lefthook も自動で有効化される)
pnpm exec playwright install chromium   # Storybook テスト用(初回のみ)
```

## 主なコマンド

```sh
pnpm dev                # 開発サーバー
pnpm storybook          # Storybook (port 6006)
pnpm test               # 全テスト(unit + storybook)
pnpm test:watch         # ウォッチモード
pnpm test:coverage      # カバレッジ付きテスト
pnpm lint               # ESLint
pnpm format             # Prettier(書き込み)
pnpm build              # 型チェック + 本番ビルド
```

機体なしで操縦フローを確認するには Storybook の
`Cockpit/CockpitScreenContainer → Demo`(常に接続に成功するデモソケット)を使う。

## ディレクトリ構造(feature-based)

```
src/
├── components/ui/        # shadcn/ui(ベンダーコード。lint 一部緩和)
├── lib/                  # 共有ユーティリティ
├── i18n/                 # 多言語対応(日本語 / 英語)
│   ├── logic/            # 文字列補間・初期言語の解決(純粋関数)
│   ├── lib/              # 表示言語の localStorage 永続化
│   └── components/       # LanguageSwitcher(言語切替トグル)
├── features/
│   ├── teleop/           # 操縦チャネル(WebSocket)
│   │   ├── logic/        # キー集合→正規化軸の純粋関数(REP-103)
│   │   ├── lib/          # teleopClient(20Hz送信・自動再接続)/ keyboardInput
│   │   ├── hooks/        # useTeleop(useSyncExternalStore ベース)
│   │   └── components/   # ConnectionBadge / DriveKeypad / AxesIndicator
│   ├── camera/           # 映像チャネル(MJPEG)
│   │   ├── logic/        # ストリーム URL 組み立て
│   │   └── components/   # CameraFeed(LIVE / NO SIGNAL / 再試行)
│   └── cockpit/          # 画面の組み立て
│       ├── logic/        # 接続先ホストの正規化・初期値解決
│       ├── lib/          # ホスト設定の localStorage 永続化
│       └── components/   # CockpitScreen(Presentational)+ Container
├── test/                 # テストセットアップ
└── App.tsx
```

## 実装規約

- **TDD(t-wada 式)**: Red → Green → Refactor。テストを先に書き、失敗を確認してから実装する
- **ビジネスロジックは純粋関数**: `features/*/logic/` に置き、単体テストでカバレッジを担保する
- **Container / Presentational パターン**:
    - Presentational は props のみに依存し、スナップショットテスト可能にする
    - 複雑なステートを扱うフックは Container へ**外部から注入**する(`useTeleopSnapshot` prop)
    - ダイアログ開閉や1フィールドフォーム等の単純な UI 状態のみコンポーネント内 `useState` 可
- **useEffect をステート管理に使わない**:
    - 派生値はレンダー中に純粋関数で計算する
    - 外部システムとの同期は `useSyncExternalStore` を第一候補とする
    - useEffect は外部システム同士の配線・ライフサイクル(キーボード購読、`pagehide`)に限る
- **ユーザー向け文字列は i18n 経由**: 画面に出す文言は `src/i18n` の `useTranslation()` が返す `t()` で解決する。
  新しいキーは `translations.ts` の `ja`(正本)に追加し、`en` も同時に埋める(欠落は型エラーになる)
- **コミット**: Conventional Commits(commit-msg フックで強制)

## デザインシステム

`design-system/kuas-mechlab3-cockpit/MASTER.md`(全体)と
`design-system/kuas-mechlab3-cockpit/pages/cockpit.md`(操縦画面)を参照。
Dark Mode (OLED) 専用・Mission Control Grid。
Blue = データ / Amber = CTA / Green = 接続 / Red = 危険。Fira Sans + Fira Code。
テーマ変数は `src/index.css` で定義(`html.dark` を常時付与)。
