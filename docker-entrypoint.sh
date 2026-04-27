#!/bin/sh
# Antes de subir o Node: remove locks órfãos do Chromium no perfil (Azure Files / reinício do pod).
# O Puppeteer falha com "browser is already running" se esses ficheiros sobreviverem no volume.
set -e
AUTH="${AUTH_PATH:-/app/.wwebjs_auth}"
SESSION="${AUTH}/session"
SEED="${AUTH}/_seed_session"

# EmptyDir em session/ mantem ficheiros no restart do contentor; novo upload grava .seed-bump e forca nova copia.
if [ -d "$SEED" ] && [ -n "$(ls -A "$SEED" 2>/dev/null)" ]; then
  mkdir -p "$SESSION" || true
  bump_seed=""
  bump_sess=""
  if [ -f "$SEED/.seed-bump" ]; then
    bump_seed=$(cat "$SEED/.seed-bump" 2>/dev/null || true)
  fi
  if [ -f "$SESSION/.seed-bump" ]; then
    bump_sess=$(cat "$SESSION/.seed-bump" 2>/dev/null || true)
  fi
  need_copy=false
  if [ -z "$(ls -A "$SESSION" 2>/dev/null)" ]; then
    need_copy=true
  elif [ -n "$bump_seed" ] && [ "$bump_seed" != "$bump_sess" ]; then
    need_copy=true
  fi
  if [ "$need_copy" = true ]; then
    find "$SESSION" -mindepth 1 -delete 2>/dev/null || true
    mkdir -p "$SESSION"
    cp -a "$SEED"/. "$SESSION"/ 2>/dev/null || true
    echo "docker-entrypoint: _seed_session aplicado ao EmptyDir session/ (vazio ou .seed-bump novo)."
  fi
fi

clean_locks() {
  dir="$1"
  if [ ! -d "$dir" ]; then
    return 0
  fi
  chmod -R u+w "$dir" 2>/dev/null || true
  # ! -type d: remove ficheiros, symlinks e sockets (SingletonSocket); -type f -o -type l falhava em sockets Unix.
  find "$dir" -maxdepth 15 \( \
    -name SingletonLock -o -name SingletonCookie -o -name SingletonSocket -o -name DevToolsActivePort \
  \) ! -type d -exec rm -f {} + 2>/dev/null || true
}

# Azure Files (SMB): locks na raiz do userDataDir falham por vezes só com find; rm explícito costuma bastar.
rm_singleton_root() {
  dir="$1"
  if [ ! -d "$dir" ]; then
    return 0
  fi
  chmod -R u+w "$dir" 2>/dev/null || true
  for f in SingletonLock SingletonCookie SingletonSocket DevToolsActivePort lockfile; do
    rm -f "$dir/$f" 2>/dev/null || true
  done
}

clean_locks "$SESSION"
rm_singleton_root "$SESSION"
clean_locks "$SESSION"
rm_singleton_root "$SESSION"
clean_locks "/app/.wwebjs_auth/session"
rm_singleton_root "/app/.wwebjs_auth/session"

sync 2>/dev/null || true
sleep 1

exec "$@"
