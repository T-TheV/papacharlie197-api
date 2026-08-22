#!/usr/bin/env bash

set -Eeuo pipefail

BASE="/opt/cadencia"
API_REPOSITORIO="https://github.com/T-TheV/papacharlie197-api.git"
API_BRANCH="deploy"
WEB_REPOSITORIO="https://github.com/T-TheV/papacharlie197-web.git"
WEB_BRANCH="deploy"
ESTADO_BACKEND="$BASE/shared/backend.sha"
ESTADO_FRONTEND="$BASE/shared/frontend.sha"
LOCK="$BASE/shared/deploy.lock"
TEMPORARIO=""

if [[ "$BASE" != "/opt/cadencia" ]]; then
  echo "Diretório-base inesperado; deploy cancelado." >&2
  exit 1
fi

exec 9>"$LOCK"
flock -n 9 || exit 0

limpar_temporario() {
  if [[ -n "$TEMPORARIO" && "$TEMPORARIO" == "$BASE/tmp/"* && -d "$TEMPORARIO" ]]; then
    rm -rf -- "$TEMPORARIO"
  fi
}
trap limpar_temporario EXIT

sha_remoto() {
  local repositorio="$1"
  local branch="${2:-main}"
  git ls-remote "$repositorio" "refs/heads/$branch" | awk 'NR == 1 { print $1 }'
}

sha_salvo() {
  [[ -f "$1" ]] && tr -d '[:space:]' < "$1" || true
}

aguardar_backend() {
  for _ in $(seq 1 30); do
    if curl -fsS --max-time 3 http://127.0.0.1:3333/api/health >/dev/null; then
      return 0
    fi
    sleep 1
  done
  return 1
}

reiniciar_backend() {
  local pid_file="$BASE/shared/backend.pid"
  local pid=""

  [[ -s "$pid_file" ]] || return 0
  pid="$(tr -cd '0-9' < "$pid_file")"

  if [[ -n "$pid" && -r "/proc/$pid/exe" ]] \
    && [[ "$(readlink -f "/proc/$pid/exe")" == /opt/node-*/bin/node ]]; then
    kill "$pid"
  fi
}

guardar_backup_banco() {
  local env_file="$BASE/shared/backend.env"
  [[ -f "$env_file" ]] || return 0

  set -a
  # shellcheck disable=SC1090
  source "$env_file"
  set +a

  if PGPASSWORD="$DB_PASSWORD" pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
    local arquivo="$BASE/shared/backups/cadencia-$(date +%Y%m%d-%H%M%S).dump"
    PGPASSWORD="$DB_PASSWORD" pg_dump \
      --format=custom \
      --no-owner \
      --no-privileges \
      --host="$DB_HOST" \
      --port="$DB_PORT" \
      --username="$DB_USER" \
      --file="$arquivo" \
      "$DB_NAME"
    find "$BASE/shared/backups" -maxdepth 1 -type f -name 'cadencia-*.dump' -printf '%T@ %p\n' \
      | sort -rn \
      | tail -n +8 \
      | cut -d' ' -f2- \
      | while IFS= read -r antigo; do
          [[ "$antigo" == "$BASE/shared/backups/"* ]] && rm -f -- "$antigo"
        done
  fi
}

