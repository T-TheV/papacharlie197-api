#!/usr/bin/env bash

set -Eeuo pipefail

PID_FILE="/var/run/supervisord.pid"

if [[ -s "$PID_FILE" ]]; then
  SUPERVISOR_PID="$(tr -cd '0-9' < "$PID_FILE")"
  if [[ -n "$SUPERVISOR_PID" && -r "/proc/$SUPERVISOR_PID/cmdline" ]] \
    && tr '\0' ' ' < "/proc/$SUPERVISOR_PID/cmdline" | grep -q '/usr/bin/supervisord'; then
    exit 0
  fi
fi

rm -f /var/run/supervisor.sock "$PID_FILE"
exec /usr/bin/supervisord -c /etc/supervisor/supervisord.conf
