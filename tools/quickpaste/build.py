#!/usr/bin/env python3
"""Construieste un QuickPaste de sine statator, fara Python pe calculatorul tinta.

Ruleaza-l pe sistemul pentru care vrei executabilul:

    python3 build.py

Pe macOS obtii `dist/QuickPaste.app`, pe Windows `dist/QuickPaste.exe`.
Rezultatul se poate copia pe orice calculator cu acelasi sistem de operare.

Un executabil nu poate fi construit pentru alt sistem decat cel pe care rulezi,
asa ca pentru ambele variante ai nevoie de o trecere pe fiecare sistem.
"""

from __future__ import annotations

import os
import platform
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
IS_MAC = platform.system() == "Darwin"
IS_WINDOWS = platform.system() == "Windows"


def ensure_pyinstaller() -> None:
    try:
        import PyInstaller  # noqa: F401
    except ImportError:
        print("Instalez PyInstaller...")
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "pyinstaller"], check=True
        )


def main() -> int:
    if sys.version_info < (3, 10):
        print(f"Am nevoie de Python 3.10+, tu rulezi {platform.python_version()}.")
        return 1

    subprocess.run(
        [sys.executable, "-m", "pip", "install", "-q", "-r",
         os.path.join(HERE, "requirements.txt")],
        check=True,
    )
    ensure_pyinstaller()

    for folder in ("build", "dist"):
        shutil.rmtree(os.path.join(HERE, folder), ignore_errors=True)

    command = [
        sys.executable, "-m", "PyInstaller",
        "--noconfirm",
        "--clean",
        "--windowed",
        "--name", "QuickPaste",
        "--distpath", os.path.join(HERE, "dist"),
        "--workpath", os.path.join(HERE, "build"),
        "--specpath", os.path.join(HERE, "build"),
    ]
    if IS_MAC:
        command += ["--osx-bundle-identifier", "local.quickpaste.app"]
    if IS_WINDOWS:
        command += ["--onefile"]
    command.append(os.path.join(HERE, "quickpaste.py"))

    print("Construiesc... (dureaza un minut)")
    subprocess.run(command, check=True)

    if IS_MAC:
        app = os.path.join(HERE, "dist", "QuickPaste.app")
        # Semnatura ad-hoc: fara ea macOS refuza bundle-ul pe alt calculator.
        subprocess.run(["codesign", "--force", "--deep", "--sign", "-", app], check=False)
        subprocess.run(["xattr", "-cr", app], check=False)
        print(f"\nGata: {app}")
        print("Copiaza-l in Applications sau pe alt Mac, apoi acorda permisiunea Accessibility.")
    else:
        exe = os.path.join(HERE, "dist", "QuickPaste.exe")
        print(f"\nGata: {exe}")
        print("Un singur fisier, se poate copia pe orice Windows.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
