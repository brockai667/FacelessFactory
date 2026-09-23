"""Malý panel v pravom hornom rohu okna Claude: ktoré Claude Code sessions bežia a čo robia.

Riadky: „● epizodar · pracuje“ (modrá = pracuje, oranžová = pýta sa ťa, zelená = hotovo).
Bodka pri aktívnych stavoch jemne dýcha; text sa prekresľuje len vtedy, keď sa naozaj zmení
zoznam sessions, takže nič nebliká.

Dáta píšu hooky do ~/.claude/diktat/sessions (viď sessions.py), panel ich len číta raz za sekundu.
Vlastné vlákno, vlastné okno, nikdy neberie fokus. Bez tkinteru / bez okna Claude sa schová.
"""
from __future__ import annotations

import logging
import math
import sys
import threading

from . import procs, sessions

log = logging.getLogger("diktat.panel")

BG = "#141414"
FG = "#e0e0e0"
DIM = "#8a8a8a"
# stav → (perióda dýchania v sekundách, hĺbka stmavnutia 0–1). 0 = bodka svieti stále rovnako.
PULSE = {"working": (1.6, 0.55), "asking": (0.9, 0.7), "done": (0.0, 0.0), "ready": (0.0, 0.0)}


def pulse_color(color: str, phase: float, depth: float) -> str:
    """Farba bodky v danej fáze dýchania (0–1). depth 0 = bez zmeny."""
    if depth <= 0:
        return color
    try:
        r, g, b = (int(color[i:i + 2], 16) for i in (1, 3, 5))
    except (ValueError, IndexError):
        return color
    f = 1.0 - depth * (0.5 - 0.5 * math.cos(2 * math.pi * (phase % 1.0)))
    return "#" + "".join(f"{max(0, min(255, int(round(c * f)))):02x}" for c in (r, g, b))


