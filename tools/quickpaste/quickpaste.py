#!/usr/bin/env python3
"""QuickPaste - texte predefinite lipite oriunde, cu combinatii de taste alese de tine.

Fiecare slot are propriul text si propria combinatie de taste, inregistrata
direct din interfata. Combinatiile functioneaza global: in orice browser,
pe orice site, in orice aplicatie.
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
except ImportError as exc:  # pragma: no cover - depinde de mediu
    print(
        "Lipseste dependenta 'pynput'. Ruleaza:\n"
        "    python3 -m pip install -r requirements.txt\n"
        "sau porneste aplicatia cu run-mac.command / run-windows.bat.\n"
        f"Detaliu: {exc}"
    )
    sys.exit(1)


IS_MAC = platform.system() == "Darwin"
IS_WINDOWS = platform.system() == "Windows"
IS_FROZEN = getattr(sys, "frozen", False)


def app_directory() -> str:
    """Folderul din care ruleaza aplicatia (langa executabil sau langa script)."""
    if IS_FROZEN:
        return os.path.dirname(os.path.abspath(sys.executable))
    return os.path.dirname(os.path.abspath(__file__))


def config_directory() -> str:
    """Unde tinem snippets.json.

    Daca exista fisierul-marcaj `portable.txt` langa executabil, salvam acolo:
    asa poti tine aplicatia si textele pe un stick si le muti impreuna.
    Altfel folosim folderul standard de date al sistemului, fiindca interiorul
    unui .app sau al unui folder Program Files nu e mereu inscriptibil.
    """
    base = app_directory()
    if os.path.exists(os.path.join(base, "portable.txt")):
        return base

    if IS_WINDOWS:
        root = os.environ.get("APPDATA") or os.path.expanduser("~")
        return os.path.join(root, "QuickPaste")
    if IS_MAC:
        return os.path.join(os.path.expanduser("~"), "Library", "Application Support", "QuickPaste")
    return os.path.join(os.path.expanduser("~"), ".config", "quickpaste")


def config_path() -> str:
    directory = config_directory()
    try:
        os.makedirs(directory, exist_ok=True)
    except OSError:
        directory = os.path.expanduser("~")
    return os.path.join(directory, "snippets.json")


CONFIG_PATH = config_path()

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

# Codurile fizice ale tastelor de pe randul cifrelor. Cu Shift sau Option apasate
# caracterul generat difera (! sau ¡), deci comparam coduri, nu caractere.
DIGIT_VKS = (
    {18: "1", 19: "2", 20: "3", 21: "4", 23: "5", 22: "6", 26: "7", 28: "8", 25: "9", 29: "0"}
    if IS_MAC
    else {0x30 + n: str(n) for n in range(10)}
)


def default_slots() -> list:
    """Sase sloturi pregatite cu Cmd/Ctrl + Shift + 1..6."""
    mods = ["cmd", "shift"] if IS_MAC else ["ctrl", "alt"]
    slots = []
    for index in range(6):
        digit = str(index + 1)
        vk = next((code for code, name in DIGIT_VKS.items() if name == digit), None)
        slots.append(
            {
                "name": f"Slot {digit}",
                "text": "",
                "hotkey": {"mods": mods, "vk": vk, "key": digit},
            }
        )
    return slots


def default_config() -> dict:
    return {
        "mode": "paste",  # "paste" = clipboard + Cmd/Ctrl+V | "type" = tastare simulata
        "auto_tab": False,
        "slots": default_slots(),
    }


def load_config() -> dict:
    config = default_config()
    if not os.path.exists(CONFIG_PATH):
        return config
    try:
        with open(CONFIG_PATH, "r", encoding="utf-8") as handle:
            stored = json.load(handle)
    except (OSError, json.JSONDecodeError):
        return config

    if stored.get("mode") in ("paste", "type"):
        config["mode"] = stored["mode"]
    config["auto_tab"] = bool(stored.get("auto_tab", False))

    slots = []
    for item in stored.get("slots", []):
        hotkey = item.get("hotkey") or {}
        slots.append(
            {
                "name": str(item.get("name") or f"Slot {len(slots) + 1}"),
                "text": str(item.get("text") or ""),
                "hotkey": {
                    "mods": [m for m in hotkey.get("mods", []) if m in MODIFIER_KEYS],
                    "vk": hotkey.get("vk"),
                    "key": str(hotkey.get("key") or ""),
                },
            }
        )
    if slots:
        config["slots"] = slots
    return config


def save_config(config: dict) -> None:
    try:
        with open(CONFIG_PATH, "w", encoding="utf-8") as handle:
            json.dump(config, handle, ensure_ascii=False, indent=2)
    except OSError as exc:  # pragma: no cover
        print(f"Nu am putut salva {CONFIG_PATH}: {exc}")


def hotkey_label(hotkey: dict) -> str:
    if not hotkey or not hotkey.get("key"):
        return "— nesetat —"
    parts = [MODIFIER_LABELS[m] for m in MODIFIER_ORDER if m in hotkey.get("mods", [])]
    key = hotkey["key"]
    return "".join(parts) + (key.upper() if len(key) == 1 else key)


# --------------------------------------------------------------- clipboard ---


CF_UNICODETEXT = 13
GMEM_MOVEABLE = 0x0002


def _windows_clipboard_read() -> str:
    import ctypes
    from ctypes import wintypes

    user32 = ctypes.windll.user32
    kernel32 = ctypes.windll.kernel32
    if not user32.OpenClipboard(None):
        return ""
    try:
        handle = user32.GetClipboardData(CF_UNICODETEXT)
        if not handle:
            return ""
        kernel32.GlobalLock.restype = ctypes.c_void_p
        pointer = kernel32.GlobalLock(ctypes.c_void_p(handle))
        if not pointer:
            return ""
        try:
            return ctypes.c_wchar_p(pointer).value or ""
        finally:
            kernel32.GlobalUnlock(ctypes.c_void_p(handle))
    finally:
        user32.CloseClipboard()


def _windows_clipboard_write(text: str) -> bool:
    import ctypes

    user32 = ctypes.windll.user32
    kernel32 = ctypes.windll.kernel32
    size = (len(text) + 1) * ctypes.sizeof(ctypes.c_wchar)

    kernel32.GlobalAlloc.restype = ctypes.c_void_p
    kernel32.GlobalLock.restype = ctypes.c_void_p
    handle = kernel32.GlobalAlloc(GMEM_MOVEABLE, size)
    if not handle:
        return False

    pointer = kernel32.GlobalLock(ctypes.c_void_p(handle))
    if not pointer:
        return False
    ctypes.memmove(pointer, ctypes.create_unicode_buffer(text), size)
    kernel32.GlobalUnlock(ctypes.c_void_p(handle))

    if not user32.OpenClipboard(None):
        return False
    try:
        user32.EmptyClipboard()
        return bool(user32.SetClipboardData(CF_UNICODETEXT, ctypes.c_void_p(handle)))
    finally:
        user32.CloseClipboard()


def clipboard_read() -> str:
    try:
        if IS_MAC:
            return subprocess.run(["pbpaste"], capture_output=True, text=True).stdout
        if IS_WINDOWS:
            return _windows_clipboard_read()
    except Exception:
        pass
    return ""


def clipboard_write(text: str) -> bool:
    try:
        if IS_MAC:
            subprocess.run(["pbcopy"], input=text, text=True, check=True)
            return True
        if IS_WINDOWS:
            return _windows_clipboard_write(text)
    except Exception:
        return False
    return False


def accessibility_granted() -> bool:
    """True daca procesul curent poate citi tastele si controla alte aplicatii."""
    if not IS_MAC:
        return True

    listen_ok = True
    post_ok = True
    try:
        from Quartz import CGPreflightListenEventAccess, CGPreflightPostEventAccess

        listen_ok = bool(CGPreflightListenEventAccess())
        post_ok = bool(CGPreflightPostEventAccess())
    except Exception:
        pass

    ax_ok = True
    try:
        from ApplicationServices import AXIsProcessTrusted

        ax_ok = bool(AXIsProcessTrusted())
    except Exception:
        pass

    # Pentru hotkeys e nevoie de Input Monitoring (listen).
    # Pentru lipire e nevoie de Accessibility / post events.
    return listen_ok and post_ok and ax_ok


def request_accessibility() -> None:
    """Cere toate permisiunile necesare pe macOS."""
    if not IS_MAC:
        return
    try:
        from Quartz import CGRequestListenEventAccess, CGRequestPostEventAccess

        CGRequestListenEventAccess()
        CGRequestPostEventAccess()
    except Exception:
        pass
    try:
        from ApplicationServices import (
            AXIsProcessTrustedWithOptions,
            kAXTrustedCheckOptionPrompt,
        )

        AXIsProcessTrustedWithOptions({kAXTrustedCheckOptionPrompt: True})
    except Exception:
        pass
    open_accessibility_settings()


def open_accessibility_settings() -> None:
    # Deschide ambele panouri relevante: Accessibility + Input Monitoring.
    for url in (
        "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility",
        "x-apple.systempreferences:com.apple.preference.security?Privacy_ListenEvent",
    ):
        subprocess.run(["open", url], check=False)


class Paster:
    """Trimite textul catre aplicatia care are focusul."""

    def __init__(self) -> None:
        self.controller = keyboard.Controller()
        self._pasteboard = None
        self._restore_token = 0
        self._lock = threading.Lock()
        if IS_MAC:
            try:
                from AppKit import NSPasteboard

                self._pasteboard = NSPasteboard.generalPasteboard()
            except Exception:
                self._pasteboard = None

    def _release_modifiers(self) -> None:
        """Modificatorii sunt inca apasati fizic cand se declanseaza hotkey-ul."""
        for key in (
            keyboard.Key.cmd,
            keyboard.Key.ctrl,
            keyboard.Key.alt,
            keyboard.Key.shift,
        ):
            try:
                self.controller.release(key)
            except Exception:
                pass

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
                return bool(self._pasteboard.setString_forType_(text, NSPasteboardTypeString))
            except Exception:
                pass
        return clipboard_write(text)

    def _schedule_restore(self, previous: str) -> None:
        """Restaureaza clipboardul, dar anuleaza restaurarile vechi la lipiri noi."""
        if not previous:
            return
        with self._lock:
            self._restore_token += 1
            token = self._restore_token

        def restore() -> None:
            with self._lock:
                if token != self._restore_token:
                    return
            self._write_clipboard(previous)

        threading.Timer(0.7, restore).start()

    def _paste_chord(self) -> None:
        modifier = keyboard.Key.cmd if IS_MAC else keyboard.Key.ctrl
        with self.controller.pressed(modifier):
            self.controller.tap("v")

    def send(self, text: str, mode: str, auto_tab: bool) -> None:
        if not text:
            return

        # Anuleaza restaurarea clipboardului din lipirea anterioara, altfel
        # textul vechi poate inlocui clipboardul in mijlocul unei secvente rapide.
        with self._lock:
            self._restore_token += 1

        self._release_modifiers()
        # Asteapta scurt ca utilizatorul sa ridice modificatorii fizici.
        time.sleep(0.025)

        if mode == "type":
            self.controller.type(text)
        else:
            previous = self._read_clipboard()
            if not self._write_clipboard(text):
                self.controller.type(text)
            else:
                time.sleep(0.012)
                self._paste_chord()
                self._schedule_restore(previous)

        if auto_tab:
            time.sleep(0.018)
            self.controller.tap(keyboard.Key.tab)


# ----------------------------------------------------------------- hotkeys ---


class HotkeyWatcher:
    """Asculta tastatura la nivel de sistem si potriveste combinatiile definite."""

    def __init__(self, on_trigger, on_capture) -> None:
        self.on_trigger = on_trigger
        self.on_capture = on_capture
        self.hotkeys: list = []  # [(index, mods_set, vk, key_name)]
        self.active: set = set()
        self.held: set = set()
        self.capturing = False
        self.listener = None

    def set_hotkeys(self, slots: list) -> None:
        self.hotkeys = [
            (
                index,
                set(slot["hotkey"].get("mods", [])),
                slot["hotkey"].get("vk"),
                slot["hotkey"].get("key", ""),
            )
            for index, slot in enumerate(slots)
            if slot["hotkey"].get("key")
        ]

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
        """Returneaza (vk, nume afisabil) pentru o tasta care nu e modificator."""
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

        for index, mods, hot_vk, hot_key in self.hotkeys:
            same_key = (hot_vk is not None and hot_vk == vk) or hot_key == name
            if same_key and mods == self.active:
                self.on_trigger(index)
                return

    def _release(self, key) -> None:
        modifier = self._modifier_name(key)
        if modifier:
            self.active.discard(modifier)
            self.held.clear()
            return
        _, name = self._key_identity(key)
        self.held.discard(name)


# --------------------------------------------------------------- interfata ---


class QuickPasteApp:
    def __init__(self, root: tk.Tk) -> None:
        self.root = root
        self.config = load_config()
        self.paster = Paster()
        self.watcher = HotkeyWatcher(self.on_hotkey, self.on_captured)
        self.selected = 0
        self.capture_job = None

        root.title("QuickPaste")
        root.geometry("820x520")
        root.minsize(720, 460)

        self._build_ui()
        self._refresh_list()
        self._select(0)
        self._apply_hotkeys()
        self.watcher.start()
        if not accessibility_granted():
            request_accessibility()
        self._check_permission()

        root.bind("<Escape>", lambda _e: self.cancel_capture())
        root.protocol("WM_DELETE_WINDOW", self.on_close)

    # ------------------------------------------------------------------ ui ---

    def _build_ui(self) -> None:
        self.warning_frame = tk.Frame(self.root, bg="#fef3c7")
        self.warning_label = tk.Label(
            self.warning_frame,
            bg="#fef3c7",
            fg="#92400e",
            justify="left",
            wraplength=520,
            text=(
                "Permisiunea lipseste pentru ACEASTA versiune. Sterge QuickPaste din "
                "Accessibility (butonul −), verifica si Input Monitoring, apoi apasa "
                "„Cere permisiunea” si reporneste."
            ),
        )
        self.warning_label.pack(side="left", padx=12, pady=8)
        tk.Button(
            self.warning_frame,
            text="Deschide setarile",
            command=open_accessibility_settings,
        ).pack(side="right", padx=(4, 12), pady=6)
        tk.Button(
            self.warning_frame,
            text="Cere permisiunea",
            command=request_accessibility,
        ).pack(side="right", pady=6)

        toolbar = ttk.Frame(self.root, padding=(12, 10, 12, 4))
        toolbar.pack(fill="x")
        self.toolbar = toolbar

        ttk.Label(toolbar, text="Lipire:").pack(side="left")
        self.mode_var = tk.StringVar(value=self.config["mode"])
        mode_box = ttk.Combobox(
            toolbar,
            textvariable=self.mode_var,
            values=["paste", "type"],
            state="readonly",
            width=8,
        )
        mode_box.pack(side="left", padx=(6, 16))
        mode_box.bind("<<ComboboxSelected>>", self.on_mode_change)

        self.auto_tab_var = tk.BooleanVar(value=self.config["auto_tab"])
        ttk.Checkbutton(
            toolbar,
            text="Tab automat dupa lipire",
            variable=self.auto_tab_var,
            command=self.on_auto_tab_change,
        ).pack(side="left")

        body = ttk.Frame(self.root, padding=(12, 4))
        body.pack(fill="both", expand=True)

        left = ttk.Frame(body)
        left.pack(side="left", fill="both")

        self.tree = ttk.Treeview(
            left, columns=("hotkey", "text"), show="tree headings", height=13, selectmode="browse"
        )
        self.tree.heading("#0", text="Slot")
        self.tree.heading("hotkey", text="Combinatie")
        self.tree.heading("text", text="Text")
        self.tree.column("#0", width=130, stretch=False)
        self.tree.column("hotkey", width=110, stretch=False)
        self.tree.column("text", width=180, stretch=False)
        self.tree.pack(fill="both", expand=True)
        self.tree.bind("<<TreeviewSelect>>", self.on_tree_select)

        list_buttons = ttk.Frame(left, padding=(0, 8, 0, 0))
        list_buttons.pack(fill="x")
        ttk.Button(list_buttons, text="+ Slot", width=9, command=self.add_slot).pack(side="left")
        ttk.Button(list_buttons, text="− Slot", width=9, command=self.remove_slot).pack(
            side="left", padx=6
        )

        right = ttk.Frame(body, padding=(14, 0, 0, 0))
        right.pack(side="left", fill="both", expand=True)

        ttk.Label(right, text="Nume slot").pack(anchor="w")
        self.name_var = tk.StringVar()
        name_entry = ttk.Entry(right, textvariable=self.name_var)
        name_entry.pack(fill="x", pady=(2, 10))
        name_entry.bind("<KeyRelease>", lambda _e: self.on_edit())

        hotkey_row = ttk.Frame(right)
        hotkey_row.pack(fill="x", pady=(0, 10))
        ttk.Label(hotkey_row, text="Combinatie:").pack(side="left")
        self.hotkey_var = tk.StringVar(value="—")
        ttk.Label(
            hotkey_row, textvariable=self.hotkey_var, font=("TkDefaultFont", 13, "bold")
        ).pack(side="left", padx=(8, 12))
        self.record_button = ttk.Button(
            hotkey_row, text="Inregistreaza", command=self.start_capture
        )
        self.record_button.pack(side="left")
        ttk.Button(hotkey_row, text="Sterge", command=self.clear_hotkey).pack(side="left", padx=6)

        ttk.Label(right, text="Text de lipit").pack(anchor="w")
        self.text_widget = tk.Text(right, height=9, wrap="word", undo=True)
        self.text_widget.pack(fill="both", expand=True, pady=(2, 8))
        self.text_widget.bind("<KeyRelease>", lambda _e: self.on_edit())

        actions = ttk.Frame(right)
        actions.pack(fill="x")
        ttk.Button(actions, text="Testeaza (3s)", command=self.test_slot).pack(side="left")
        ttk.Button(actions, text="Goleste textul", command=self.clear_text).pack(
            side="left", padx=6
        )

        footer = ttk.Frame(self.root, padding=(12, 4, 12, 10))
        footer.pack(fill="x")
        self.status_var = tk.StringVar(value="")
        ttk.Label(footer, textvariable=self.status_var, foreground="#4f46e5").pack(anchor="w")
        ttk.Label(
            footer,
            text=(
                "Apesi „Inregistreaza”, apoi combinatia dorita (ex. Command + 1). "
                + (
                    "Pe macOS trebuie sa bifezi aplicatia in System Settings → Privacy & "
                    "Security → Accessibility, altfel tastele nu sunt citite."
                    if IS_MAC
                    else "Pe Windows nu sunt necesare permisiuni suplimentare."
                )
            ),
            wraplength=780,
            foreground="#6b7280",
        ).pack(anchor="w", pady=(4, 0))

    # ------------------------------------------------------------- helpers ---

    @property
    def slots(self) -> list:
        return self.config["slots"]

    def _refresh_list(self) -> None:
        self.tree.delete(*self.tree.get_children())
        for index, slot in enumerate(self.slots):
            preview = slot["text"].replace("\n", " ⏎ ")
            if len(preview) > 26:
                preview = preview[:26] + "…"
            self.tree.insert(
                "",
                "end",
                iid=str(index),
                text=slot["name"],
                values=(hotkey_label(slot["hotkey"]), preview or "(gol)"),
            )

    def _select(self, index: int) -> None:
        if not self.slots:
            return
        if self.watcher.capturing:
            self.cancel_capture()
        index = max(0, min(index, len(self.slots) - 1))
        self.selected = index
        slot = self.slots[index]
        self.name_var.set(slot["name"])
        self.hotkey_var.set(hotkey_label(slot["hotkey"]))
        self.text_widget.delete("1.0", tk.END)
        self.text_widget.insert("1.0", slot["text"])
        self.tree.selection_set(str(index))

    def _check_permission(self) -> None:
        """Reverifica periodic: permisiunea poate fi acordata cu aplicatia deschisa."""
        if accessibility_granted():
            self.warning_frame.pack_forget()
        else:
            self.warning_frame.pack(fill="x", before=self.toolbar)
        self.root.after(3000, self._check_permission)

    def _apply_hotkeys(self) -> None:
        self.watcher.set_hotkeys(self.slots)
        active = sum(1 for slot in self.slots if slot["hotkey"].get("key"))
        self.set_status(f"{active} combinatii active")

    def set_status(self, message: str) -> None:
        self.root.after(0, lambda: self.status_var.set(message))

    def _persist(self) -> None:
        save_config(self.config)
        self._refresh_list()
        self.tree.selection_set(str(self.selected))
        self._apply_hotkeys()

    # -------------------------------------------------------------- events ---

    def on_tree_select(self, _event) -> None:
        selection = self.tree.selection()
        if selection and int(selection[0]) != self.selected:
            self._select(int(selection[0]))

    def on_edit(self) -> None:
        slot = self.slots[self.selected]
        slot["name"] = self.name_var.get().strip() or f"Slot {self.selected + 1}"
        slot["text"] = self.text_widget.get("1.0", "end-1c")
        self._persist()

    def on_mode_change(self, _event) -> None:
        self.config["mode"] = self.mode_var.get()
        save_config(self.config)

    def on_auto_tab_change(self) -> None:
        self.config["auto_tab"] = self.auto_tab_var.get()
        save_config(self.config)

    def add_slot(self) -> None:
        self.slots.append(
            {
                "name": f"Slot {len(self.slots) + 1}",
                "text": "",
                "hotkey": {"mods": [], "vk": None, "key": ""},
            }
        )
        self.selected = len(self.slots) - 1
        self._persist()
        self._select(self.selected)

    def remove_slot(self) -> None:
        if len(self.slots) <= 1:
            messagebox.showinfo("QuickPaste", "Trebuie sa ramana cel putin un slot.")
            return
        self.slots.pop(self.selected)
        self.selected = max(0, self.selected - 1)
        self._persist()
        self._select(self.selected)

    def clear_text(self) -> None:
        self.text_widget.delete("1.0", tk.END)
        self.on_edit()

    def clear_hotkey(self) -> None:
        self.slots[self.selected]["hotkey"] = {"mods": [], "vk": None, "key": ""}
        self.hotkey_var.set(hotkey_label(None))
        self._persist()

    # ------------------------------------------------------------ hotkeys ---

    def start_capture(self) -> None:
        if not accessibility_granted():
            request_accessibility()
            messagebox.showwarning(
                "QuickPaste",
                "Fara permisiunea Accessibility nu pot citi tastele. "
                "Accepta dialogul sistemului si reporneste aplicatia.",
            )
            return

        self.record_button.state(["disabled"])
        self.hotkey_var.set("apasa combinatia...")
        self.set_status("Astept combinatia de taste (Esc anuleaza)")
        self.watcher.capturing = True
        self.capture_job = self.root.after(10000, self.cancel_capture)

    def cancel_capture(self, message: str = "Inregistrare anulata") -> None:
        if self.capture_job is not None:
            self.root.after_cancel(self.capture_job)
            self.capture_job = None
        if not self.watcher.capturing and message == "Inregistrare anulata":
            return
        self.watcher.capturing = False
        self.record_button.state(["!disabled"])
        self.hotkey_var.set(hotkey_label(self.slots[self.selected]["hotkey"]))
        self.set_status(message)

    def on_captured(self, hotkey: dict) -> None:
        """Apelat din thread-ul listener-ului."""
        self.root.after(0, lambda: self._store_hotkey(hotkey))

    def _store_hotkey(self, hotkey: dict) -> None:
        if self.capture_job is not None:
            self.root.after_cancel(self.capture_job)
            self.capture_job = None
        self.record_button.state(["!disabled"])

        for index, slot in enumerate(self.slots):
            if index == self.selected:
                continue
            other = slot["hotkey"]
            if other.get("key") == hotkey["key"] and set(other.get("mods", [])) == set(
                hotkey["mods"]
            ):
                self.hotkey_var.set(hotkey_label(self.slots[self.selected]["hotkey"]))
                messagebox.showwarning(
                    "QuickPaste",
                    f"Combinatia {hotkey_label(hotkey)} este deja folosita de „{slot['name']}”.",
                )
                return

        self.slots[self.selected]["hotkey"] = hotkey
        self.hotkey_var.set(hotkey_label(hotkey))
        self._persist()

        if not hotkey["mods"]:
            self.set_status("Atentie: fara modificator, combinatia se declanseaza la scris")

    def on_hotkey(self, index: int) -> None:
        """Apelat din thread-ul listener-ului."""
        slot = self.slots[index]
        if not slot["text"]:
            self.set_status(f"„{slot['name']}” nu are text")
            return
        self.set_status(f"Lipit: {slot['name']}")
        threading.Thread(
            target=self.paster.send,
            args=(slot["text"], self.config["mode"], self.config["auto_tab"]),
            daemon=True,
        ).start()

    def test_slot(self) -> None:
        if not self.slots[self.selected]["text"]:
            messagebox.showinfo("QuickPaste", "Slotul nu are text.")
            return
        self.set_status("Ai 3 secunde sa dai click in campul tinta...")
        threading.Timer(3.0, lambda: self.on_hotkey(self.selected)).start()

    def on_close(self) -> None:
        self.watcher.stop()
        save_config(self.config)
        self.root.destroy()


def main() -> None:
    root = tk.Tk()
    try:
        ttk.Style().theme_use("clam")
    except tk.TclError:
        pass
    QuickPasteApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
