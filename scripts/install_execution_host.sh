#!/usr/bin/env bash
# Install the sandbox runtime without restarting unrelated containers.
set -euo pipefail
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
cd "$work"
arch=$(uname -m)
version="${CT_GVISOR_VERSION:-20261005.0}"
url="https://storage.googleapis.com/gvisor/releases/release/$version/$arch"
curl -fsSLO "$url/gvisor.tar.bz2"
curl -fsSLO "$url/gvisor.tar.bz2.sha512"
sha512sum -c gvisor.tar.bz2.sha512
sudo tar -xjf gvisor.tar.bz2 -C /usr/local/bin
sudo /usr/local/bin/runsc install --runtime runsc
sudo dockerd --validate --config-file /etc/docker/daemon.json
sudo systemctl kill --signal=HUP --kill-who=main docker
/usr/local/bin/runsc --version
# Dedicated aggregate budget, independent of every existing service's cgroup.
if [ -f /sys/fs/cgroup/cgroup.controllers ]; then
  sudo mkdir -p /sys/fs/cgroup/ct-execution
  echo 6442450944 | sudo tee /sys/fs/cgroup/ct-execution/memory.max >/dev/null
  echo '200000 100000' | sudo tee /sys/fs/cgroup/ct-execution/cpu.max >/dev/null
else
  sudo mkdir -p /sys/fs/cgroup/memory/ct-execution /sys/fs/cgroup/cpu/ct-execution
  echo 6442450944 | sudo tee /sys/fs/cgroup/memory/ct-execution/memory.limit_in_bytes >/dev/null
  echo 100000 | sudo tee /sys/fs/cgroup/cpu/ct-execution/cpu.cfs_period_us >/dev/null
  echo 200000 | sudo tee /sys/fs/cgroup/cpu/ct-execution/cpu.cfs_quota_us >/dev/null
fi
