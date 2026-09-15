"""Malý prúžok navrchu obrazovky so stavom diktovania (tkinter, vlastné vlákno, nikdy neberie fokus).

Stavy: „štartujem…“, „🔴 NAHRÁVAM 0:12“, „📝 prepisujem… časť 2 hotová“, „✅ vložené 239 znakov“, chyby.
Bez tkinteru / bez displeja sa všetko tvári ako no-op.
"""
from __future__ import annotations

import logging
import queue
import sys
import threading
import time

log = logging.getLogger("diktat.overlay")

COLORS = {"info": "#2b2b2b", "ready": "#1f6f3f", "rec": "#b00020", "stt": "#a86b00", "ok": "#1f6f3f", "error": "#6a1b9a"}


class Overlay:
    def __init__(self, enabled: bool = True, alpha: float = 0.92, font_size: int = 12, top_margin: int = 10):
        self.enabled = bool(enabled)
        self.alpha = alpha
        self.font_size = font_size
        self.top_margin = top_margin
        self._q: queue.Queue = queue.Queue()
        self._thread = None
        self._rec_started: float | None = None
        self._ready = threading.Event()

    # -- verejné API (volateľné z hociktorého vlákna) -------------------------------------------------
    def start(self) -> None:
        if not self.enabled:
            return
        self._thread = threading.Thread(target=self._run, daemon=True, name="overlay")
        self._thread.start()
        self._ready.wait(3.0)

    def show(self, text: str, kind: str = "info", timeout: float | None = None) -> None:
        if self.enabled:
            self._q.put(("show", text, kind, timeout))

    def recording(self, text: str = "🔴 NAHRÁVAM") -> None:
        """Zobrazí červený prúžok s bežiacim časom až do hide()/show()."""
        self._rec_started = time.monotonic()
        self.show(text, "rec")

    def hide(self) -> None:
        self._rec_started = None
        if self.enabled:
            self._q.put(("hide",))

    # -- Tk vlákno ------------------------------------------------------------------------------------
    def _run(self) -> None:
        try:
            import tkinter as tk
            root = tk.Tk()
        except Exception as exc:  # noqa: BLE001 – bez displeja / bez tkinteru
            log.warning("overlay nedostupný: %s", exc)
            self.enabled = False
            self._ready.set()
            return
        try:
            root.overrideredirect(True)
            root.attributes("-topmost", True)
            try:
                root.attributes("-alpha", self.alpha)
            except Exception:  # noqa: BLE001
                pass
            root.configure(bg=COLORS["info"])
            label = tk.Label(root, text="", font=("Segoe UI", self.font_size, "bold"), fg="white",
                             bg=COLORS["info"], padx=16, pady=8)
            label.pack(fill="both", expand=True)
            root.withdraw()
            root.update_idletasks()
            _no_activate(root)
            state = {"hide_after": None, "base_text": "", "kind": "info", "visible": False}

            def place():
                root.update_idletasks()
                w = root.winfo_reqwidth()
                x = max(0, (root.winfo_screenwidth() - w) // 2)
                root.geometry(f"+{x}+{self.top_margin}")

            def do_show(text, kind, timeout):
                state.update(base_text=text, kind=kind)
                bg = COLORS.get(kind, COLORS["info"])
                root.configure(bg=bg)
                label.configure(text=text, bg=bg)
                place()
                if not state["visible"]:
                    root.deiconify()
                    _no_activate(root)
                    state["visible"] = True
                root.lift()
                if state["hide_after"] is not None:
                    root.after_cancel(state["hide_after"])
                    state["hide_after"] = None
                if timeout:
                    state["hide_after"] = root.after(int(timeout * 1000), do_hide)

            def do_hide():
                state["hide_after"] = None
                state["visible"] = False
                root.withdraw()

            def poll():
                try:
                    while True:
                        cmd = self._q.get_nowait()
                        if cmd[0] == "show":
                            do_show(cmd[1], cmd[2], cmd[3])
                        elif cmd[0] == "hide":
                            do_hide()
                except queue.Empty:
                    pass
                if state["visible"] and state["kind"] == "rec" and self._rec_started is not None:
                    secs = int(time.monotonic() - self._rec_started)
                    label.configure(text=f"{state['base_text']}  {secs // 60}:{secs % 60:02d}")
                    place()
                root.after(150, poll)

            root.after(0, poll)
            self._ready.set()
            root.mainloop()
        except Exception as exc:  # noqa: BLE001
            log.warning("overlay skončil: %s", exc)
            self.enabled = False
            self._ready.set()


def _no_activate(root) -> None:
    """Windows: okno nikdy nedostane fokus (WS_EX_NOACTIVATE) a nie je v paneli úloh (WS_EX_TOOLWINDOW)."""
    if sys.platform != "win32":
        return
    try:
        import ctypes
        user32 = ctypes.windll.user32
        hwnd = user32.GetAncestor(root.winfo_id(), 2)      # GA_ROOT
        GWL_EXSTYLE = -20
        style = user32.GetWindowLongW(hwnd, GWL_EXSTYLE)
        user32.SetWindowLongW(hwnd, GWL_EXSTYLE, style | 0x08000000 | 0x00000080)   # NOACTIVATE | TOOLWINDOW
    except Exception:  # noqa: BLE001
        pass


class NoOverlay:
    enabled = False

    def start(self) -> None: ...
    def show(self, text: str, kind: str = "info", timeout: float | None = None) -> None: ...
    def recording(self, text: str = "") -> None: ...
    def hide(self) -> None: ...
