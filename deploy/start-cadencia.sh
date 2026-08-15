#!/usr/bin/env bash

set -Eeuo pipefail

if supervisorctl status >/dev/null 2>&1; then
  exit 0
fi

rm -f /var/run/supervisor.sock /var/run/supervisord.pid
exec /usr/bin/supervisord -c /etc/supervisor/supervisord.conf
