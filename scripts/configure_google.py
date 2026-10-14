"""Run on prod with a downloaded web-client JSON kept outside this repository."""
import json
import os
import subprocess
import sys
from pathlib import Path

if len(sys.argv) != 2:
    raise SystemExit('Usage: python3 scripts/configure_google.py /private/path/client.json')
source = Path(sys.argv[1]).resolve()
root = Path(__file__).resolve().parents[1]
if source.is_relative_to(root):
    raise SystemExit('Keep OAuth credential files outside the public repository')
web = json.loads(source.read_text()).get('web', {})
callback = 'https://computationalthinking.futurereadycampus.com/auth/google/callback'
if callback not in web.get('redirect_uris', []):
    raise SystemExit('This web client must register the exact production callback URI')
values = {'GOOGLE_CLIENT_ID': web.get('client_id', ''), 'GOOGLE_CLIENT_SECRET': web.get('client_secret', '')}
if any(not v or any(c.isspace() for c in v) for v in values.values()):
    raise SystemExit('The web client ID and secret are missing or malformed')
config = Path('/home/ubuntu/.config/computationalthinking.env')
lines = [line for line in config.read_text().splitlines() if line.split('=', 1)[0] not in values]
config.write_text('\n'.join(lines + [f'{k}={v}' for k, v in values.items()]) + '\n')
config.chmod(0o600)
source.chmod(0o600)
manifest = subprocess.check_output(['sudo', 'k3s', 'kubectl', '-n', 'computationalthinking', 'create', 'secret', 'generic', 'ct-secrets', '--from-env-file='+str(config), '--dry-run=client', '-o', 'json'])
subprocess.run(['sudo', 'k3s', 'kubectl', 'apply', '-f', '-'], input=manifest, check=True)
subprocess.run(['sudo', 'k3s', 'kubectl', '-n', 'computationalthinking', 'rollout', 'restart', 'deployment/app'], check=True)
subprocess.run(['sudo', 'k3s', 'kubectl', '-n', 'computationalthinking', 'rollout', 'status', 'deployment/app', '--timeout=120s'], check=True)
print('Google web client connected. Verify real login and guest-record preservation in the browser.')
