"""Ikona v systémovej lište (pystray + Pillow). Voliteľné – bez balíkov sa všetko tvári ako no-op.

Stavy: idle (sivá), rec (červená), stt (žltá), error (fialová). Menu: stav, log, Ukončiť.
pystray na Windows musí bežať v hlavnom vlákne (icon.run()), preto app spúšťa listener klávesnice
na pozadí a run() blokuje v hlavnom vlákne.
"""
from __future__ import annotations

import logging
from typing import Callable

log = logging.getLogger("diktat.tray")

COLORS = {"idle": (140, 140, 140), "rec": (220, 40, 40), "stt": (240, 190, 0), "error": (160, 60, 200)}
TITLES = {"idle": "diktat – pripravený (stlač skratku)", "rec": "diktat – NAHRÁVAM", "stt": "diktat – prepisujem…",
          "error": "diktat – chyba (pozri log)"}


def available() -> bool:
    try:
        import pystray  # noqa: F401
        from PIL import Image  # noqa: F401
    except ImportError:
        return False
    return True


def _image(color):
    from PIL import Image, ImageDraw
    img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse((6, 6, 58, 58), fill=color + (255,), outline=(255, 255, 255, 200), width=3)
    d.rounded_rectangle((26, 16, 38, 38), radius=6, fill=(255, 255, 255, 230))   # mikrofón
    d.rectangle((30, 40, 34, 48), fill=(255, 255, 255, 230))
    return img


class Tray:
    def __init__(self, on_quit: Callable[[], None], log_path: str | None = None, notify_enabled: bool = True,
                 on_update: Callable[[], None] | None = None, on_calibrate: Callable[[], None] | None = None,
                 on_gate: Callable[[str], None] | None = None, gate_text: Callable[[], str] | None = None):
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
        self._images = {k: _image(v) for k, v in COLORS.items()}

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
            pystray.MenuItem("Otvoriť log", open_log, enabled=bool(self.log_path)),
            pystray.MenuItem("Aktualizovať a reštartovať", update_, enabled=bool(self.on_update)),
            pystray.MenuItem("Ukončiť diktat", quit_),
        )
        self._icon = pystray.Icon("diktat", self._images["idle"], TITLES["idle"], menu)

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
