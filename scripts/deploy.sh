#!/usr/bin/env bash
# Forced-command target: SSH_ORIGINAL_COMMAND must be "deploy <40-hex commit>".
set -euo pipefail
read -r action commit extra <<< "${SSH_ORIGINAL_COMMAND:-${1:-}}"
[[ "$action" == deploy && "$commit" =~ ^[0-9a-f]{40}$ && -z "${extra:-}" ]] || { echo 'Invalid deploy request'; exit 2; }
repo=/home/ubuntu/workspace/org_physical-spark/computationalthinking
cd "$repo"
exec 9>/tmp/computationalthinking-deploy.lock
flock -n 9 || { echo 'Deployment already running'; exit 1; }
git fetch origin main
git cat-file -e "$commit^{commit}"
git merge-base --is-ancestor "$commit" origin/main
image_archive=$(mktemp /tmp/ct-image.XXXXXX.tar.gz)
trap 'rm -f "$image_archive"' EXIT
cat > "$image_archive"
sudo k3s ctr images import "$image_archive"
sudo k3s ctr images ls -q | grep -Fx "docker.io/library/ct-app:$commit"
if sudo k3s kubectl -n computationalthinking get deployment app >/dev/null 2>&1; then
  "$repo/scripts/backup.sh" predeploy
fi
git checkout --detach "$commit"
sed "s/__TAG__/$commit/g" k8s/resources.yaml | sudo k3s kubectl apply -f -
if ! sudo k3s kubectl -n computationalthinking rollout status deployment/postgres --timeout=120s || ! sudo k3s kubectl -n computationalthinking rollout status deployment/app --timeout=180s || ! sudo k3s kubectl -n computationalthinking rollout status deployment/runner --timeout=120s; then
  sudo k3s kubectl -n computationalthinking rollout undo deployment/app || true
  sudo k3s kubectl -n computationalthinking rollout undo deployment/runner || true
  exit 1
fi
curl --fail --retry 3 http://10.43.200.54/healthz
curl --fail --retry 3 http://10.43.200.55/healthz
printf '\nDeployed commit %s\n' "$commit"
