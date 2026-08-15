#!/usr/bin/env bash

set -u

while true; do
  /opt/cadencia/bin/deploy-once.sh || true
  sleep 60
done
