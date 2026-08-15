#!/usr/bin/env bash

set -u

SSHD_PATTERN='^sshd: /usr/sbin/sshd \[listener\]'
SUPERVISOR_PATTERN='^/usr/bin/python3 /usr/bin/supervisord -c /etc/supervisor/supervisord.conf$'

iniciar_sshd() {
  if pgrep -f "$SSHD_PATTERN" >/dev/null 2>&1; then
    return 0
  fi

  install -d -m 0755 /run/sshd
  /usr/sbin/sshd
}

iniciar_cadencia() {
  if pgrep -f "$SUPERVISOR_PATTERN" >/dev/null 2>&1; then
    return 0
  fi

  /opt/cadencia/bin/start-cadencia.sh
}

while true; do
  iniciar_sshd || true
  iniciar_cadencia || true
  sleep 60
done
