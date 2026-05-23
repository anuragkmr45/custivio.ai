#!/usr/bin/env bash
set -euo pipefail

APP_USER="${APP_USER:-inventory}"
APP_ROOT="${APP_ROOT:-/opt/custivio}"
ETC_ROOT="${ETC_ROOT:-/etc/custivio}"
LOG_ROOT="${LOG_ROOT:-/var/log/custivio}"

if ! id "$APP_USER" >/dev/null 2>&1; then
  useradd --system --home "$APP_ROOT" --shell /usr/sbin/nologin "$APP_USER"
fi

install -d -o root -g "$APP_USER" -m 0755 "$APP_ROOT" "$APP_ROOT/releases" "$APP_ROOT/tools"
install -d -o "$APP_USER" -g "$APP_USER" -m 0750 "$APP_ROOT/shared" "$APP_ROOT/shared/tmp" "$APP_ROOT/shared/uploads-tmp" "$APP_ROOT/shared/runtime"
install -d -o root -g "$APP_USER" -m 0750 "$ETC_ROOT"
install -d -o root -g adm -m 0755 "$LOG_ROOT" "$LOG_ROOT/reverse-proxy" "$LOG_ROOT/deployment"

if [ ! -f "$ETC_ROOT/custivio.env" ]; then
  install -o root -g "$APP_USER" -m 0640 custivio-app.env.example "$ETC_ROOT/custivio.env"
  echo "Created $ETC_ROOT/custivio.env from example. Edit placeholders before starting services."
fi

install -o root -g root -m 0644 systemd/custivio-api.service /etc/systemd/system/custivio-api.service
install -o root -g root -m 0644 systemd/custivio-worker.service /etc/systemd/system/custivio-worker.service
install -o root -g "$APP_USER" -m 0755 deploy-release.sh "$APP_ROOT/tools/deploy-release.sh"
install -o root -g "$APP_USER" -m 0755 rollback-release.sh "$APP_ROOT/tools/rollback-release.sh"
install -o root -g "$APP_USER" -m 0755 verify-app.sh "$APP_ROOT/tools/verify-app.sh"
install -o root -g "$APP_USER" -m 0755 smoke-api.sh "$APP_ROOT/tools/smoke-api.sh"
systemctl daemon-reload

echo "App LXC base installed. Active release: $(readlink -f "$APP_ROOT/current" 2>/dev/null || echo none)"
