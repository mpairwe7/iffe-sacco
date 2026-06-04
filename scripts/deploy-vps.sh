#!/usr/bin/env bash
#
# Deploy IFFE SACCO to the self-hosted VPS.
#
# Invoked over SSH by .github/workflows/deploy.yml after the GHA
# runner has rsync'd the latest checkout into /home/iffe/IFFE. The
# .env.production files for both apps already live on the VPS and
# are never overwritten by the rsync.
#
# Runs as the `iffe` user. `systemctl restart` is permitted without
# a password via /etc/sudoers.d/iffe-restart.
#
set -euo pipefail

REPO="${REPO:-$HOME/IFFE}"
export PATH="$HOME/.bun/bin:/usr/bin:/usr/local/bin:$PATH"

log() { printf '\n\033[1;34m==>\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31m!!  %s\033[0m\n' "$*" >&2; exit 1; }

cd "$REPO" || fail "REPO not found at $REPO"

log "Installing workspace dependencies (frozen lockfile)"
bun install --frozen-lockfile

log "Generating Prisma client"
( cd apps/api && bunx prisma generate )

log "Applying database migrations"
(
  cd apps/api
  # shellcheck disable=SC1091
  set -a; . ./.env.production; set +a
  bunx prisma migrate deploy
)

log "Building Next.js"
(
  cd apps/web
  # shellcheck disable=SC1091
  set -a; . ./.env.production; set +a
  bunx next build
)

log "Restarting services"
sudo -n /bin/systemctl restart iffe-api
sudo -n /bin/systemctl restart iffe-web

log "Health probe"
# The API can take longer than a few seconds to bind :4000 after a cold restart
# (fresh Bun + Prisma client init), so poll for up to ~60s and exit the moment
# it's healthy — a fast restart still finishes in a couple of seconds.
attempts=30
for i in $(seq 1 "$attempts"); do
  if curl -fsS -m 3 http://127.0.0.1:4000/api/v1/health >/dev/null; then
    curl -fsS http://127.0.0.1:4000/api/v1/health; echo
    break
  fi
  [ "$i" = "$attempts" ] && fail "API never came back healthy after restart (~60s)"
  sleep 2
done

log "Deploy complete"
