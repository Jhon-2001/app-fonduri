#!/usr/bin/env python3
"""FormFill — lipește pe rând mai multe câmpuri, cu Tab între ele.

Două secvențe:
  1) Contact (UAT / reprezentant / email / telefon) — buton + ⌘⇧B / Ctrl+Shift+B
  2) Proiect (titlu / sumă / punctaj) — buton + ⌘⇧P / Ctrl+Shift+P

Focusul trebuie să fie pe primul câmp din secțiunea țintă.
"""

from __future__ import annotations

import json
import os
import platform
import subprocess
import sys
import threading
import time
import tkinter as tk
from tkinter import messagebox, ttk

try:
    from pynput import keyboard
except ImportError as exc:  # pragma: no cover
    print(
        "Lipsește 'pynput'. Rulează run-mac.command / run-windows.bat\n"
        f"Detaliu: {exc}"
    )
    sys.exit(1)


IS_MAC = platform.system() == "Darwin"
IS_WINDOWS = platform.system() == "Windows"
IS_FROZEN = getattr(sys, "frozen", False)

DEFAULT_CONTACT = [
    {"label": "Instituție / UAT", "text": "UAT COMUNA BELIȘ"},
    {"label": "Reprezentant", "text": "TRIFU VIOLETA"},
    {"label": "E-mail", "text": "primariabelis@yahoo.com"},
    {"label": "Telefon", "text": "0756651119"},
]

DEFAULT_PROJECT = [
    {
        "label": "Titlu proiect",
        "text": "ABILITY Adventure Park Beliș – destinație de aventură incluzivă",
    },
    {"label": "Sumă (euro)", "text": "58800.00"},
    {"label": "Punctaj", "text": "95.00"},
]


def app_directory() -> str:
    if IS_FROZEN:
        return os.path.dirname(os.path.abspath(sys.executable))
    return os.path.dirname(os.path.abspath(__file__))


def config_directory() -> str:
    """Config lângă .exe dacă există `portable.txt`, altfel folderul standard."""
    base = app_directory()
    if os.path.exists(os.path.join(base, "portable.txt")):
        return base

    if IS_WINDOWS:
        root = os.environ.get("APPDATA") or os.path.expanduser("~")
        return os.path.join(root, "FormFill")
    if IS_MAC:
        return os.path.join(
            os.path.expanduser("~"), "Library", "Application Support", "FormFill"
        )
    return os.path.join(os.path.expanduser("~"), ".config", "formfill")


def config_path() -> str:
    directory = config_directory()
    try:
        os.makedirs(directory, exist_ok=True)
    except OSError:
        directory = os.path.expanduser("~")
    return os.path.join(directory, "fields.json")


def _parse_fields(raw: object, fallback: list[dict]) -> list[dict]:
    if not isinstance(raw, list) or not raw:
        return [dict(f) for f in fallback]
    out: list[dict] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        out.append(
            {
                "label": str(item.get("label") or "Câmp"),
                "text": str(item.get("text") or ""),
            }
        )
    return out if out else [dict(f) for f in fallback]


def load_config() -> dict:
    path = config_path()
    if not os.path.exists(path):
        return {
            "contact": [dict(f) for f in DEFAULT_CONTACT],
            "project": [dict(f) for f in DEFAULT_PROJECT],
        }
    try:
        with open(path, encoding="utf-8") as fh:
            data = json.load(fh)
        # Compat: vechiul format avea doar "fields"
        if "contact" not in data and isinstance(data.get("fields"), list):
            return {
                "contact": _parse_fields(data["fields"], DEFAULT_CONTACT),
                "project": [dict(f) for f in DEFAULT_PROJECT],
            }
        return {
            "contact": _parse_fields(data.get("contact"), DEFAULT_CONTACT),
            "project": _parse_fields(data.get("project"), DEFAULT_PROJECT),
        }
    except (OSError, json.JSONDecodeError, TypeError):
        return {
            "contact": [dict(f) for f in DEFAULT_CONTACT],
            "project": [dict(f) for f in DEFAULT_PROJECT],
        }


