#!/usr/bin/env bash
#
# deploy-raspi.sh - ラズパイ上で kuas-mechlab3-cockpit を「一発で」立ち上げる。
#
#   依存インストール → 本番ビルド → http 配信 をまとめて実行する。
#   コックピットは静的 SPA なので、ビルドした dist/ を http で配信するだけでよい。
#   (README のとおり mixed content を避けるため必ず http:// 配信)
#
# 使い方:
#   ./scripts/deploy-raspi.sh                 # ビルドして配信(フォアグラウンド)
#   ./scripts/deploy-raspi.sh --service       # systemd 登録して常時起動&自動起動
#   ./scripts/deploy-raspi.sh --build-only     # ビルドのみ(配信しない)
#   ./scripts/deploy-raspi.sh --no-install     # 依存の再インストールをスキップ
#
# 環境変数で上書き可:
#   HOST  配信バインドアドレス (既定: 0.0.0.0 = LAN 全体に公開)
#   PORT  配信ポート           (既定: 8000  ※ 8080=カメラ / 9001=操縦 と衝突回避)
#
set -euo pipefail

# --- リポジトリルートへ移動 ---------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_DIR"

# --- 設定 ---------------------------------------------------------------------
HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-8000}"
DO_INSTALL=1
DO_SERVE=1
DO_SERVICE=0

for arg in "$@"; do
    case "$arg" in
        --service)    DO_SERVICE=1 ;;
        --build-only) DO_SERVE=0 ;;
        --no-install) DO_INSTALL=0 ;;
        -h|--help)
            sed -n '2,20p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
            exit 0 ;;
        *)
            echo "不明な引数: $arg (--help 参照)" >&2
            exit 2 ;;
    esac
done

log()  { printf '\033[1;36m[deploy]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[warn]\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31m[error]\033[0m %s\n' "$*" >&2; exit 1; }

# --- Node の確認 / 導入 -------------------------------------------------------
ensure_node() {
    if command -v node >/dev/null 2>&1; then
        log "Node $(node -v) を検出"
        return
    fi
    warn "Node.js が見つかりません。NodeSource 経由でインストールを試みます。"
    command -v apt-get >/dev/null 2>&1 || die "apt-get が無い環境では Node を自動導入できません。手動で Node 20+ を入れてください。"
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
    log "Node $(node -v) を導入しました"
}

# --- pnpm の確認 / 有効化 -----------------------------------------------------
ensure_pnpm() {
    if command -v pnpm >/dev/null 2>&1; then
        log "pnpm $(pnpm -v) を検出"
        return
    fi
    log "corepack で pnpm を有効化します"
    corepack enable >/dev/null 2>&1 || sudo corepack enable
    corepack prepare pnpm@11.5.2 --activate
    command -v pnpm >/dev/null 2>&1 || die "pnpm の有効化に失敗しました"
    log "pnpm $(pnpm -v) を有効化しました"
}

# --- 依存インストール ---------------------------------------------------------
install_deps() {
    [ "$DO_INSTALL" -eq 1 ] || { log "依存インストールをスキップ"; return; }
    log "依存をインストールします (pnpm install --frozen-lockfile)"
    pnpm install --frozen-lockfile
}

# --- 本番ビルド ---------------------------------------------------------------
build() {
    log "本番ビルドします (pnpm build)"
    pnpm build
    [ -f dist/index.html ] || die "ビルド成果物 dist/index.html が見つかりません"
    log "ビルド完了: $REPO_DIR/dist"
}

# --- 配信 ---------------------------------------------------------------------
serve() {
    [ "$DO_SERVE" -eq 1 ] || { log "配信はスキップ (--build-only)"; return; }
    local ip
    ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
    log "コックピットを配信します: http://${ip:-<pi-ip>}:${PORT}/"
    log "停止は Ctrl-C。常時起動には --service を使ってください。"
    exec pnpm exec vite preview --host "$HOST" --port "$PORT" --strictPort
}

# --- systemd サービス登録 -----------------------------------------------------
install_service() {
    command -v systemctl >/dev/null 2>&1 || die "systemd が無い環境では --service を使えません"
    local user unit node_bin pnpm_bin
    user="$(id -un)"
    unit="/etc/systemd/system/ml3-cockpit.service"
    node_bin="$(command -v node)"
    pnpm_bin="$(command -v pnpm)"

    log "systemd ユニットを作成: $unit"
    sudo tee "$unit" >/dev/null <<EOF
[Unit]
Description=KUAS MechLab3 Cockpit (static http server)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$user
WorkingDirectory=$REPO_DIR
Environment=PATH=$(dirname "$node_bin"):/usr/local/bin:/usr/bin:/bin
Environment=HOST=$HOST
Environment=PORT=$PORT
ExecStart=$pnpm_bin exec vite preview --host $HOST --port $PORT --strictPort
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable --now ml3-cockpit.service
    local ip
    ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
    log "サービス起動完了: http://${ip:-<pi-ip>}:${PORT}/"
    log "状態確認: sudo systemctl status ml3-cockpit"
    log "ログ:     journalctl -u ml3-cockpit -f"
}

# --- メイン -------------------------------------------------------------------
main() {
    log "kuas-mechlab3-cockpit をラズパイへ展開します (HOST=$HOST PORT=$PORT)"
    ensure_node
    ensure_pnpm
    install_deps
    build
    if [ "$DO_SERVICE" -eq 1 ]; then
        install_service
    else
        serve
    fi
}

main
