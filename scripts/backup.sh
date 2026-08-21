#!/usr/bin/env bash
#
# Nightly encrypted backup of the cvforge database to Cloudflare R2.
#
# Design notes worth knowing before changing anything here:
#
#   * Public-key encryption (age), not a passphrase. The server holds only the
#     *public* key, so this script can create backups but cannot read them back.
#     A compromised server therefore leaks no backup contents. The private key
#     lives somewhere else — a password manager, an offline note — and is needed
#     only when restoring. If you put the private key on the server, you have
#     given up the property this design exists for.
#
#   * A dedicated bucket and a dedicated R2 token, separate from the avatars
#     bucket. The avatars bucket is public via a Custom Domain; database dumps
#     must never land there. Scoping the token to the backup bucket also means
#     this nightly job cannot delete users' avatar images.
#
#   * Nothing is installed on the host: pg_dump runs inside the existing Postgres
#     container, the upload runs in a throwaway aws-cli container. `age` is the
#     one exception and must be installed (`apt install age`).
#
#   * Remote retention is an R2 lifecycle rule on the bucket, not this script's
#     job — expiring objects server-side survives the script failing to run.
#
# Usage:  ./backup.sh [path/to/backup.env]     (default: alongside this script)

set -euo pipefail

ENV_FILE="${1:-"$(dirname "$0")/backup.env"}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "backup: missing env file: $ENV_FILE" >&2
  echo "backup: copy backup.env.example and fill it in" >&2
  exit 1
fi

# shellcheck disable=SC1090
set -a; source "$ENV_FILE"; set +a

for var in PG_CONTAINER PG_USER PG_DB S3_ENDPOINT S3_ACCESS_KEY_ID \
           S3_SECRET_ACCESS_KEY BACKUP_BUCKET AGE_RECIPIENT; do
  if [[ -z "${!var:-}" ]]; then
    echo "backup: $var is not set in $ENV_FILE" >&2
    exit 1
  fi
done

BACKUP_DIR="${BACKUP_DIR:-$HOME/backups/cvforge}"
KEEP_LOCAL="${KEEP_LOCAL:-7}"

mkdir -p "$BACKUP_DIR"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
PLAIN="$BACKUP_DIR/cvforge-$STAMP.dump"
CIPHER="$PLAIN.age"

cleanup() { rm -f "$PLAIN"; }
trap cleanup EXIT

echo "backup: dumping $PG_DB from $PG_CONTAINER"
docker exec "$PG_CONTAINER" pg_dump -U "$PG_USER" -Fc "$PG_DB" > "$PLAIN"

# A pg_dump that fails mid-stream can still leave a small, well-formed-looking
# file behind. Refuse to ship anything implausibly small rather than quietly
# replacing good backups with broken ones.
SIZE=$(wc -c < "$PLAIN")
if (( SIZE < 1024 )); then
  echo "backup: dump is only ${SIZE} bytes — refusing to upload" >&2
  exit 1
fi

echo "backup: encrypting (${SIZE} bytes)"
age --recipient "$AGE_RECIPIENT" --output "$CIPHER" "$PLAIN"
rm -f "$PLAIN"
trap - EXIT

echo "backup: uploading to r2://$BACKUP_BUCKET/$(basename "$CIPHER")"
docker run --rm \
  -e AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY_ID" \
  -e AWS_SECRET_ACCESS_KEY="$S3_SECRET_ACCESS_KEY" \
  -e AWS_DEFAULT_REGION=auto \
  -v "$BACKUP_DIR:/backups:ro" \
  amazon/aws-cli \
  s3 cp "/backups/$(basename "$CIPHER")" "s3://$BACKUP_BUCKET/" \
  --endpoint-url "$S3_ENDPOINT"

# Local copies are a convenience for fast restores, not the backup itself — the
# copy that matters is the one off this machine. Keep a handful and prune.
echo "backup: pruning local copies (keeping $KEEP_LOCAL)"
find "$BACKUP_DIR" -maxdepth 1 -name 'cvforge-*.dump.age' -type f -print0 \
  | xargs -0 ls -1t 2>/dev/null \
  | tail -n "+$((KEEP_LOCAL + 1))" \
  | while read -r old; do rm -f -- "$old"; done

echo "backup: done — $(basename "$CIPHER")"
