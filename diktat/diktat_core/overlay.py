"""Prúžok so stavom diktovania (tkinter, vlastné vlákno, nikdy neberie fokus).

Vyzerá rovnako ako panel so sessions – tmavý povrch so zaoblenými rohmi (`look.py`), stav nesie farebná
bodka: modrá „načítavam model“, červená „NAHRÁVAM“ s časom a hlasitosťou, oranžová „prepisujem“, zelená
„vložené“. Chyba ako jediná prefarbí celý povrch. Stojí dole v strede obrazovky, nie hore – tam prekrýval
karty prehliadača. Bez tkinteru / bez displeja sa všetko tvári ako no-op.
"""
from __future__ import annotations

import logging
import queue
import sys
import threading
import time

log = logging.getLogger("diktat.overlay")

from . import look

# Stav nesie farebná bodka, nie farba celého prúžku – jediná výnimka je chyba, tá prefarbí povrch.
KIND_COLOR = {"info": look.BLUE, "starting": look.BLUE, "ready": look.GREY, "rec": look.RED,
              "stt": look.AMBER, "ok": look.GREEN, "error": look.RED}
METER_W = 74          # šírka nakresleného ukazovateľa hlasitosti
METER_FULL = 0.12     # hlasitosť, pri ktorej je plný


class Overlay:
    def __init__(self, enabled: bool = True, alpha: float = 0.97, font_size: int = 12, top_margin: int = 10,
                 position: str = "bottom", bottom_margin: int = 56):
        self.enabled = bool(enabled)
        self.alpha = alpha
        self.font_size = font_size
        self.top_margin = top_margin
        self.bottom_margin = bottom_margin
        self.position = position       # „bottom“ = dole v strede; hore prúžok prekrýval karty prehliadača
        self._q: queue.Queue = queue.Queue()
        self._thread = None
        self._rec_started: float | None = None
        self._ready = threading.Event()
        self.level_fn = None            # callable → (level, gate) pre ukazovateľ hlasitosti počas nahrávania

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

    def recording(self, text: str = "NAHRÁVAM") -> None:
        """Nahrávanie: červená dýchajúca bodka, bežiaci čas a hlasitosť – až do hide()/show()."""
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
            frame = look.surface(tk, root, padx=16, pady=9)
            row = tk.Frame(frame, bg=look.BG)
            row.pack()
            dot = tk.Label(row, text="●", font=(look.FONT, self.font_size + 1), fg=look.GREY, bg=look.BG)
            dot.pack(side="left", padx=(0, 9))
            label = tk.Label(row, text="", font=(look.FONT, self.font_size), fg=look.FG, bg=look.BG)
            label.pack(side="left")
            meter = tk.Canvas(row, width=METER_W, height=9, bg=look.BG, highlightthickness=0, bd=0)
            clock = tk.Label(row, text="", font=(look.FONT, self.font_size, "bold"), fg=look.FG, bg=look.BG)
            root.withdraw()
            root.update_idletasks()
            look.no_activate(root)
            state = {"hide_after": None, "text": "", "kind": "info", "visible": False, "t0": time.monotonic()}

            def place():
                root.update_idletasks()
                w, h = root.winfo_reqwidth(), root.winfo_reqheight()
                x = max(0, (root.winfo_screenwidth() - w) // 2)
                y = (root.winfo_screenheight() - h - self.bottom_margin if self.position == "bottom"
                     else self.top_margin)
                root.geometry(f"{w}x{h}+{x}+{max(0, y)}")     # aj veľkosť, nech ju oblasť rohov oreže správne
                look.round_corners(root, size=(w, h))

            def paint_meter(level: float, gate: float):
                """Hlasitosť ako nakreslený prúžok. Časť nad prahom je zelená (ide do prepisu),
                pod prahom sivá (vymaže sa) – nie textové ▮▯, ktoré každé písmo kreslí inak."""
                meter.delete("all")
                full = max(1e-6, METER_FULL)
                filled = int(min(1.0, level / full) * METER_W)
                meter.create_rectangle(0, 3, METER_W, 6, fill=look.BORDER, outline="")
                if filled > 0:
                    live = gate <= 0 or level >= gate
                    meter.create_rectangle(0, 2, filled, 7, fill=look.GREEN if live else look.DIM, outline="")

            def do_show(text, kind, timeout):
                text = _strip_icon(text)
                error = kind == "error"
                bg = look.ERROR_BG if error else look.BG
                state.update(text=text, kind=kind, t0=time.monotonic())
                for widget in (frame, row, dot, label, clock, meter):
                    widget.configure(bg=bg)
                dot.configure(fg=look.FG if error else KIND_COLOR.get(kind, look.GREY))
                dot.configure(text="!" if error else "●")
                label.configure(text=text, fg=look.FG)
                if kind == "rec":
                    clock.pack(side="left", padx=(10, 0))
                    meter.pack(side="left", padx=(10, 0))
                else:
                    clock.pack_forget()
                    meter.pack_forget()
                place()
                if not state["visible"]:
                    root.deiconify()
                    look.no_activate(root)
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
                if state["visible"]:
                    period, depth = look.PULSE.get(state["kind"], (0.0, 0.0))
                    if depth > 0 and state["kind"] != "error":
                        base = KIND_COLOR.get(state["kind"], look.GREY)
                        dot.configure(fg=look.pulse_color(base, (time.monotonic() - state["t0"]) / period, depth))
                    if state["kind"] == "rec" and self._rec_started is not None:
                        secs = int(time.monotonic() - self._rec_started)
                        clock.configure(text=f"{secs // 60}:{secs % 60:02d}")
                        if self.level_fn is not None:
                            try:
                                paint_meter(*self.level_fn())
                            except Exception:  # noqa: BLE001
                                pass
                        place()
                root.after(120, poll)

            root.after(0, poll)
            self._ready.set()
            root.mainloop()
        except Exception as exc:  # noqa: BLE001
            log.warning("overlay skončil: %s", exc)
            self.enabled = False
            self._ready.set()


def _strip_icon(text: str) -> str:
    """Zahodí obrázok na začiatku textu. Stav nesie farebná bodka – emoji by ho len zdvojovalo a každý
    systém ho kreslí inak. Volajúci ich teda môže písať, aj keď sa nezobrazia."""
    t = str(text or "").lstrip()
    while t and (ord(t[0]) > 0x2000 or t[0] in "!?"):
        t = t[1:].lstrip(" –-")
    return t or str(text or "").strip()


def level_bar(level: float, gate: float = 0.0, width: int = 10, full: float = 0.12) -> str:
    """Textový ukazovateľ hlasitosti. S bránou: ✓ = nad prahom (ide do prepisu), · = pod prahom (vymaže sa)."""
    n = min(width, int(round((level / full) * width))) if full > 0 else 0
    bar = "▮" * n + "▯" * (width - n)
    if gate > 0:
        return f"{bar} {'✓' if level >= gate else '·'}"
    return bar


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
