#!/bin/sh
# Antes de subir o Node: remove locks órfãos do Chromium no perfil (Azure Files / reinício do pod).
# O Puppeteer falha com "browser is already running" se esses ficheiros sobreviverem no volume.
set -e
AUTH="${AUTH_PATH:-/app/.wwebjs_auth}"
SESSION="${AUTH}/session"

clean_locks() {
  dir="$1"
  if [ ! -d "$dir" ]; then
    return 0
  fi
  find "$dir" -maxdepth 10 \( \
    -name SingletonLock -o -name SingletonCookie -o -name SingletonSocket -o -name DevToolsActivePort \
  \) \( -type f -o -type l \) -delete 2>/dev/null || true
}

clean_locks "$SESSION"
clean_locks "/app/.wwebjs_auth/session"

exec "$@"
