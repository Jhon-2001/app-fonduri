#!/bin/bash
# Dublu-click: pornește FormFill pe macOS.
set -e
cd "$(dirname "$0")"

pick_python() {
  for candidate in python3.13 python3.12 python3.11 python3.10 \
                   /opt/homebrew/bin/python3 /usr/local/bin/python3 python3; do
    if command -v "$candidate" >/dev/null 2>&1; then
      if "$candidate" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)' 2>/dev/null; then
        command -v "$candidate"
        return 0
      fi
    fi
  done
  return 1
}

if [ ! -x ".venv/bin/python" ]; then
  PY="$(pick_python)" || {
    echo "Am nevoie de Python 3.10 sau mai nou."
    echo "Instalează cu: brew install python"
    read -r -p "Apasă Enter pentru a închide..."
    exit 1
  }
  echo "Pregătesc mediul Python cu $PY (o singură dată)..."
  "$PY" -m venv .venv
  ./.venv/bin/python -m pip install --upgrade pip >/dev/null
  ./.venv/bin/python -m pip install -r requirements.txt
fi

exec ./.venv/bin/python formfill.py
