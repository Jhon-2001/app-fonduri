#!/usr/bin/env python3
"""Construiește FormFill de sine stătător (fără Python pe calculatorul țintă).

    python build.py

Pe Windows → dist/FormFill.exe (un singur fișier, dublu-click).
Pe macOS → dist/FormFill.app
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
        [
            sys.executable,
            "-m",
            "pip",
            "install",
            "-q",
            "-r",
            os.path.join(HERE, "requirements.txt"),
        ],
        check=True,
    )
    ensure_pyinstaller()

    for folder in ("build", "dist"):
        shutil.rmtree(os.path.join(HERE, folder), ignore_errors=True)

    command = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--noconfirm",
        "--clean",
        "--windowed",
        "--name",
        "FormFill",
        "--distpath",
        os.path.join(HERE, "dist"),
        "--workpath",
        os.path.join(HERE, "build"),
        "--specpath",
        os.path.join(HERE, "build"),
    ]
    if IS_MAC:
        command += ["--osx-bundle-identifier", "local.formfill.app"]
    if IS_WINDOWS:
        command += ["--onefile"]
    command.append(os.path.join(HERE, "formfill.py"))

    print("Construiesc... (dureaza un minut)")
    subprocess.run(command, check=True)

    if IS_MAC:
        app = os.path.join(HERE, "dist", "FormFill.app")
        subprocess.run(
            ["codesign", "--force", "--deep", "--sign", "-", app], check=False
        )
        subprocess.run(["xattr", "-cr", app], check=False)
        print(f"\nGata: {app}")
    else:
        exe = os.path.join(HERE, "dist", "FormFill.exe")
        print(f"\nGata: {exe}")
        print("Un singur fisier — copiaza-l pe stick / email, dublu-click pe Windows.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
