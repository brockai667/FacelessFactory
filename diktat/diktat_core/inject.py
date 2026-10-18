"""Vloženie vyčisteného textu do aktívneho okna (Claude Code v termináli, desktop app, VS Code…).

Predvolene cez schránku + Ctrl+V (spoľahlivé pre diakritiku a viacriadkový text),
alternatívne písanie po znakoch (`type`) alebo len výpis do konzoly (`print`).
"""
from __future__ import annotations

import logging
import platform
import time

log = logging.getLogger("diktat.inject")


def _parse_shortcut(shortcut: str):
    from pynput.keyboard import Key
    names = {
        "ctrl": Key.ctrl, "control": Key.ctrl, "shift": Key.shift, "alt": Key.alt,
        "cmd": Key.cmd, "meta": Key.cmd, "win": Key.cmd, "super": Key.cmd,
        "enter": Key.enter, "insert": Key.insert, "tab": Key.tab,
    }
    parts = [p.strip().lower() for p in shortcut.replace(" ", "").split("+") if p.strip()]
    mods, keys = [], []
    for p in parts:
        if p in names and p not in ("enter", "insert", "tab"):
            mods.append(names[p])
        elif p in names:
            keys.append(names[p])
        else:
            keys.append(p)
    return mods, keys


def _press_combo(controller, shortcut: str) -> None:
    mods, keys = _parse_shortcut(shortcut)
    for m in mods:
        controller.press(m)
    try:
        for k in keys:
            controller.press(k)
            controller.release(k)
    finally:
        for m in reversed(mods):
            controller.release(m)


def foreground_window_info() -> str:
    """Windows: názov aktívneho okna + exe procesu (na ladenie, kam sa vlastne vkladá)."""
    if platform.system() != "Windows":
        return "?"
    try:
        import ctypes
        from ctypes import wintypes
        user32, kernel32 = ctypes.windll.user32, ctypes.windll.kernel32
        hwnd = user32.GetForegroundWindow()
        if not hwnd:
            return "(žiadne aktívne okno)"
        buf = ctypes.create_unicode_buffer(512)
        user32.GetWindowTextW(hwnd, buf, 512)
        pid = wintypes.DWORD()
        user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
        exe = "?"
        handle = kernel32.OpenProcess(0x1000, False, pid.value)   # PROCESS_QUERY_LIMITED_INFORMATION
        if handle:
            try:
                size = wintypes.DWORD(1024)
                path = ctypes.create_unicode_buffer(1024)
                if kernel32.QueryFullProcessImageNameW(handle, 0, path, ctypes.byref(size)):
                    exe = path.value.rsplit("\\", 1)[-1]
            finally:
                kernel32.CloseHandle(handle)
        return f"'{buf.value}' ({exe}, pid {pid.value})"
    except Exception as exc:  # noqa: BLE001
        return f"? ({exc})"


def running_as_admin() -> bool:
    if platform.system() != "Windows":
        return False
    try:
        import ctypes
        return bool(ctypes.windll.shell32.IsUserAnAdmin())
    except Exception:  # noqa: BLE001
        return False


def paste_text(text: str, shortcut: str = "ctrl+v", auto_enter: bool = False,
               restore_clipboard: bool = False, settle_delay: float = 0.35) -> None:
    """Skopíruje text do schránky, vloží skratkou a voliteľne stlačí Enter.

    Text ostáva v schránke (restore_clipboard=False), takže keď vloženie do okna nevyjde,
    stačí ručne Ctrl+V."""
    import pyperclip
    from pynput.keyboard import Controller, Key

    if platform.system() == "Darwin" and shortcut.lower() == "ctrl+v":
        shortcut = "cmd+v"

    target = foreground_window_info()
    log.info("vkladám (%s) do okna %s", shortcut, target)

    previous = None
    if restore_clipboard:
        try:
            previous = pyperclip.paste()
        except Exception:  # noqa: BLE001
            previous = None

    pyperclip.copy(text)
    time.sleep(settle_delay)          # nech používateľ pustí hotkey, inak sa modifikátory pobijú
    kb = Controller()
    _press_combo(kb, shortcut)
    if auto_enter:
        time.sleep(0.25)
        kb.press(Key.enter)
        kb.release(Key.enter)
    log.info("odoslané %s (%d znakov%s). Ak sa text v okne neobjavil, je v schránke – stlač Ctrl+V ručne.",
             shortcut, len(text), " + Enter" if auto_enter else "")

    if restore_clipboard and previous is not None:
        def _restore():
            time.sleep(1.0)
            try:
                pyperclip.copy(previous)
            except Exception:  # noqa: BLE001
                pass
        import threading
        threading.Thread(target=_restore, daemon=True).start()


def type_text(text: str, auto_enter: bool = False, settle_delay: float = 0.35) -> None:
    """Napíše text po znakoch (pomalšie, ale nevyžaduje schránku)."""
    from pynput.keyboard import Controller, Key
    time.sleep(settle_delay)
    kb = Controller()
    kb.type(text)
    if auto_enter:
        kb.press(Key.enter)
        kb.release(Key.enter)


def deliver(text: str, output_cfg: dict, send: bool = False) -> None:
    """Doručí text podľa `output.method`. `send` = používateľ povedal 'pošli to'."""
    method = (output_cfg.get("method") or "paste").lower()
    auto_enter = bool(output_cfg.get("auto_enter")) or send
    if method == "print":
        print(text)
        return
    if method == "type":
        type_text(text, auto_enter=auto_enter)
        return
    paste_text(
        text,
        shortcut=output_cfg.get("paste_shortcut", "ctrl+v"),
        auto_enter=auto_enter,
        restore_clipboard=bool(output_cfg.get("restore_clipboard", False)),
    )
