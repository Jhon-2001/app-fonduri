#!/bin/bash
# Creează pe Desktop FormFill.app (similar cu QuickPaste).
set -e
cd "$(dirname "$0")"

SUPPORT="$HOME/Library/Application Support/FormFill"
APP="$HOME/Desktop/FormFill.app"

pick_python() {
  for candidate in python3.13 python3.12 python3.11 python3.10 \
                   /opt/homebrew/bin/python3 /usr/local/bin/python3 python3; do
    if command -v "$candidate" >/dev/null 2>&1 &&
       "$candidate" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)' 2>/dev/null; then
      command -v "$candidate"
      return 0
    fi
  done
  return 1
}

echo "Instalez în $SUPPORT ..."
mkdir -p "$SUPPORT"
cp -f formfill.py requirements.txt "$SUPPORT/"

if [ ! -x "$SUPPORT/.venv/bin/python" ]; then
  PY="$(pick_python)" || {
    echo "Am nevoie de Python 3.10+. Instalează cu: brew install python"
    exit 1
  }
  echo "Pregătesc mediul cu $PY ..."
  "$PY" -m venv "$SUPPORT/.venv"
  "$SUPPORT/.venv/bin/python" -m pip install --upgrade pip >/dev/null
fi
"$SUPPORT/.venv/bin/python" -m pip install -q -r "$SUPPORT/requirements.txt"

echo "Construiesc $APP ..."
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS"

cat > "$APP/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>FormFill</string>
  <key>CFBundleDisplayName</key><string>FormFill</string>
  <key>CFBundleIdentifier</key><string>local.formfill.launcher</string>
  <key>CFBundleVersion</key><string>1.0</string>
  <key>CFBundleShortVersionString</key><string>1.0</string>
  <key>CFBundleExecutable</key><string>FormFill</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>NSHighResolutionCapable</key><true/>
  <key>LSUIElement</key><false/>
</dict>
</plist>
PLIST

if [ -x "$SUPPORT/.venv/bin/pythonw" ]; then
  cat > "$APP/Contents/MacOS/FormFill" <<LAUNCHER
#!/bin/bash
cd "$SUPPORT"
exec ./.venv/bin/pythonw formfill.py 2>/tmp/formfill.log
LAUNCHER
else
  cat > "$APP/Contents/MacOS/FormFill" <<LAUNCHER
#!/bin/bash
cd "$SUPPORT"
exec ./.venv/bin/python formfill.py >/tmp/formfill.log 2>&1
LAUNCHER
fi
chmod +x "$APP/Contents/MacOS/FormFill"
xattr -cr "$APP" 2>/dev/null || true

echo
echo "Gata: $APP"
echo "Bifează Accessibility + Input Monitoring pentru python3.x, ca la QuickPaste."
