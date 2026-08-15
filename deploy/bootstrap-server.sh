#!/usr/bin/env bash

set -Eeuo pipefail

BASE="/opt/cadencia"
PGDATA="/var/lib/postgresql/16/main"
PG_SHIM="$BASE/libproot-pg-owner.so"
ENV_FILE="$BASE/shared/backend.env"

if [[ "$BASE" != "/opt/cadencia" || ! -f "$PG_SHIM" || ! -d "$PGDATA" ]]; then
  echo "Pré-requisitos do servidor não encontrados." >&2
  exit 1
fi

install -d -m 0755 \
  "$BASE/bin" \
  "$BASE/releases/backend" \
  "$BASE/releases/frontend" \
  "$BASE/shared/backups" \
  "$BASE/shared/uploads" \
  "$BASE/tmp"

if [[ ! -s "$ENV_FILE" ]]; then
  umask 077
  DB_PASSWORD="$(openssl rand -hex 24)"
  JWT_SEGREDO="$(openssl rand -hex 48)"
  printf '%s\n' \
    'NODE_ENV=production' \
    'PORTA=3333' \
    'DB_HOST=127.0.0.1' \
    'DB_PORT=5432' \
    'DB_NAME=cadencia' \
    'DB_USER=cadencia' \
    "DB_PASSWORD=$DB_PASSWORD" \
    "JWT_SEGREDO=$JWT_SEGREDO" \
    'JWT_EXPIRACAO=7d' \
    'CORS_ORIGENS=https://cadencia.yamasoftwares.app' \
    'GEMINI_API_KEY=' \
    'GEMINI_MODELO=gemini-2.5-flash' \
    > "$ENV_FILE"
  chmod 0600 "$ENV_FILE"
fi

if ! grep -q '^# Cadencia PRoot$' "$PGDATA/postgresql.conf"; then
  printf '%s\n' \
    '' \
    '# Cadencia PRoot' \
    "listen_addresses = '127.0.0.1'" \
    'port = 5432' \
    "unix_socket_directories = '/tmp'" \
    'shared_memory_type = mmap' \
    'dynamic_shared_memory_type = mmap' \
    'max_connections = 20' \
    'shared_buffers = 128MB' \
    'work_mem = 4MB' \
    'effective_cache_size = 512MB' \
    'password_encryption = scram-sha-256' \
    >> "$PGDATA/postgresql.conf"
fi

if ! pg_isready -h 127.0.0.1 -p 5432 >/dev/null 2>&1; then
  nohup env LD_PRELOAD="$PG_SHIM" \
    /usr/lib/postgresql/16/bin/postgres \
    -D "$PGDATA" \
    -c config_file="$PGDATA/postgresql.conf" \
    > "$BASE/shared/postgresql-bootstrap.log" 2>&1 &
  printf '%s\n' "$!" > "$BASE/shared/postgresql-bootstrap.pid"
fi

for _ in $(seq 1 30); do
  pg_isready -h 127.0.0.1 -p 5432 >/dev/null 2>&1 && break
  sleep 1
done

if ! pg_isready -h 127.0.0.1 -p 5432 >/dev/null 2>&1; then
  echo "PostgreSQL não iniciou; consulte postgresql-bootstrap.log." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

if ! psql -h /tmp -U postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname = 'cadencia'" | grep -q 1; then
  psql -h /tmp -U postgres -v ON_ERROR_STOP=1 \
    -c "CREATE ROLE cadencia LOGIN PASSWORD '$DB_PASSWORD'"
else
  psql -h /tmp -U postgres -v ON_ERROR_STOP=1 \
    -c "ALTER ROLE cadencia WITH LOGIN PASSWORD '$DB_PASSWORD'"
fi

if ! psql -h /tmp -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'cadencia'" | grep -q 1; then
  createdb -h /tmp -U postgres --owner=cadencia cadencia
fi

echo "Bootstrap do Cadência concluído."
