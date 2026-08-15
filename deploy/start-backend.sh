#!/usr/bin/env bash

set -Eeuo pipefail

ARQUIVO_AMBIENTE="/opt/cadencia/shared/backend.env"
DIRETORIO_ATUAL="/opt/cadencia/releases/backend/current"

if [[ ! -f "$ARQUIVO_AMBIENTE" ]]; then
  echo "Arquivo de ambiente ausente: $ARQUIVO_AMBIENTE" >&2
  exit 1
fi

if [[ ! -d "$DIRETORIO_ATUAL" ]]; then
  echo "Release do backend ainda não publicada." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ARQUIVO_AMBIENTE"
set +a

cd "$DIRETORIO_ATUAL"
exec /usr/local/bin/node index.js