def save_config(contact: list[dict], project: list[dict]) -> None:
    path = config_path()
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(
            {"contact": contact, "project": project},
            fh,
            ensure_ascii=False,
            indent=2,
        )


def clipboard_read() -> str:
    try:
        if IS_MAC:
            return subprocess.run(
                ["pbpaste"], capture_output=True, text=True, check=False
            ).stdout
        if IS_WINDOWS:
            import ctypes

            CF_UNICODETEXT = 13
            user32 = ctypes.windll.user32
            kernel32 = ctypes.windll.kernel32
            user32.OpenClipboard(0)
            try:
                handle = user32.GetClipboardData(CF_UNICODETEXT)
                if not handle:
                    return ""
                pointer = kernel32.GlobalLock(handle)
                data = ctypes.wstring_at(pointer)
                kernel32.GlobalUnlock(handle)
                return data
            finally:
                user32.CloseClipboard()
    except Exception:
        return ""
    return ""


def clipboard_write(text: str) -> bool:
    try:
        if IS_MAC:
            proc = subprocess.run(
                ["pbcopy"],
                input=text,
                text=True,
                check=False,
            )
            return proc.returncode == 0
        if IS_WINDOWS:
            import ctypes

            CF_UNICODETEXT = 13
            GMEM_MOVEABLE = 0x0002
            user32 = ctypes.windll.user32
            kernel32 = ctypes.windll.kernel32
            user32.OpenClipboard(0)
            try:
                user32.EmptyClipboard()
                encoded = (text + "\0").encode("utf-16-le")
                handle = kernel32.GlobalAlloc(GMEM_MOVEABLE, len(encoded))
                pointer = kernel32.GlobalLock(handle)
                ctypes.memmove(pointer, encoded, len(encoded))
                kernel32.GlobalUnlock(handle)
                user32.SetClipboardData(CF_UNICODETEXT, handle)
                return True
            finally:
                user32.CloseClipboard()
    except Exception:
        return False
    return False


class Sequencer:
    """Lipește fiecare câmp, apoi Tab către următorul."""

    def __init__(self) -> None:
        self.controller = keyboard.Controller()
        self._lock = threading.Lock()
        self._pasteboard = None
        if IS_MAC:
            try:
                from AppKit import NSPasteboard

                self._pasteboard = NSPasteboard.generalPasteboard()
            except Exception:
                self._pasteboard = None

    def _release_modifiers(self) -> None:
        for name in (
            "cmd",
            "cmd_l",
            "cmd_r",
            "ctrl",
            "ctrl_l",
            "ctrl_r",
            "alt",
            "alt_l",
            "alt_r",
            "shift",
            "shift_l",
            "shift_r",
        ):
            key = getattr(keyboard.Key, name, None)
            if key is None:
                continue
            try:
                self.controller.release(key)
            except Exception:
                pass

    def _wait_modifiers_up(self, timeout: float = 0.45) -> None:
        self._release_modifiers()
        deadline = time.perf_counter() + timeout
        while time.perf_counter() < deadline:
            held = False
            try:
                held = bool(
                    self.controller.ctrl_pressed
                    or self.controller.alt_pressed
                    or self.controller.shift_pressed
                    or self.controller.cmd_pressed
                )
            except Exception:
                held = False
            if not held:
                time.sleep(0.01)
                return
            self._release_modifiers()
            time.sleep(0.015)
        self._release_modifiers()

    def _read_clipboard(self) -> str:
        if self._pasteboard is not None:
            try:
                from AppKit import NSPasteboardTypeString

                return self._pasteboard.stringForType_(NSPasteboardTypeString) or ""
            except Exception:
                pass
        return clipboard_read()

    def _write_clipboard(self, text: str) -> bool:
        if self._pasteboard is not None:
            try:
                from AppKit import NSPasteboardTypeString

                self._pasteboard.clearContents()
                return bool(
                    self._pasteboard.setString_forType_(text, NSPasteboardTypeString)
                )
            except Exception:
                pass
        return clipboard_write(text)

    def _paste(self) -> None:
        modifier = keyboard.Key.cmd if IS_MAC else keyboard.Key.ctrl
        with self.controller.pressed(modifier):
            self.controller.tap("v")

    def _tab(self) -> None:
        self.controller.tap(keyboard.Key.tab)

    def fill(self, texts: list[str]) -> None:
        values = [t for t in texts if t is not None]
        if not values:
            return
        with self._lock:
            previous = self._read_clipboard()
            self._wait_modifiers_up()
            time.sleep(0.12)
            for index, text in enumerate(values):
                if not self._write_clipboard(text):
                    continue
                time.sleep(0.05)
                self._paste()
                time.sleep(0.12)
                if index < len(values) - 1:
                    self._tab()
                    time.sleep(0.1)
            if previous:
                threading.Timer(0.8, lambda: self._write_clipboard(previous)).start()


