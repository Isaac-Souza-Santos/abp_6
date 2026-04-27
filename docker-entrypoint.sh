#!/bin/sh
# Remove locks órfãos do Chromium antes do Node.
#
# Azure Files (SMB): o Chromium não suporta userDataDir em SMB ("browser is already running").
# Copiamos TODA a pasta .wwebjs_auth do volume para /tmp, exportamos AUTH_PATH=/tmp/... para o Node,
# e ao SIGTERM fazemos rsync de volta ao volume. Sem symlink (CIFS muitas vezes não resolve bem).
set -e

VOLUME_AUTH_ROOT="${AUTH_PATH:-/app/.wwebjs_auth}"
TMP_AUTH_ROOT="/tmp/wwebjs-auth-runtime"
PERSIST_MOUNT="${PERSIST_MOUNT:-/mnt/persist}"

USE_TMP_AUTH=0
case "${AUTH_PATH:-}" in */mnt/persist*) USE_TMP_AUTH=1 ;; esac
if [ "${WWEB_SESSION_ON_TMP:-}" = "1" ]; then USE_TMP_AUTH=1; fi
if [ "${WWEB_SESSION_ON_TMP:-}" = "0" ]; then USE_TMP_AUTH=0; fi

merge_auth_back_to_volume() {
  [ "$USE_TMP_AUTH" = "1" ] || return 0
  if [ ! -d "$TMP_AUTH_ROOT" ]; then
    return 0
  fi
  mkdir -p "$VOLUME_AUTH_ROOT" 2>/dev/null || true
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete "$TMP_AUTH_ROOT"/ "$VOLUME_AUTH_ROOT"/ 2>/dev/null || true
  else
    find "$VOLUME_AUTH_ROOT" -mindepth 1 -maxdepth 1 -exec rm -rf {} + 2>/dev/null || true
    mkdir -p "$VOLUME_AUTH_ROOT"
    cp -a "$TMP_AUTH_ROOT"/. "$VOLUME_AUTH_ROOT"/ 2>/dev/null || true
  fi
  sync 2>/dev/null || true
}

if [ "$USE_TMP_AUTH" = "1" ]; then
  rm -rf "$TMP_AUTH_ROOT" 2>/dev/null || true
  mkdir -p "$TMP_AUTH_ROOT"
  if [ -d "$VOLUME_AUTH_ROOT" ] && [ -n "$(ls -A "$VOLUME_AUTH_ROOT" 2>/dev/null)" ]; then
    cp -a "$VOLUME_AUTH_ROOT"/. "$TMP_AUTH_ROOT"/ 2>/dev/null || true
  fi
  export AUTH_PATH="$TMP_AUTH_ROOT"
  echo "docker-entrypoint: AUTH_PATH=${AUTH_PATH} (runtime em /tmp; volume em ${VOLUME_AUTH_ROOT}; rsync ao encerrar)."
fi

AUTH="${AUTH_PATH}"
SESSION="${AUTH}/session"
SEED="${AUTH}/_seed_session"

# _seed_session: só quando NÃO usamos cópia /tmp (evita find a seguir symlinks ou apagar /tmp errado).
if [ "$USE_TMP_AUTH" != "1" ] && [ -d "$SEED" ] && [ -n "$(ls -A "$SEED" 2>/dev/null)" ]; then
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
    echo "docker-entrypoint: _seed_session aplicado."
  fi
fi

clean_locks() {
  dir="$1"
  if [ ! -d "$dir" ]; then
    return 0
  fi
  chmod -R u+w "$dir" 2>/dev/null || true
  find "$dir" -maxdepth 15 \( \
    -name SingletonLock -o -name SingletonCookie -o -name SingletonSocket -o -name DevToolsActivePort \
  \) ! -type d -exec rm -f {} + 2>/dev/null || true
}

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

if [ "$USE_TMP_AUTH" = "1" ]; then
  term_or_int() {
    kill -TERM "$NODE_PID" 2>/dev/null || true
    wait "$NODE_PID" 2>/dev/null || true
    merge_auth_back_to_volume
    exit 143
  }
  trap term_or_int TERM INT
  "$@" &
  NODE_PID=$!
  set +e
  wait "$NODE_PID"
  code=$?
  set -e
  trap - TERM INT
  merge_auth_back_to_volume || true
  exit "$code"
else
  exec "$@"
fi
