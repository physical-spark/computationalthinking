#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
uv python install 3.12.1
uv sync --frozen
uv run python scripts/compile_korean.py
cd vendor/futurecoder
uv tool run --from poetry poetry env use "$(uv python find 3.12.1)" >/dev/null
uv tool run --from poetry poetry install --no-interaction
FUTURECODER_LANGUAGE=en uv tool run --from poetry poetry run python -m translations.generate_po_file
FIX_CORE_IMPORTS=1 FUTURECODER_LANGUAGE=en uv tool run --from poetry poetry run python -m scripts.generate_static_files
uv tool run --from poetry poetry run pytest tests/test_steps.py -q
uv tool run --from poetry poetry run python ../../runtime/regression.py ko
uv tool run --from poetry poetry run python ../../scripts/build_content.py ko
uv tool run --from poetry poetry run python ../../scripts/collect_licenses.py
cd ../..
mkdir -p runner/public/pyodide
cp runner/node_modules/pyodide/pyodide.{mjs,asm.js,asm.wasm} runner/node_modules/pyodide/python_stdlib.zip runner/node_modules/pyodide/pyodide-lock.json runner/public/pyodide/
