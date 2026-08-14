#!/usr/bin/env python3
"""FormFill — lipește pe rând mai multe câmpuri, cu Tab între ele.

Două secvențe (contact / proiect), fiecare cu hotkey configurabil.
Înregistrezi combinația din UI, exact ca la QuickPaste.
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
        "Lipseste 'pynput'. Ruleaza run-mac.command / run-windows.bat\n"
        f"Detaliu: {exc}"
    )
    sys.exit(1)


IS_MAC = platform.system() == "Darwin"
IS_WINDOWS = platform.system() == "Windows"
IS_FROZEN = getattr(sys, "frozen", False)

MODIFIER_KEYS = {
    "cmd": {keyboard.Key.cmd, keyboard.Key.cmd_l, keyboard.Key.cmd_r},
    "ctrl": {keyboard.Key.ctrl, keyboard.Key.ctrl_l, keyboard.Key.ctrl_r},
    "alt": {keyboard.Key.alt, keyboard.Key.alt_l, keyboard.Key.alt_r, keyboard.Key.alt_gr},
    "shift": {keyboard.Key.shift, keyboard.Key.shift_l, keyboard.Key.shift_r},
}
MODIFIER_ORDER = ["ctrl", "alt", "shift", "cmd"]
MODIFIER_LABELS = (
    {"cmd": "⌘", "shift": "⇧", "alt": "⌥", "ctrl": "⌃"}
    if IS_MAC
    else {"cmd": "Win+", "shift": "Shift+", "alt": "Alt+", "ctrl": "Ctrl+"}
)

DIGIT_VKS = (
    {18: "1", 19: "2", 20: "3", 21: "4", 23: "5", 22: "6", 26: "7", 28: "8", 25: "9", 29: "0"}
    if IS_MAC
    else {0x30 + n: str(n) for n in range(10)}
)

DEFAULT_CONTACT = [
    {"label": "Institutie / UAT", "text": "UAT COMUNA BELIȘ"},
    {"label": "Reprezentant", "text": "TRIFU VIOLETA"},
    {"label": "E-mail", "text": "primariabelis@yahoo.com"},
    {"label": "Telefon", "text": "0756651119"},
]

DEFAULT_PROJECT = [
    {
        "label": "Titlu proiect",
        "text": "ABILITY Adventure Park Beliș – destinație de aventură incluzivă",
    },
    {"label": "Suma (euro)", "text": "58800.00"},
    {"label": "Punctaj", "text": "95.00"},
]

KINDS = ("contact", "project")


def default_hotkey(kind: str) -> dict:
    mods = ["cmd", "shift"] if IS_MAC else ["ctrl", "shift"]
    key = "b" if kind == "contact" else "p"
    vk = None
    return {"mods": mods, "vk": vk, "key": key}


def app_directory() -> str:
    if IS_FROZEN:
        return os.path.dirname(os.path.abspath(sys.executable))
    return os.path.dirname(os.path.abspath(__file__))


def config_directory() -> str:
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
                "label": str(item.get("label") or "Camp"),
                "text": str(item.get("text") or ""),
            }
        )
    return out if out else [dict(f) for f in fallback]


def _parse_hotkey(raw: object, kind: str) -> dict:
    if not isinstance(raw, dict):
        return default_hotkey(kind)
    mods = [m for m in raw.get("mods", []) if m in MODIFIER_KEYS]
    key = str(raw.get("key") or "")
    if not key:
        return default_hotkey(kind)
    return {"mods": mods, "vk": raw.get("vk"), "key": key}


def load_config() -> dict:
    defaults = {
        "contact": [dict(f) for f in DEFAULT_CONTACT],
        "project": [dict(f) for f in DEFAULT_PROJECT],
        "hotkeys": {
            "contact": default_hotkey("contact"),
            "project": default_hotkey("project"),
        },
    }
    path = config_path()
    if not os.path.exists(path):
        return defaults
    try:
        with open(path, encoding="utf-8") as fh:
            data = json.load(fh)
        if "contact" not in data and isinstance(data.get("fields"), list):
            defaults["contact"] = _parse_fields(data["fields"], DEFAULT_CONTACT)
            return defaults
        return {
            "contact": _parse_fields(data.get("contact"), DEFAULT_CONTACT),
            "project": _parse_fields(data.get("project"), DEFAULT_PROJECT),
            "hotkeys": {
                "contact": _parse_hotkey(
                    (data.get("hotkeys") or {}).get("contact"), "contact"
                ),
                "project": _parse_hotkey(
                    (data.get("hotkeys") or {}).get("project"), "project"
                ),
            },
        }
    except (OSError, json.JSONDecodeError, TypeError):
        return defaults


def save_config(contact: list[dict], project: list[dict], hotkeys: dict) -> None:
    path = config_path()
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(
            {"contact": contact, "project": project, "hotkeys": hotkeys},
            fh,
            ensure_ascii=False,
            indent=2,
        )


def hotkey_label(hotkey: dict | None) -> str:
    if not hotkey or not hotkey.get("key"):
        return "— nesetat —"
    parts = [MODIFIER_LABELS[m] for m in MODIFIER_ORDER if m in hotkey.get("mods", [])]
    key = hotkey["key"]
    return "".join(parts) + (key.upper() if len(key) == 1 else key)


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
                ["pbcopy"], input=text, text=True, check=False
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
            "cmd", "cmd_l", "cmd_r",
            "ctrl", "ctrl_l", "ctrl_r",
            "alt", "alt_l", "alt_r",
            "shift", "shift_l", "shift_r",
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


class HotkeyWatcher:
    """Asculta tastatura global si potriveste / inregistreaza combinatii."""

    def __init__(self, on_trigger, on_capture) -> None:
        self.on_trigger = on_trigger
        self.on_capture = on_capture
        self.hotkeys: list = []  # [(kind, mods_set, vk, key_name)]
        self.active: set = set()
        self.held: set = set()
        self.capturing = False
        self.pending_kind: str | None = None
        self.pending_key: str | None = None
        self.listener = None

    def set_hotkeys(self, hotkeys: dict) -> None:
        self.hotkeys = []
        for kind in KINDS:
            hk = hotkeys.get(kind) or {}
            if not hk.get("key"):
                continue
            self.hotkeys.append(
                (kind, set(hk.get("mods", [])), hk.get("vk"), hk.get("key", ""))
            )

    def start(self) -> None:
        if self.listener is not None:
            return
        self.listener = keyboard.Listener(on_press=self._press, on_release=self._release)
        self.listener.daemon = True
        self.listener.start()

    def stop(self) -> None:
        if self.listener is not None:
            self.listener.stop()
            self.listener = None

    @staticmethod
    def _modifier_name(key):
        for name, keys in MODIFIER_KEYS.items():
            if key in keys:
                return name
        return None

    @staticmethod
    def _key_identity(key):
        vk = getattr(key, "vk", None)
        if vk in DIGIT_VKS:
            return vk, DIGIT_VKS[vk]
        name = getattr(key, "name", None)
        if name:
            return vk, name
        char = getattr(key, "char", None)
        if char:
            return vk, char.lower()
        return vk, str(vk) if vk is not None else ""

    def _press(self, key) -> None:
        modifier = self._modifier_name(key)
        if modifier:
            self.active.add(modifier)
            return

        vk, name = self._key_identity(key)
        if not name or name in self.held:
            return
        self.held.add(name)

        if self.capturing:
            self.capturing = False
            self.on_capture({"mods": sorted(self.active), "vk": vk, "key": name})
            return

        for kind, mods, hot_vk, hot_key in self.hotkeys:
            same_key = (hot_vk is not None and hot_vk == vk) or hot_key == name
            if same_key and mods == self.active:
                self.pending_kind = kind
                self.pending_key = name
                return

    def _release(self, key) -> None:
        modifier = self._modifier_name(key)
        if modifier:
            self.active.discard(modifier)
            self.held.clear()
            return

        _, name = self._key_identity(key)
        self.held.discard(name)

        if self.pending_kind is not None and name == self.pending_key:
            kind = self.pending_kind
            self.pending_kind = None
            self.pending_key = None
            self.on_trigger(kind)


class FormFillApp:
    def __init__(self) -> None:
        self.root = tk.Tk()
        self.root.title("FormFill — Belis")
        self.root.minsize(540, 620)
        self.root.geometry("580x680")

        cfg = load_config()
        self.contact = cfg["contact"]
        self.project = cfg["project"]
        self.hotkeys = cfg["hotkeys"]
        self.contact_entries: list[tk.Entry] = []
        self.project_entries: list[tk.Entry] = []
        self.sequencer = Sequencer()
        self.watcher = HotkeyWatcher(self.on_hotkey, self.on_captured)
        self.recording_kind: str | None = None
        self.capture_job = None

        self.hotkey_vars = {
            "contact": tk.StringVar(value=hotkey_label(self.hotkeys["contact"])),
            "project": tk.StringVar(value=hotkey_label(self.hotkeys["project"])),
        }
        self.record_buttons: dict[str, ttk.Button] = {}
        self.status_var = tk.StringVar(value="Gata. Inregistreaza hotkey-urile sau foloseste butoanele.")

        self._build_ui()
        self.watcher.set_hotkeys(self.hotkeys)
        self.watcher.start()
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

    def _hotkey_row(self, parent: ttk.Frame, kind: str) -> None:
        row = ttk.Frame(parent)
        row.pack(fill=tk.X, pady=(8, 0))
        ttk.Label(row, text="Hotkey:").pack(side=tk.LEFT)
        ttk.Label(
            row,
            textvariable=self.hotkey_vars[kind],
            font=("TkDefaultFont", 12, "bold"),
            width=14,
        ).pack(side=tk.LEFT, padx=(4, 8))
        btn = ttk.Button(
            row,
            text="Inregistreaza",
            command=lambda k=kind: self.start_capture(k),
        )
        btn.pack(side=tk.LEFT)
        self.record_buttons[kind] = btn
        ttk.Button(
            row, text="Sterge", command=lambda k=kind: self.clear_hotkey(k)
        ).pack(side=tk.LEFT, padx=6)

    def _build_ui(self) -> None:
        frame = ttk.Frame(self.root, padding=12)
        frame.pack(fill=tk.BOTH, expand=True)

        ttk.Label(
            frame,
            text="FormFill Belis — doua secvente cu Tab",
            font=("Helvetica", 12, "bold"),
        ).pack(anchor=tk.W, pady=(0, 8))

        contact_box = ttk.LabelFrame(frame, text="1. Contact / institutie", padding=8)
        contact_box.pack(fill=tk.X, pady=(0, 10))
        self._add_field_rows(contact_box, self.contact, self.contact_entries)
        self._hotkey_row(contact_box, "contact")
        contact_actions = ttk.Frame(contact_box)
        contact_actions.pack(fill=tk.X, pady=(8, 0))
        ttk.Button(
            contact_actions,
            text="Completeaza contact",
            command=lambda: self.trigger_fill("contact"),
        ).pack(side=tk.LEFT)

        project_box = ttk.LabelFrame(
            frame, text="2. Proiect (titlu / suma / punctaj)", padding=8
        )
        project_box.pack(fill=tk.X, pady=(0, 10))
        self._add_field_rows(project_box, self.project, self.project_entries)
        self._hotkey_row(project_box, "project")
        project_actions = ttk.Frame(project_box)
        project_actions.pack(fill=tk.X, pady=(8, 0))
        ttk.Button(
            project_actions,
            text="Completeaza proiect",
            command=lambda: self.trigger_fill("project"),
        ).pack(side=tk.LEFT)

        actions = ttk.Frame(frame)
        actions.pack(fill=tk.X, pady=8)
        ttk.Button(actions, text="Salveaza tot", command=self.save).pack(side=tk.LEFT)
        ttk.Button(actions, text="Reset Belis", command=self.reset_defaults).pack(
            side=tk.LEFT, padx=8
        )

        ttk.Label(
            frame,
            text="Click pe primul camp tinta, apoi butonul / hotkey. Hotkey-urile se salveaza automat.",
            wraplength=520,
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
            label = source[index]["label"] if index < len(source) else f"Camp {index + 1}"
            out.append({"label": label, "text": entry.get()})
        return out

    def save(self) -> None:
        self.contact = self._collect("contact")
        self.project = self._collect("project")
        save_config(self.contact, self.project, self.hotkeys)
        self.watcher.set_hotkeys(self.hotkeys)
        self.status_var.set("Campuri + hotkeys salvate.")

    def reset_defaults(self) -> None:
        self.contact = [dict(f) for f in DEFAULT_CONTACT]
        self.project = [dict(f) for f in DEFAULT_PROJECT]
        self.hotkeys = {
            "contact": default_hotkey("contact"),
            "project": default_hotkey("project"),
        }
        for entry, field in zip(self.contact_entries, self.contact):
            entry.delete(0, tk.END)
            entry.insert(0, field["text"])
        for entry, field in zip(self.project_entries, self.project):
            entry.delete(0, tk.END)
            entry.insert(0, field["text"])
        for kind in KINDS:
            self.hotkey_vars[kind].set(hotkey_label(self.hotkeys[kind]))
        save_config(self.contact, self.project, self.hotkeys)
        self.watcher.set_hotkeys(self.hotkeys)
        self.status_var.set("Resetat la datele Belis + hotkeys implicite.")

    def start_capture(self, kind: str) -> None:
        if self.capture_job is not None:
            self.root.after_cancel(self.capture_job)
        self.recording_kind = kind
        self.watcher.capturing = True
        self.record_buttons[kind].state(["disabled"])
        self.hotkey_vars[kind].set("apasa combinatia...")
        self.status_var.set(f"Inregistreaza hotkey pentru {kind}...")
        self.capture_job = self.root.after(8000, lambda: self._cancel_capture(kind))

    def _cancel_capture(self, kind: str) -> None:
        if self.recording_kind != kind:
            return
        self.watcher.capturing = False
        self.recording_kind = None
        self.capture_job = None
        self.record_buttons[kind].state(["!disabled"])
        self.hotkey_vars[kind].set(hotkey_label(self.hotkeys[kind]))
        self.status_var.set("Inregistrare anulata (timeout).")

    def on_captured(self, hotkey: dict) -> None:
        self.root.after(0, lambda: self._store_hotkey(hotkey))

    def _store_hotkey(self, hotkey: dict) -> None:
        kind = self.recording_kind
        self.recording_kind = None
        if self.capture_job is not None:
            self.root.after_cancel(self.capture_job)
            self.capture_job = None
        if kind is None:
            return
        self.record_buttons[kind].state(["!disabled"])

        other = "project" if kind == "contact" else "contact"
        other_hk = self.hotkeys[other]
        if other_hk.get("key") == hotkey["key"] and set(other_hk.get("mods", [])) == set(
            hotkey["mods"]
        ):
            self.hotkey_vars[kind].set(hotkey_label(self.hotkeys[kind]))
            messagebox.showwarning(
                "FormFill",
                f"Combinatia {hotkey_label(hotkey)} e deja folosita de {other}.",
            )
            return

        if not hotkey["mods"]:
            messagebox.showinfo(
                "FormFill",
                "Recomandat: include cel putin un modificator (Ctrl/Cmd/Alt/Shift).",
            )

        self.hotkeys[kind] = hotkey
        self.hotkey_vars[kind].set(hotkey_label(hotkey))
        self.save()
        self.status_var.set(f"Hotkey {kind}: {hotkey_label(hotkey)}")

    def clear_hotkey(self, kind: str) -> None:
        self.hotkeys[kind] = {"mods": [], "vk": None, "key": ""}
        self.hotkey_vars[kind].set(hotkey_label(self.hotkeys[kind]))
        self.save()
        self.status_var.set(f"Hotkey {kind} sters.")

    def on_hotkey(self, kind: str) -> None:
        self.root.after(0, lambda: self.trigger_fill(kind))

    def trigger_fill(self, kind: str) -> None:
        texts = self._texts(kind)
        if not any(t.strip() for t in texts):
            messagebox.showwarning("FormFill", "Nu exista text de lipit.")
            return
        label = "contact" if kind == "contact" else "proiect"
        self.status_var.set(f"Trimit {label}... focus pe primul camp din sectiune.")
        self.root.after(250, lambda: self._run_fill(texts, label))

    def _run_fill(self, texts: list[str], label: str) -> None:
        threading.Thread(
            target=self._fill_worker, args=(texts, label), daemon=True
        ).start()

    def _fill_worker(self, texts: list[str], label: str) -> None:
        try:
            self.sequencer.fill(texts)
            self.root.after(
                0, lambda: self.status_var.set(f"Gata — {label} lipit cu Tab.")
            )
        except Exception as exc:
            self.root.after(0, lambda: self.status_var.set(f"Eroare: {exc}"))

    def on_close(self) -> None:
        try:
            self.save()
        except Exception:
            pass
        self.watcher.stop()
        self.root.destroy()

    def run(self) -> None:
        self.root.mainloop()


def main() -> None:
    FormFillApp().run()


if __name__ == "__main__":
    main()
