#!/usr/bin/env bash
#
# Nightly gathering-up of expired auth rows in the cvforge database.
#
# Neither table is reachable by a cascade, and Better Auth never revisits them:
#
#   * verification — no userId, no foreign key. Under Better Auth 1.7 email
#     verification is stateless (a signed JWT, no row), so what accumulates here
#     is password-reset rows, which carry the user id in `value`, and OAuth state
#     rows. Account deletion removes a user's own reset rows; this removes the
#     ones that simply expired.
#
#   * session — deleted with the user, but a session that merely ran out sits
#     there forever holding a token, a user id, and whatever the client sent.
#
# Both are personal data with no reason to be kept, which makes this a retention
# measure rather than housekeeping. Expiry is the only criterion: a row past
# `expiresAt` is already refused by the application, so deleting it changes
# nothing a user can observe.
#
# `import_log` is a third case, and its criterion is different because it has no
# expiry: the rows are what enforces the PDF import quota (a 24-hour window) and
# what the cap's number should eventually be derived from. So they age out by
# policy rather than by an `expiresAt` — ninety days is long enough to set that
# number from evidence and short enough to be a retention window rather than an
# archive. Unlike the two above, this table IS reached by the cascade on account
# deletion; this only removes rows belonging to accounts that still exist.
#
# Config comes from backup.env — it already holds the three values needed, and a
# second file to keep in sync would be pure cost.
#
# Usage:  ./purge-expired.sh [path/to/backup.env]   (default: alongside this script)

set -euo pipefail

ENV_FILE="${1:-"$(dirname "$0")/backup.env"}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "purge: missing env file: $ENV_FILE" >&2
  echo "purge: copy backup.env.example and fill it in" >&2
  exit 1
fi

# shellcheck disable=SC1090
set -a; source "$ENV_FILE"; set +a

for var in PG_CONTAINER PG_USER PG_DB; do
  if [[ -z "${!var:-}" ]]; then
    echo "purge: $var is not set in $ENV_FILE" >&2
    exit 1
  fi
done

echo "purge: $(date -u +%Y-%m-%dT%H:%M:%SZ) — $PG_DB in $PG_CONTAINER"

# -1 wraps both statements in one transaction, so a failure on the second leaves
# the first rolled back rather than half-applied. RETURNING lets each report a
# count; a log line saying "0" is meaningfully different from no log line at all.
docker exec -i "$PG_CONTAINER" \
  psql -U "$PG_USER" -d "$PG_DB" -v ON_ERROR_STOP=1 -1 -tA -q <<'SQL'
WITH deleted AS (DELETE FROM verification WHERE "expiresAt" < now() RETURNING 1)
SELECT 'purge: expired verification rows removed: ' || count(*) FROM deleted;

WITH deleted AS (DELETE FROM session WHERE "expiresAt" < now() RETURNING 1)
SELECT 'purge: expired session rows removed: ' || count(*) FROM deleted;

WITH deleted AS (
  DELETE FROM import_log WHERE "createdAt" < now() - interval '90 days' RETURNING 1
)
SELECT 'purge: import_log rows past retention removed: ' || count(*) FROM deleted;
SQL

echo "purge: done"
