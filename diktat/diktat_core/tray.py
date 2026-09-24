"""Ikona v systémovej lište (pystray + Pillow). Voliteľné – bez balíkov sa všetko tvári ako no-op.

Stavy: idle (sivá), rec (červená), stt (žltá), error (fialová). Menu: stav, log, Ukončiť.
pystray na Windows musí bežať v hlavnom vlákne (icon.run()), preto app spúšťa listener klávesnice
na pozadí a run() blokuje v hlavnom vlákne.
"""
from __future__ import annotations

import logging
from typing import Callable

from . import look

log = logging.getLogger("diktat.tray")

def _rgb(hex_color: str) -> tuple[int, int, int]:
    return tuple(int(hex_color[i:i + 2], 16) for i in (1, 3, 5))


# Tie isté farby ako prúžok a panel (look.py): modrá = načítavam, červená = nahrávam, oranžová = prepisujem.
COLORS = {"starting": _rgb(look.BLUE), "idle": _rgb(look.GREY), "rec": _rgb(look.RED),
          "stt": _rgb(look.AMBER), "error": _rgb(look.RED)}
TITLES = {"starting": "diktat – štartujem (načítavam model)…", "idle": "diktat – pripravený (stlač skratku)",
          "rec": "diktat – NAHRÁVAM", "stt": "diktat – prepisujem…", "error": "diktat – chyba (pozri log)"}


def available() -> bool:
    try:
        import pystray  # noqa: F401
        from PIL import Image  # noqa: F401
    except ImportError:
        return False
    return True


def _image(color, state: str = "idle"):
    """Ikona: tmavý zaoblený štvorec (ako povrch panela) a v ňom mikrofón vo farbe stavu.
    Na svetlej aj tmavej lište je rovnako čitateľná a farbu vidno aj kútikom oka."""
    from PIL import Image, ImageDraw
    img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((2, 2, 62, 62), radius=16, fill=_rgb(look.BG) + (255,),
                        outline=_rgb(look.BORDER) + (255,), width=2)
    if state == "error":                        # chyba: výkričník, nech sa nepletie s nahrávaním
        d.rounded_rectangle((28, 14, 36, 40), radius=4, fill=color + (255,))
        d.ellipse((28, 45, 36, 53), fill=color + (255,))
        return img
    d.rounded_rectangle((25, 15, 39, 37), radius=7, fill=color + (255,))          # telo mikrofónu
    d.arc((19, 24, 45, 46), start=0, end=180, fill=color + (255,), width=4)       # oblúk držiaka
    d.rectangle((31, 44, 33, 50), fill=color + (255,))                            # stojan
    d.rectangle((25, 50, 39, 52), fill=color + (255,))
    if state == "rec":                                                            # nahrávam: bodka navrchu
        d.ellipse((44, 6, 58, 20), fill=color + (255,), outline=_rgb(look.BG) + (255,), width=2)
    return img


