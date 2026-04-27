#!/bin/sh
# Antes de subir o Node: remove locks órfãos do Chromium no perfil (Azure Files / reinício do pod).
# O Puppeteer falha com "browser is already running" se esses ficheiros sobreviverem no volume.
#
# Em /mnt/persist (Azure Files / SMB): o Chromium não suporta bem userDataDir em SMB (SingletonLock).
# Copiamos o perfil para /tmp (disco local), symlink session -> /tmp, e ao sair (SIGTERM/INT) rsync de volta
# para session.persist no share — mantém a sessão salva no volume sem correr Chrome em cima do SMB.
set -e
AUTH="${AUTH_PATH:-/app/.wwebjs_auth}"
SESSION="${AUTH}/session"
SEED="${AUTH}/_seed_session"

SESSION_PERSIST="${AUTH}/session.persist"
SESSION_TMP_LIVE="/tmp/wwebjs-session-live"
USE_TMP_SESSION=0
case "$AUTH" in */mnt/persist*) USE_TMP_SESSION=1 ;; esac
if [ "${WWEB_SESSION_ON_TMP:-}" = "1" ]; then USE_TMP_SESSION=1; fi
if [ "${WWEB_SESSION_ON_TMP:-}" = "0" ]; then USE_TMP_SESSION=0; fi

persist_merge_back() {
  [ "$USE_TMP_SESSION" = "1" ] || return 0
  if [ ! -d "$SESSION_TMP_LIVE" ]; then
    return 0
  fi
  mkdir -p "$SESSION_PERSIST" 2>/dev/null || true
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete "$SESSION_TMP_LIVE"/ "$SESSION_PERSIST"/ 2>/dev/null || true
  else
    find "$SESSION_PERSIST" -mindepth 1 -maxdepth 1 -exec rm -rf {} + 2>/dev/null || true
    mkdir -p "$SESSION_PERSIST"
    cp -a "$SESSION_TMP_LIVE"/. "$SESSION_PERSIST"/ 2>/dev/null || true
  fi
  sync 2>/dev/null || true
}

setup_tmp_session_for_smb() {
  [ "$USE_TMP_SESSION" = "1" ] || return 0
  mkdir -p "$AUTH" 2>/dev/null || true

  # session/ real no share -> renomear para session.persist (cópia dourada no Azure Files)
  if [ -d "$SESSION" ] && [ ! -L "$SESSION" ]; then
    if [ ! -d "$SESSION_PERSIST" ] || [ -z "$(ls -A "$SESSION_PERSIST" 2>/dev/null)" ]; then
      mv "$SESSION" "$SESSION_PERSIST" 2>/dev/null || cp -a "$SESSION"/. "$SESSION_PERSIST"/
    else
      # Já existe session.persist: esta pasta session/ no share é duplicado — removemos para por o symlink
      rm -rf "$SESSION" 2>/dev/null || true
    fi
  fi

  if [ -L "$SESSION" ]; then
    rm -f "$SESSION" 2>/dev/null || true
  fi

  mkdir -p "$SESSION_PERSIST" 2>/dev/null || true
  rm -rf "$SESSION_TMP_LIVE" 2>/dev/null || true
  mkdir -p "$SESSION_TMP_LIVE"
  if [ -n "$(ls -A "$SESSION_PERSIST" 2>/dev/null)" ]; then
    cp -a "$SESSION_PERSIST"/. "$SESSION_TMP_LIVE"/ 2>/dev/null || true
  fi
  ln -sfn "$SESSION_TMP_LIVE" "$SESSION"
  echo "docker-entrypoint: perfil Chromium em /tmp (cópia de session.persist); ao encerrar, grava de volta no volume."
}

setup_tmp_session_for_smb

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

if [ "$USE_TMP_SESSION" = "1" ]; then
  # PID 1 = este shell: SIGTERM do ACA tem de gravar session de volta no share antes de sair.
  term_or_int() {
    kill -TERM "$NODE_PID" 2>/dev/null || true
    wait "$NODE_PID" 2>/dev/null || true
    persist_merge_back
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
  persist_merge_back || true
  exit "$code"
else
  exec "$@"
fi
