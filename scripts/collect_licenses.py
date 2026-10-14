"""Retain license notices for self-hosted Python and JavaScript runtime files."""
import importlib.metadata as metadata
import tarfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]
folder = root / 'runner/public/licenses'
folder.mkdir(parents=True, exist_ok=True)
with tarfile.open(root / 'runner/public/python-core.tar') as archive:
    modules = {name.split('/')[0].removesuffix('.py') for name in archive.getnames()}
packages = {name for module, names in metadata.packages_distributions().items() if module in modules for name in names}
notices = [(root / 'vendor/futurecoder/LICENSE.txt').read_text()]
for name in sorted(packages):
    dist = metadata.distribution(name)
    notices.append(f'\n===== {name} {dist.version} =====\n')
    for file in dist.files or []:
        if any(term in file.name.lower() for term in ('license', 'copying', 'notice')):
            try:
                notices.append(dist.locate_file(file).read_text())
            except (OSError, UnicodeError):
                pass
    notices.append('Declared license: ' + str(dist.metadata.get('License-Expression') or dist.metadata.get('License') or 'See package license above'))
(folder / 'python-packages.txt').write_text('\n'.join(notices))
js = []
for project in ('web', 'runner'):
    for file in sorted((root / project / 'node_modules').rglob('*')):
        if file.is_file() and file.name.lower().split('.')[0] in ('license', 'licence', 'copying', 'notice'):
            try:
                js.append(f'\n===== {file.relative_to(root)} =====\n' + file.read_text())
            except (OSError, UnicodeError):
                pass
(folder / 'javascript-packages.txt').write_text('\n'.join(js))
print('Retained bundled package notices:', len(packages), 'Python distributions;', len(js), 'JavaScript notices')
