#!/usr/bin/env bash
set -euo pipefail
backup_dir=/home/ubuntu/ct-backups
mkdir -p "$backup_dir"
chmod 700 "$backup_dir"
archive="$backup_dir/ct-$(date -u +%Y%m%dT%H%M%SZ)-${1:-daily}.dump"
sudo k3s kubectl -n computationalthinking exec deployment/postgres -- sh -c 'pg_dump -Fc -U "$POSTGRES_USER" "$POSTGRES_DB"' > "$archive"
chmod 600 "$archive"
test -s "$archive"
find "$backup_dir" -name 'ct-*.dump' -mtime +7 -delete
printf 'Backup created: %s\n' "$(basename "$archive")"
