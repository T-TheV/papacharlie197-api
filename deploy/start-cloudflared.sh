#!/usr/bin/env bash

set -Eeuo pipefail

TOKEN_FILE="/opt/cadencia/shared/cloudflared.token"

if [[ ! -s "$TOKEN_FILE" ]]; then
  echo "Token do Cloudflare Tunnel ausente em $TOKEN_FILE" >&2
  sleep 30
  exit 1
fi

exec /usr/bin/cloudflared tunnel --no-autoupdate run --token-file "$TOKEN_FILE"
