#!/usr/bin/env bash
set -euo pipefail
backup_dir=/home/ubuntu/ct-backups
pass_file=/home/ubuntu/.config/ct-backup.pass
mkdir -p "$backup_dir"
chmod 700 "$backup_dir"
test -r "$pass_file" || { echo 'Backup encryption key is missing'; exit 1; }
archive="$backup_dir/ct-$(date -u +%Y%m%dT%H%M%SZ)-${1:-daily}.dump.gpg"
sudo k3s kubectl -n computationalthinking exec deployment/postgres -- sh -c 'pg_dump -Fc -U "$POSTGRES_USER" "$POSTGRES_DB"' | gpg --batch --yes --symmetric --cipher-algo AES256 --passphrase-file "$pass_file" --output "$archive"
chmod 600 "$archive"
test -s "$archive"
find "$backup_dir" -name 'ct-*.dump.gpg' -mtime +7 -delete
printf 'Encrypted backup created: %s\n' "$(basename "$archive")"
