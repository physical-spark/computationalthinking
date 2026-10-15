#!/usr/bin/env bash
# Restore into a temporary database, never overwrite the application DB.
set -euo pipefail
latest=$(find /home/ubuntu/ct-backups -name 'ct-*.dump.gpg' -type f | sort | tail -n 1)
test -n "$latest"
restore_db="ct_restore_$(date -u +%Y%m%d%H%M%S)"
sudo k3s kubectl -n computationalthinking exec deployment/postgres -- sh -c 'createdb -U "$POSTGRES_USER" "$1"' sh "$restore_db"
cleanup(){ sudo k3s kubectl -n computationalthinking exec deployment/postgres -- sh -c 'dropdb -U "$POSTGRES_USER" "$1"' sh "$restore_db"; }
trap cleanup EXIT
gpg --batch --decrypt --passphrase-file /home/ubuntu/.config/ct-backup.pass "$latest" | sudo k3s kubectl -n computationalthinking exec -i deployment/postgres -- sh -c 'pg_restore -U "$POSTGRES_USER" -d "$1" --exit-on-error' sh "$restore_db"
sudo k3s kubectl -n computationalthinking exec deployment/postgres -- sh -c 'psql -U "$POSTGRES_USER" -d "$1" -tAc "SELECT \$\$learners\$\$, count(*) FROM learners; SELECT \$\$google_connections\$\$, count(*) FROM learners WHERE google_sub IS NOT NULL; SELECT \$\$administrators\$\$, count(*) FROM learners WHERE admin; SELECT \$\$questions\$\$, count(*) FROM questions; SELECT \$\$replies\$\$, count(*) FROM replies; SELECT \$\$schema_versions\$\$, count(*) FROM alembic_version;"' sh "$restore_db"
echo 'Restore verified in an isolated database'
