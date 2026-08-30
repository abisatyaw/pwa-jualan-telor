#!/usr/bin/env bash
# Deploy script for this application clone.
# Environment (production/testing) is derived from this file's own location.
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_NAME="$(basename "$APP_DIR")"

case "$APP_DIR" in
  /srv/apps/production/*) ENVIRONMENT="production" ;;
  /srv/apps/testing/*)    ENVIRONMENT="testing" ;;
  *) echo "FATAL: run this script from /srv/apps/<environment>/<app>" >&2; exit 1 ;;
esac

case "$APP_NAME:$ENVIRONMENT" in
  catering-tracker:production)        SERVICE="catering-production"; PORT=8000 ;;
  penjualan-telur-tracker:production) SERVICE="telur-production";     PORT=8001 ;;
  catering-tracker:testing)           SERVICE="catering-testing";     PORT=3000 ;;
  penjualan-telur-tracker:testing)    SERVICE="telur-testing";        PORT=3001 ;;
  *) echo "FATAL: no port/service allocation for $APP_NAME ($ENVIRONMENT)" >&2; exit 1 ;;
esac

EXPECTED_BRANCH="$([ "$ENVIRONMENT" = "production" ] && echo main || echo dev)"

log() { echo "[deploy] $*"; }
fail() { echo "[deploy] FATAL: $*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] && fail "do not run as root"
[ -f "$APP_DIR/.env" ] || fail ".env missing in $APP_DIR"
[ -d "$APP_DIR/.venv" ] || fail ".venv missing in $APP_DIR"

# The systemd unit gets DATABASE_URL via EnvironmentFile=.env; the migration step
# below runs outside systemd, so pull the same value in here. Without it, alembic
# falls back to the default sqlite path (backend/app.db) and migrates the wrong
# database while the running service keeps using the real one.
# Parsed narrowly (not `source`d): .env is a systemd env-file, not a shell script.
DB_URL="$(sed -n 's/^[[:space:]]*DATABASE_URL=//p' "$APP_DIR/.env" | tail -n1)"
DB_URL="${DB_URL%\"}"; DB_URL="${DB_URL#\"}"
DB_URL="${DB_URL%\'}"; DB_URL="${DB_URL#\'}"
if [ -n "$DB_URL" ]; then
  export DATABASE_URL="$DB_URL"
  log "database: $DATABASE_URL (from .env)"
else
  log "database: no DATABASE_URL in .env, using app default (backend/app.db)"
fi

CURRENT_BRANCH="$(git -C "$APP_DIR" rev-parse --abbrev-ref HEAD)"
[ "$CURRENT_BRANCH" = "$EXPECTED_BRANCH" ] || fail "branch '$CURRENT_BRANCH' does not match expected '$EXPECTED_BRANCH' for $ENVIRONMENT"

log "=== deploying $APP_NAME [$ENVIRONMENT] branch=$CURRENT_BRANCH service=$SERVICE port=$PORT"

log "1/8 updating source"
git -C "$APP_DIR" fetch --prune origin || fail "git fetch failed - not touching the running service"
if git -C "$APP_DIR" ls-remote --exit-code --heads origin "$CURRENT_BRANCH" >/dev/null 2>&1; then
  git -C "$APP_DIR" pull --ff-only origin "$CURRENT_BRANCH" || fail "git pull failed (diverged?) - not touching the running service"
else
  log "branch '$CURRENT_BRANCH' not on origin yet - using current local checkout"
fi

log "2/8 python dependencies"
"$APP_DIR/.venv/bin/pip" install -q -r "$APP_DIR/backend/requirements.txt" || fail "pip install failed - not restarting"

log "3/8 database migrations"
cd "$APP_DIR/backend"
"$APP_DIR/.venv/bin/python" scripts/bootstrap_alembic.py || fail "alembic bootstrap failed - not restarting"
"$APP_DIR/.venv/bin/python" -m alembic upgrade head || fail "alembic upgrade failed - not restarting"
cd "$APP_DIR"

log "4/8 frontend dependencies"
cd "$APP_DIR/frontend"
npm ci --silent || fail "npm ci failed - not restarting"

log "5/8 building frontend"
npm run build --silent || fail "frontend build failed - not restarting"

log "6/8 validating build"
[ -s "$APP_DIR/frontend/dist/index.html" ] || fail "dist/index.html missing or empty - not restarting"

log "7/8 restarting $SERVICE"
sudo systemctl restart "$SERVICE.service"

log "8/8 health check"
HEALTH_OK=""
for i in $(seq 1 15); do
  sleep 2
  BODY="$(curl -s -m 3 "http://127.0.0.1:${PORT}/health" || true)"
  if [ "$BODY" = '{"status":"ok"}' ]; then HEALTH_OK=yes; break; fi
done
[ -n "$HEALTH_OK" ] || fail "health check did not pass within 30s - inspect: journalctl -u $SERVICE -n 100"

log "SUCCESS: $APP_NAME [$ENVIRONMENT] deployed, $SERVICE healthy on port $PORT"