publicar_backend() {
  local sha="$1"
  local release="$BASE/releases/backend/$sha"
  local anterior=""
  [[ -L "$BASE/releases/backend/current" ]] && anterior="$(readlink -f "$BASE/releases/backend/current")"

  if [[ ! -d "$release" ]]; then
    TEMPORARIO="$BASE/tmp/backend-$sha-$$"
    git clone --quiet --depth 1 --branch "$API_BRANCH" "$API_REPOSITORIO" "$TEMPORARIO"

    if [[ ! -f "$TEMPORARIO/backend.tar.gz" ]]; then
      echo "Artefato do backend inválido: backend.tar.gz ausente." >&2
      exit 1
    fi

    install -d -m 0755 "$TEMPORARIO/release"
    tar -xzf "$TEMPORARIO/backend.tar.gz" -C "$TEMPORARIO/release"

    if [[ ! -f "$TEMPORARIO/release/package.json" \
      || ! -x "$TEMPORARIO/release/node_modules/.bin/sequelize-cli" ]]; then
      echo "Artefato do backend inválido: aplicação ou dependências ausentes." >&2
      exit 1
    fi

    ln -sfn "$BASE/shared/backend.env" "$TEMPORARIO/release/.env"
    if [[ "$TEMPORARIO" != "$BASE/tmp/backend-"* ]]; then
      echo "Diretório temporário inesperado; vínculo de uploads cancelado." >&2
      exit 1
    fi
    rm -rf -- "$TEMPORARIO/release/uploads"
    ln -s "$BASE/shared/uploads" "$TEMPORARIO/release/uploads"

    (
      cd "$TEMPORARIO/release"
      guardar_backup_banco
      set -a
      # shellcheck disable=SC1090
      source "$BASE/shared/backend.env"
      set +a
      NODE_ENV=production ./node_modules/.bin/sequelize-cli db:migrate
    )

    mv "$TEMPORARIO/release" "$release"
    rm -rf -- "$TEMPORARIO"
    TEMPORARIO=""
  fi

  ln -sfn "$release" "$BASE/releases/backend/current"
  reiniciar_backend

  if ! aguardar_backend; then
    echo "O novo backend não respondeu ao health check; restaurando release anterior." >&2
    if [[ -n "$anterior" && -d "$anterior" ]]; then
      ln -sfn "$anterior" "$BASE/releases/backend/current"
      reiniciar_backend || true
    fi
    return 1
  fi

  printf '%s\n' "$sha" > "$ESTADO_BACKEND"
}

publicar_frontend() {
  local sha="$1"
  local release="$BASE/releases/frontend/$sha"

  if [[ ! -d "$release" ]]; then
    TEMPORARIO="$BASE/tmp/frontend-$sha-$$"
    git clone --quiet --depth 1 --branch "$WEB_BRANCH" "$WEB_REPOSITORIO" "$TEMPORARIO"

    if [[ ! -f "$TEMPORARIO/index.html" ]]; then
      echo "Artefato do frontend inválido: index.html ausente." >&2
      exit 1
    fi

    rm -rf -- "$TEMPORARIO/.git"
    mv "$TEMPORARIO" "$release"
    TEMPORARIO=""
  fi

  ln -sfn "$release" "$BASE/releases/frontend/current"
  printf '%s\n' "$sha" > "$ESTADO_FRONTEND"
}

limpar_releases_antigas() {
  local tipo="$1"
  local diretorio="$BASE/releases/$tipo"
  find "$diretorio" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' \
    | sort -rn \
    | tail -n +4 \
    | cut -d' ' -f2- \
    | while IFS= read -r antigo; do
        [[ "$antigo" == "$diretorio/"* ]] && rm -rf -- "$antigo"
      done
}

SHA_BACKEND="$(sha_remoto "$API_REPOSITORIO" "$API_BRANCH")"
SHA_FRONTEND="$(sha_remoto "$WEB_REPOSITORIO" "$WEB_BRANCH")"

if [[ -z "$SHA_BACKEND" || -z "$SHA_FRONTEND" ]]; then
  echo "Não foi possível consultar as versões publicadas dos repositórios." >&2
  exit 1
fi

if [[ "$SHA_BACKEND" != "$(sha_salvo "$ESTADO_BACKEND")" ]]; then
  publicar_backend "$SHA_BACKEND"
fi

if [[ "$SHA_FRONTEND" != "$(sha_salvo "$ESTADO_FRONTEND")" ]]; then
  publicar_frontend "$SHA_FRONTEND"
fi

limpar_releases_antigas backend
limpar_releases_antigas frontend
