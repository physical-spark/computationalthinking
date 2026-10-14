"""Install as a per-user LaunchAgent on the operator Mac; no secrets in Git."""

import subprocess, time
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
for p in folder.glob("ct-*.dump.gpg"):
    p.chmod(0o600)
    if time.time() - p.stat().st_mtime > 7 * 86400:
        p.unlink()
print("Encrypted offsite snapshots synchronized:", len(list(folder.glob("*.gpg"))))
