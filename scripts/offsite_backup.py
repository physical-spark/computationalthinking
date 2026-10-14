"""Install as a per-user LaunchAgent on the operator Mac; no secrets in Git."""

import os, subprocess
from pathlib import Path

folder = Path.home() / "Library/Application Support/ComputationalThinking/backups"
folder.mkdir(parents=True, exist_ok=True)
folder.chmod(0o700)
subprocess.run(
    [
        "rsync",
        "-az",
        "--include=ct-*.dump.gpg",
        "--exclude=*",
        "-e",
        "ssh -o BatchMode=yes -o ConnectTimeout=10",
        "prod:/home/ubuntu/ct-backups/",
        str(folder) + "/",
    ],
    check=True,
)
for p in folder.glob("*.gpg"):
    p.chmod(0o600)
print("Encrypted offsite snapshots synchronized:", len(list(folder.glob("*.gpg"))))