class Tray:
    def __init__(self, on_quit: Callable[[], None], log_path: str | None = None, notify_enabled: bool = True,
                 on_update: Callable[[], None] | None = None, on_calibrate: Callable[[], None] | None = None,
                 on_gate: Callable[[str], None] | None = None, gate_text: Callable[[], str] | None = None,
                 on_diag: Callable[[], None] | None = None, on_panel: Callable[[], None] | None = None,
                 panel_on: Callable[[], bool] | None = None,
                 on_restart_check: Callable[[], str] | None = None,
                 on_show_rows: Callable[[], str] | None = None):
        self.on_show_rows = on_show_rows
        self.on_restart_check = on_restart_check
        self.on_diag = on_diag
        self.on_panel = on_panel
        self.panel_on = panel_on
        self.on_quit = on_quit
        self.on_update = on_update
        self.on_calibrate = on_calibrate
        self.on_gate = on_gate
        self.gate_text = gate_text
        self.log_path = log_path
        self.notify_enabled = notify_enabled
        self.state = "idle"
        self._icon = None
        self._images = {}

    def _build(self):
        import pystray
        self._images = {k: _image(v, k) for k, v in COLORS.items()}

        def open_log(icon, item):
            if self.log_path:
                import os
                try:
                    os.startfile(self.log_path)  # noqa: S606 – Windows
                except Exception:  # noqa: BLE001
                    pass

        def quit_(icon, item):
            try:
                self.on_quit()
            finally:
                icon.stop()

        def update_(icon, item):
            if self.on_update:
                self.on_update()

        def calibrate_(icon, item):
            if self.on_calibrate:
                self.on_calibrate()

        def gate_item(label, action):
            return pystray.MenuItem(label, lambda icon, item: self.on_gate(action), enabled=bool(self.on_gate))

        gate_menu = pystray.Menu(
            pystray.MenuItem(lambda item: (self.gate_text() if self.gate_text else "brána"), None, enabled=False),
            gate_item("Prísnejšia (+25 %) – menej okolia", "stricter"),
            gate_item("Miernejšia (−20 %) – ak odrezáva aj mňa", "looser"),
            gate_item("Vypnúť bránu", "off"),
        )

        menu = pystray.Menu(
            pystray.MenuItem(lambda item: TITLES.get(self.state, "diktat"), None, enabled=False),
            pystray.MenuItem("Kalibrovať mikrofón (len môj hlas)", calibrate_, enabled=bool(self.on_calibrate)),
            pystray.MenuItem("Brána (len môj hlas)", gate_menu),
            pystray.MenuItem("Panel session (vpravo hore)", lambda icon, item: self.on_panel(),
                             checked=(lambda item: bool(self.panel_on())) if self.panel_on else None,
                             enabled=bool(self.on_panel)),
            pystray.MenuItem("Ukáž zavreté riadky panela", lambda icon, item: self.on_show_rows(),
                             enabled=bool(self.on_show_rows)),
            pystray.MenuItem("Môžem reštartovať Claude?", lambda icon, item: self.on_restart_check(),
                             enabled=bool(self.on_restart_check)),
            pystray.MenuItem("Otvoriť log", open_log, enabled=bool(self.log_path)),
            pystray.MenuItem("Diagnostika (do schránky)", lambda icon, item: self.on_diag(), enabled=bool(self.on_diag)),
            pystray.MenuItem("Aktualizovať a reštartovať", update_, enabled=bool(self.on_update)),
            pystray.MenuItem("Ukončiť diktat", quit_),
        )
        self._icon = pystray.Icon("diktat", self._images.get(self.state, self._images["idle"]),
                                  TITLES.get(self.state, TITLES["idle"]), menu)

    def run(self) -> None:
        """Blokuje (hlavné vlákno) až do Ukončiť."""
        self._build()
        self._icon.run()

    def set_state(self, state: str) -> None:
        self.state = state
        if self._icon is None:
            return
        try:
            self._icon.icon = self._images.get(state, self._images["idle"])
            self._icon.title = TITLES.get(state, "diktat")
        except Exception:  # noqa: BLE001
            pass

    def notify(self, message: str, title: str = "diktat") -> None:
        if not self.notify_enabled or self._icon is None:
            return
        try:
            self._icon.notify(message[:200], title)
        except Exception:  # noqa: BLE001
            log.debug("notify zlyhalo", exc_info=True)

    def stop(self) -> None:
        if self._icon is not None:
            try:
                self._icon.stop()
            except Exception:  # noqa: BLE001
                pass


class NoTray:
    """Náhrada, keď pystray nie je alebo beží konzolový režim."""
    state = "idle"

    def run(self) -> None:
        pass

    def set_state(self, state: str) -> None:
        self.state = state

    def notify(self, message: str, title: str = "diktat") -> None:
        pass

    def stop(self) -> None:
        pass
