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
archive_dir=/home/ubuntu/ct-images
install -m 700 -d "$archive_dir"
previous_ref=$(sudo k3s kubectl -n computationalthinking get deployment app -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || true)
previous_digest="${previous_ref##*@sha256:}"
image_archive=$(mktemp /tmp/ct-image.XXXXXX.tar.gz)
trap 'test -z "$image_archive" || rm -f "$image_archive"' EXIT
cat > "$image_archive"
sudo k3s ctr images import "$image_archive"
sudo docker load < "$image_archive"
reference="docker.io/library/ct-app:$commit"
sudo k3s ctr images ls -q | grep -Fx "$reference"
image_digest=$(sudo k3s ctr images ls | awk -v reference="$reference" '$1 == reference {print $3}')
[[ "$image_digest" =~ ^sha256:[0-9a-f]{64}$ ]]
immutable="docker.io/library/ct-app@$image_digest"
sudo k3s ctr images tag --force "$reference" "$immutable"
archive="$archive_dir/${image_digest#sha256:}.tar.gz"
mv "$image_archive" "$archive"
chmod 600 "$archive"
image_archive=""
if sudo k3s kubectl -n computationalthinking get deployment app >/dev/null 2>&1; then
  "$repo/scripts/backup.sh" predeploy
fi
git checkout --detach "$commit"
previous_broker=$(sudo docker inspect ct-execution-broker --format '{{.Image}}' 2>/dev/null || true)
previous_python=$(sudo docker inspect ct-execution-broker --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null | sed -n 's/^CT_EXECUTION_IMAGE=//p' || true)
app_docker=$(sudo docker image inspect "ct-app:$commit" --format '{{.Id}}')
python_docker=$(sudo docker image inspect "ct-python:$commit" --format '{{.Id}}')
if ! ./scripts/start_execution.sh "$app_docker" "$python_docker"; then
  if [[ "$previous_broker" =~ ^sha256: && "$previous_python" =~ ^sha256: ]]; then
    ./scripts/start_execution.sh "$previous_broker" "$previous_python" || true
  fi
  exit 1
fi
sed "s|ct-app:__TAG__|$immutable|g" k8s/resources.yaml | sudo k3s kubectl apply -f -
if ! sudo k3s kubectl -n computationalthinking rollout status deployment/postgres --timeout=120s || ! sudo k3s kubectl -n computationalthinking rollout status deployment/app --timeout=180s || ! sudo k3s kubectl -n computationalthinking rollout status deployment/runner --timeout=120s || ! curl --fail --retry 8 --retry-connrefused --retry-delay 1 --max-time 5 http://10.43.200.54/healthz || ! curl --fail --retry 8 --retry-connrefused --retry-delay 1 --max-time 5 http://10.43.200.55/healthz; then
  previous_archive="$archive_dir/$previous_digest.tar.gz"
  if [[ "$previous_digest" =~ ^[0-9a-f]{64}$ && -s "$previous_archive" ]]; then
    sudo k3s ctr images import "$previous_archive"
    sudo docker load < "$previous_archive"
    sudo k3s ctr images tag --force "$(sudo k3s ctr images ls | awk -v digest="sha256:$previous_digest" '$3 == digest {print $1; exit}')" "$previous_ref"
  fi
  sudo k3s kubectl -n computationalthinking rollout undo deployment/app || true
  sudo k3s kubectl -n computationalthinking rollout undo deployment/runner || true
  sudo k3s kubectl -n computationalthinking rollout status deployment/app --timeout=180s || true
  sudo k3s kubectl -n computationalthinking rollout status deployment/runner --timeout=120s || true
  if [[ "$previous_broker" =~ ^sha256: && "$previous_python" =~ ^sha256: ]]; then
    ./scripts/start_execution.sh "$previous_broker" "$previous_python" || true
  fi
  exit 1
fi
# Keep the newly healthy image and its predecessor outside containerd image GC.
for saved in "$archive_dir"/*.tar.gz; do
  key=$(basename "$saved" .tar.gz)
  if [[ "$key" != "${image_digest#sha256:}" && "$key" != "$previous_digest" ]]; then
    rm -f "$saved"
  fi
done
printf '\nDeployed commit %s with image %s\n' "$commit" "$image_digest"
