#!/usr/bin/env bash
set -euo pipefail
if [ -f /sys/fs/cgroup/cgroup.controllers ]; then
  mkdir -p /sys/fs/cgroup/ct-execution
  echo 6442450944 > /sys/fs/cgroup/ct-execution/memory.max
  echo '200000 100000' > /sys/fs/cgroup/ct-execution/cpu.max
else
  mkdir -p /sys/fs/cgroup/memory/ct-execution /sys/fs/cgroup/cpu/ct-execution
  echo 6442450944 > /sys/fs/cgroup/memory/ct-execution/memory.limit_in_bytes
  echo 100000 > /sys/fs/cgroup/cpu/ct-execution/cpu.cfs_period_us
  echo 200000 > /sys/fs/cgroup/cpu/ct-execution/cpu.cfs_quota_us
fi
