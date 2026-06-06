# kuas-mechlab3-cockpit

KUAS 機械工学実験3 向けのテレメトリ監視ダッシュボード(cockpit)。
モーター実験の計測値(回転数・トルク・温度・電流)をリアルタイム表示する。

## 技術スタック

| 区分          | 採用技術                                                                           |
| ------------- | ---------------------------------------------------------------------------------- |
| ビルド        | Vite + React 19 + TypeScript(厳格設定・`any` 禁止)                                 |
| UI            | Tailwind CSS v4 + shadcn/ui(Dark Mode ファースト)                                  |
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

## ディレクトリ構造(feature-based)

```
src/
├── components/ui/        # shadcn/ui(ベンダーコード。lint 一部緩和)
├── lib/                  # 共有ユーティリティ
├── features/
│   └── telemetry/        # テレメトリ監視機能
│       ├── components/   # Container / Presentational + テスト + ストーリー
│       ├── hooks/        # useTelemetryMonitor(useSyncExternalStore ベース)
│       ├── lib/          # テレメトリソース(外部システム境界)
│       ├── logic/        # ビジネスロジック(純粋関数・カバレッジ100%対象)
│       ├── constants.ts
│       ├── types.ts
│       └── index.ts      # 公開 API
├── test/                 # テストセットアップ
└── App.tsx
```

## 実装規約

- **TDD(t-wada 式)**: Red → Green → Refactor。テストを先に書き、失敗を確認してから実装する
- **ビジネスロジックは純粋関数**: `features/*/logic/` に置き、単体テストでカバレッジを担保する
- **Container / Presentational パターン**:
    - Presentational は props のみに依存し、スナップショットテスト可能にする
    - 複雑なステートを扱うフックは Container へ**外部から注入**する(`useTelemetry` prop)
    - ダイアログ開閉やタブ切り替え等の単純な UI 状態のみコンポーネント内 `useState` 可
- **useEffect をステート管理に使わない**:
    - 派生値はレンダー中に純粋関数で計算する
    - 外部システムとの同期は `useSyncExternalStore` を第一候補とする
- **コミット**: Conventional Commits(commit-msg フックで強制)

## デザインシステム

`design-system/kuas-mechlab3-cockpit/MASTER.md` を参照。
Dark Mode (OLED) / Blue (#1E40AF, #3B82F6) + Amber (#F59E0B) / Fira Sans + Fira Code。
テーマ変数は `src/index.css` の `:root` / `.dark` で定義。
