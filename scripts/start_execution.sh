#!/usr/bin/env bash
set -euo pipefail
app_image="$1"
python_image="$2"
# These are immutable Docker image IDs, never request-controlled values.
[[ "$app_image" =~ ^sha256:[a-f0-9]{64}$ && "$python_image" =~ ^sha256:[a-f0-9]{64}$ ]]
sudo install -m 755 scripts/execution_cgroups.sh /usr/local/lib/ct-execution-cgroups
sudo install -m 644 scripts/ct-execution.service /etc/systemd/system/ct-execution.service
sudo systemctl daemon-reload
sudo systemctl stop ct-execution.service 2>/dev/null || true
sudo docker rm -f ct-execution-broker 2>/dev/null || true
sudo docker create --name ct-execution-broker --network host --user 0:0 --read-only --cap-drop ALL --security-opt no-new-privileges --memory 256m --cpus 0.5 --pids-limit 128 --tmpfs /tmp:rw,nosuid,nodev,size=16777216 --mount type=bind,src=/var/run/docker.sock,dst=/var/run/docker.sock --env-file /home/ubuntu/.config/ct-execution.env -e CT_EXECUTION_IMAGE="$python_image" -e CT_CGROUP_PARENT=/ct-execution -e CT_BROKER_SCOPE=production "$app_image" uvicorn execution.broker:app --host 10.42.0.1 --port 8766 --ws-max-size 100000 --timeout-graceful-shutdown 10 >/dev/null
sudo systemctl enable --now ct-execution.service
curl --fail --retry 15 --retry-connrefused --retry-delay 1 --max-time 5 http://10.42.0.1:8766/healthz