class FormFillApp:
    def __init__(self) -> None:
        self.root = tk.Tk()
        self.root.title("FormFill — Belis")
        self.root.minsize(520, 560)
        self.root.geometry("560x620")

        cfg = load_config()
        self.contact = cfg["contact"]
        self.project = cfg["project"]
        self.contact_entries: list[tk.Entry] = []
        self.project_entries: list[tk.Entry] = []
        self.sequencer = Sequencer()
        self.listener: keyboard.GlobalHotKeys | None = None
        hk_c = "⌘⇧B" if IS_MAC else "Ctrl+Shift+B"
        hk_p = "⌘⇧P" if IS_MAC else "Ctrl+Shift+P"
        self.status_var = tk.StringVar(
            value=f"Gata. Contact: {hk_c}  ·  Proiect: {hk_p}"
        )

        self._build_ui()
        self._start_hotkeys()
        self.root.protocol("WM_DELETE_WINDOW", self.on_close)

    def _add_field_rows(
        self, parent: ttk.Frame, fields: list[dict], store: list[tk.Entry]
    ) -> None:
        for field in fields:
            row = ttk.Frame(parent)
            row.pack(fill=tk.X, pady=4)
            ttk.Label(row, text=field["label"], width=16).pack(side=tk.LEFT)
            entry = ttk.Entry(row)
            entry.insert(0, field["text"])
            entry.pack(side=tk.LEFT, fill=tk.X, expand=True)
            store.append(entry)

    def _build_ui(self) -> None:
        frame = ttk.Frame(self.root, padding=12)
        frame.pack(fill=tk.BOTH, expand=True)

        ttk.Label(
            frame,
            text="FormFill Belis — două secvențe cu Tab",
            font=("Helvetica", 12, "bold"),
        ).pack(anchor=tk.W, pady=(0, 8))

        # --- Contact ---
        contact_box = ttk.LabelFrame(frame, text="1. Contact / instituție", padding=8)
        contact_box.pack(fill=tk.X, pady=(0, 10))
        self._add_field_rows(contact_box, self.contact, self.contact_entries)

        contact_actions = ttk.Frame(contact_box)
        contact_actions.pack(fill=tk.X, pady=(8, 0))
        hk_c = "⌘⇧B" if IS_MAC else "Ctrl+Shift+B"
        ttk.Button(
            contact_actions,
            text=f"Completează contact ({hk_c})",
            command=lambda: self.trigger_fill("contact"),
        ).pack(side=tk.LEFT)

        # --- Project ---
        project_box = ttk.LabelFrame(frame, text="2. Proiect (titlu / sumă / punctaj)", padding=8)
        project_box.pack(fill=tk.X, pady=(0, 10))
        self._add_field_rows(project_box, self.project, self.project_entries)

        project_actions = ttk.Frame(project_box)
        project_actions.pack(fill=tk.X, pady=(8, 0))
        hk_p = "⌘⇧P" if IS_MAC else "Ctrl+Shift+P"
        ttk.Button(
            project_actions,
            text=f"Completează proiect ({hk_p})",
            command=lambda: self.trigger_fill("project"),
        ).pack(side=tk.LEFT)

        # --- Global actions ---
        actions = ttk.Frame(frame)
        actions.pack(fill=tk.X, pady=8)
        ttk.Button(actions, text="Salvează tot", command=self.save).pack(side=tk.LEFT)
        ttk.Button(actions, text="Reset Belis", command=self.reset_defaults).pack(
            side=tk.LEFT, padx=8
        )

        ttk.Label(
            frame,
            text="Click pe primul câmp din secțiunea țintă, apoi butonul / hotkey.",
        ).pack(anchor=tk.W, pady=(4, 0))
        ttk.Label(frame, textvariable=self.status_var, wraplength=520).pack(
            anchor=tk.W, pady=(6, 0)
        )

    def _texts(self, kind: str) -> list[str]:
        entries = self.contact_entries if kind == "contact" else self.project_entries
        return [entry.get() for entry in entries]

    def _collect(self, kind: str) -> list[dict]:
        source = self.contact if kind == "contact" else self.project
        entries = self.contact_entries if kind == "contact" else self.project_entries
        out: list[dict] = []
        for index, entry in enumerate(entries):
            label = source[index]["label"] if index < len(source) else f"Câmp {index + 1}"
            out.append({"label": label, "text": entry.get()})
        return out

    def save(self) -> None:
        self.contact = self._collect("contact")
        self.project = self._collect("project")
        save_config(self.contact, self.project)
        self.status_var.set("Câmpuri salvate.")

    def reset_defaults(self) -> None:
        self.contact = [dict(f) for f in DEFAULT_CONTACT]
        self.project = [dict(f) for f in DEFAULT_PROJECT]
        for entry, field in zip(self.contact_entries, self.contact):
            entry.delete(0, tk.END)
            entry.insert(0, field["text"])
        for entry, field in zip(self.project_entries, self.project):
            entry.delete(0, tk.END)
            entry.insert(0, field["text"])
        save_config(self.contact, self.project)
        self.status_var.set("Resetat la datele Belis (contact + proiect).")

    def trigger_fill(self, kind: str) -> None:
        texts = self._texts(kind)
        if not any(t.strip() for t in texts):
            messagebox.showwarning("FormFill", "Nu există text de lipit.")
            return
        label = "contact" if kind == "contact" else "proiect"
        self.status_var.set(f"Trimit {label}… focus pe primul câmp din secțiune.")
        self.root.after(250, lambda: self._run_fill(texts, label))

    def _run_fill(self, texts: list[str], label: str) -> None:
        threading.Thread(
            target=self._fill_worker,
            args=(texts, label),
            daemon=True,
        ).start()

    def _fill_worker(self, texts: list[str], label: str) -> None:
        try:
            self.sequencer.fill(texts)
            self.root.after(
                0, lambda: self.status_var.set(f"Gata — {label} lipit cu Tab.")
            )
        except Exception as exc:
            self.root.after(0, lambda: self.status_var.set(f"Eroare: {exc}"))

    def _start_hotkeys(self) -> None:
        if IS_MAC:
            mapping = {
                "<cmd>+<shift>+b": lambda: self.root.after(
                    0, lambda: self.trigger_fill("contact")
                ),
                "<cmd>+<shift>+p": lambda: self.root.after(
                    0, lambda: self.trigger_fill("project")
                ),
            }
        else:
            mapping = {
                "<ctrl>+<shift>+b": lambda: self.root.after(
                    0, lambda: self.trigger_fill("contact")
                ),
                "<ctrl>+<shift>+p": lambda: self.root.after(
                    0, lambda: self.trigger_fill("project")
                ),
            }

        try:
            self.listener = keyboard.GlobalHotKeys(mapping)
            self.listener.start()
        except Exception as exc:
            self.status_var.set(
                f"Hotkey indisponibil ({exc}). Folosește butoanele din fereastră."
            )

    def on_close(self) -> None:
        try:
            self.save()
        except Exception:
            pass
        if self.listener is not None:
            try:
                self.listener.stop()
            except Exception:
                pass
        self.root.destroy()

    def run(self) -> None:
        self.root.mainloop()


def main() -> None:
    FormFillApp().run()


if __name__ == "__main__":
    main()
