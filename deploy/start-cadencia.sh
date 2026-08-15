#!/usr/bin/env bash

set -Eeuo pipefail

BASE="/opt/cadencia"
PID_FILE="/var/run/supervisord.pid"
PGDATA="/var/lib/postgresql/16/main"

preservar_lock_obsoleto() {
  local lock_path="$1"
  local runtime_backup="$BASE/shared/stale-runtime"

  [[ -f "$lock_path" ]] || return 0

  local lock_pid=""
  lock_pid="$(sed -n '1p' "$lock_path" | tr -cd '0-9')"
  if [[ -n "$lock_pid" && -r "/proc/$lock_pid/cmdline" ]] \
    && tr '\0' ' ' < "/proc/$lock_pid/cmdline" | grep -q '/postgres'; then
    echo "Lock do PostgreSQL pertence a um processo ativo: $lock_path" >&2
    return 1
  fi

  install -d -m 0700 "$runtime_backup"
  mv "$lock_path" "$runtime_backup/$(basename "$lock_path").$(date +%Y%m%d%H%M%S)"
}

limpar_runtime_postgres_obsoleto() {
  if pgrep -x postgres >/dev/null 2>&1 \
    || /usr/lib/postgresql/16/bin/pg_isready -h 127.0.0.1 -p 5432 >/dev/null 2>&1; then
    return 0
  fi

  preservar_lock_obsoleto "$PGDATA/postmaster.pid"
  preservar_lock_obsoleto "/tmp/.s.PGSQL.5432.lock"

  if [[ -S "/tmp/.s.PGSQL.5432" ]]; then
    rm -- "/tmp/.s.PGSQL.5432"
  fi
}

if [[ -s "$PID_FILE" ]]; then
  SUPERVISOR_PID="$(tr -cd '0-9' < "$PID_FILE")"
  if [[ -n "$SUPERVISOR_PID" && -r "/proc/$SUPERVISOR_PID/cmdline" ]] \
    && tr '\0' ' ' < "/proc/$SUPERVISOR_PID/cmdline" | grep -q '/usr/bin/supervisord'; then
    exit 0
  fi
fi

limpar_runtime_postgres_obsoleto
rm -f /var/run/supervisor.sock "$PID_FILE"
exec /usr/bin/supervisord -c /etc/supervisor/supervisord.conf
