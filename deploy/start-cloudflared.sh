#!/usr/bin/env bash

set -Eeuo pipefail

CONFIG_FILE="/etc/cloudflared/config.yml"

if [[ ! -s "$CONFIG_FILE" ]]; then
  echo "Configuração do Cloudflare Tunnel ausente em $CONFIG_FILE" >&2
  sleep 30
  exit 1
fi

exec /usr/bin/cloudflared tunnel --config "$CONFIG_FILE" --no-autoupdate run
