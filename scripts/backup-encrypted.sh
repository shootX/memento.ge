#!/usr/bin/env bash
set -euo pipefail
# Encrypted offsite backup — run on server with DATABASE_URL and LOCAL_STORAGE_PATH set.
: "${BACKUP_PASSPHRASE:?set BACKUP_PASSPHRASE}"
: "${DATABASE_URL:?set DATABASE_URL}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT_DIR="${BACKUP_OUT_DIR:-/var/backups/memento}"
mkdir -p "$OUT_DIR"
pg_dump "$DATABASE_URL" | gzip -9 | openssl enc -aes-256-cbc -salt -pbkdf2 -pass pass:"$BACKUP_PASSPHRASE" -out "$OUT_DIR/db-$STAMP.sql.gz.enc"
if [[ -n "${LOCAL_STORAGE_PATH:-}" ]]; then
  tar -czf - -C "$(dirname "$LOCAL_STORAGE_PATH")" "$(basename "$LOCAL_STORAGE_PATH")" \
    | openssl enc -aes-256-cbc -salt -pbkdf2 -pass pass:"$BACKUP_PASSPHRASE" -out "$OUT_DIR/media-$STAMP.tar.gz.enc"
fi
echo "Wrote $OUT_DIR/*-$STAMP.*"
