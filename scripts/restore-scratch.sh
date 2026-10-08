#!/usr/bin/env bash
set -euo pipefail
# Restore encrypted DB dump into SCRATCH database only.
: "${SCRATCH_DATABASE_URL:?use isolated DB}"
: "${BACKUP_PASSPHRASE:?}"
ENC_FILE="${1:?path to db-*.sql.gz.enc}"
openssl enc -d -aes-256-cbc -pbkdf2 -pass pass:"$BACKUP_PASSPHRASE" -in "$ENC_FILE" | gunzip | psql "$SCRATCH_DATABASE_URL"
echo "Restored into scratch DB"