class Panel:
    def __init__(self, cfg: dict | None = None, read_fn=None, rect_fn=None):
        cfg = dict(cfg or {})
        self.enabled = bool(cfg.get("enabled", True))
        self.follow_window = bool(cfg.get("follow_window", True))
        self.processes = list(cfg.get("processes") or ["claude.exe"])
        self.offset_y = int(cfg.get("offset_y", 44))
        self.margin_right = int(cfg.get("margin_right", 12))
        self.max_rows = int(cfg.get("max_rows", 8))
        self.font_size = int(cfg.get("font_size", 11))
        self.alpha = float(cfg.get("alpha", 0.95))
        self.hide_when_empty = bool(cfg.get("hide_when_empty", True))
        self.refresh_seconds = float(cfg.get("refresh_seconds", 1.0))
        self.animate_ms = max(40, int(cfg.get("animate_ms", 120)))
        self.show_time = bool(cfg.get("show_time", False))
        self.done_keep_minutes = float(cfg.get("done_keep_minutes", 30))
        self.stale_minutes = float(cfg.get("stale_minutes", 240))
        self.state_dir = cfg.get("state_dir") or None
        self._read_fn = read_fn or self._read_states
        self._rect_fn = rect_fn or (lambda: procs.window_rect(self.processes))
        self._thread: threading.Thread | None = None
        self._stop = threading.Event()

    # -- verejné API ----------------------------------------------------------------------------------
    def start(self) -> None:
        if not self.enabled or self._thread is not None:
            return
        self._thread = threading.Thread(target=self._run, daemon=True, name="panel")
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()
        self._thread = None

    def set_enabled(self, on: bool) -> None:
        """Zapnutie/vypnutie za behu (ikona v lište)."""
        if on and not self.enabled:
            self.enabled, self._stop = True, threading.Event()
            self.start()
        elif not on and self.enabled:
            self.enabled = False
            self.stop()

    # -- dáta -----------------------------------------------------------------------------------------
    def _read_states(self) -> list[dict]:
        return sessions.read_states(self.state_dir, done_keep_minutes=self.done_keep_minutes,
                                    stale_minutes=self.stale_minutes, max_rows=self.max_rows)

    def position(self, rect, width: int, screen_width: int) -> tuple[int, int] | None:
        """Ľavý horný roh panela: pod tlačidlami okna Claude vpravo. Bez okna → pravý horný roh obrazovky
        (alebo None, keď sa má panel schovať)."""
        if rect is None:
            if self.follow_window:
                return None
            return max(0, screen_width - width - self.margin_right), self.offset_y
        left, top, right, _bottom = rect
        x = right - width - self.margin_right
        return max(left, x), top + self.offset_y

    # -- Tk vlákno ------------------------------------------------------------------------------------
    def _run(self) -> None:
        try:
            import tkinter as tk
            root = tk.Tk()
        except Exception as exc:  # noqa: BLE001 – bez tkinteru / bez displeja
            log.warning("panel nedostupný: %s", exc)
            self.enabled = False
            return
        try:
            root.overrideredirect(True)
            root.attributes("-topmost", True)
            try:
                root.attributes("-alpha", self.alpha)
            except Exception:  # noqa: BLE001
                pass
            root.configure(bg=BG)
            frame = tk.Frame(root, bg=BG, padx=14, pady=10)
            frame.pack(fill="both", expand=True)
            root.withdraw()
            root.update_idletasks()
            _no_activate(root)

            view = {"keys": None, "dots": [], "visible": False, "width": 0, "pos": None, "ticks": 0}

            def rebuild(states):
                for child in frame.winfo_children():
                    child.destroy()
                view["dots"] = []
                if states:
                    tk.Label(frame, text="Claude session", font=("Segoe UI", self.font_size - 2),
                             fg=DIM, bg=BG, anchor="w").pack(fill="x", pady=(0, 6))
                for entry in states:
                    icon, text, color = sessions.row_for(entry, self.show_time)
                    line = tk.Frame(frame, bg=BG)
                    line.pack(fill="x", pady=3)
                    dot = tk.Label(line, text=icon, font=("Segoe UI", self.font_size + 2), fg=color, bg=BG)
                    dot.pack(side="left")
                    tk.Label(line, text="  " + text, font=("Segoe UI", self.font_size), fg=FG, bg=BG,
                             anchor="w").pack(side="left")
                    view["dots"].append((dot, color, entry.get("state", "")))
                root.update_idletasks()
                view["width"] = max(root.winfo_reqwidth(), 170)

            def animate():
                secs = view["ticks"] * self.animate_ms / 1000.0
                for dot, color, state in view["dots"]:
                    period, depth = PULSE.get(state, (0.0, 0.0))
                    if period <= 0:
                        continue
                    try:
                        dot.configure(fg=pulse_color(color, secs / period, depth))
                    except Exception:  # noqa: BLE001 – widget medzitým zanikol
                        pass

            def place(states):
                empty = not states and self.hide_when_empty
                pos = None if empty else self.position(self._rect_fn(), view["width"], root.winfo_screenwidth())
                if pos is None:
                    if view["visible"]:
                        root.withdraw()
                        view["visible"] = False
                    return
                if pos != view["pos"]:
                    root.geometry(f"+{pos[0]}+{pos[1]}")
                    view["pos"] = pos
                if not view["visible"]:
                    root.deiconify()
                    _no_activate(root)
                    root.lift()
                    view["visible"] = True

            every = max(1, int(round(self.refresh_seconds * 1000 / self.animate_ms)))

            def tick():
                if self._stop.is_set():
                    root.destroy()
                    return
                if view["ticks"] % every == 0:
                    try:
                        states = self._read_fn()
                    except Exception as exc:  # noqa: BLE001
                        log.debug("panel: stavy sa nepodarilo načítať (%s)", exc)
                        states = []
                    keys = [sessions.row_key(e) for e in states]
                    if keys != view["keys"]:
                        rebuild(states)
                        view["keys"] = keys
                    view["states"] = states
                animate()
                place(view.get("states") or [])
                view["ticks"] += 1
                root.after(self.animate_ms, tick)

            root.after(0, tick)
            root.mainloop()
        except Exception as exc:  # noqa: BLE001
            log.warning("panel skončil: %s", exc)
        finally:
            self._thread = None


def _no_activate(root) -> None:
    """Windows: panel nikdy nedostane fokus a nie je v paneli úloh."""
    if sys.platform != "win32":
        return
    try:
        import ctypes
        user32 = ctypes.windll.user32
        hwnd = user32.GetAncestor(root.winfo_id(), 2)      # GA_ROOT
        style = user32.GetWindowLongW(hwnd, -20)           # GWL_EXSTYLE
        user32.SetWindowLongW(hwnd, -20, style | 0x08000000 | 0x00000080)   # NOACTIVATE | TOOLWINDOW
    except Exception:  # noqa: BLE001
        pass


class NoPanel:
    enabled = False

    def start(self) -> None: ...
    def stop(self) -> None: ...
    def set_enabled(self, on: bool) -> None: ...
