#!/usr/bin/env bash
# Shortcut — gọi deploy/deploy.sh
exec "$(dirname "$0")/deploy/deploy.sh" "$@"
