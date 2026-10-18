"""Ako diktat vyzerá – jedno miesto pre farby, tvary a písmo.

Prúžok so stavom diktovania, panel so sessions a ikona v lište boli tri rôzne vzhľady: päť nesúvisiacich
farieb, ostré obdĺžniky a emoji. Tu je z toho jeden systém:

* **tmavý povrch** s jemným rámikom a zaoblenými rohmi (rovnaký pre prúžok aj panel);
* **jedna farba na jeden význam** – tá istá modrá znamená „pracuje“ v paneli aj „načítavam“ v prúžku;
* **žiadne emoji** – stav nesie farebná bodka, nie obrázok, ktorý každý systém kreslí inak;
* **chyba je jediná, čo prefarbí celý povrch** – nedá sa prehliadnuť a nepletie sa s nahrávaním.
"""
from __future__ import annotations

import sys

# -- povrch ------------------------------------------------------------------------------------------
BG = "#17171b"          # takmer čierna, o kúsok svetlejšia než okno Claude, nech je panel vidno
BORDER = "#31313a"      # rámik namiesto priesvitnosti: text pod panelom už nepresvitá
FG = "#ededf0"
DIM = "#8b8b96"
RADIUS = 12
FONT = "Segoe UI"

# -- jedna farba na jeden význam ---------------------------------------------------------------------
BLUE = "#4a9eff"        # pracuje / načítavam model
AMBER = "#ffb300"       # pýta sa ťa / prepisujem
GREEN = "#3ddc84"       # hotovo / vložené
GREY = "#8a8a8a"        # čaká na zadanie / nič sa nedeje
RED = "#ff5f56"         # nahrávam
ERROR_BG = "#5c1b1b"    # chyba prefarbí celý povrch, ostatné stavy len bodku

# Ako dýchajú bodky: (perióda v sekundách, hĺbka stmavnutia). 0 = svieti stále.
PULSE = {"rec": (1.1, 0.75), "working": (1.6, 0.55), "asking": (0.9, 0.7), "starting": (1.6, 0.55),
         "stt": (1.1, 0.6), "done": (0.0, 0.0), "ready": (0.0, 0.0), "ok": (0.0, 0.0), "error": (0.0, 0.0)}


def pulse_color(color: str, phase: float, depth: float) -> str:
    """Farba bodky v danej fáze dýchania (0–1). Nie blikanie – plynulé stmavnutie a rozsvietenie."""
    import math
    try:
        r, g, b = (int(color[i:i + 2], 16) for i in (1, 3, 5))
    except (ValueError, IndexError):
        return color
    f = 1.0 - depth * (0.5 - 0.5 * math.cos(2 * math.pi * (phase % 1.0)))
    return "#" + "".join(f"{max(0, min(255, int(round(c * f)))):02x}" for c in (r, g, b))


def round_corners(root, radius: int = RADIUS, size: tuple[int, int] | None = None) -> None:
    """Zaoblí rohy okna. Tkinter to nevie, Windows áno – orežeme okno oblasťou so zaoblenými rohmi.
    `size` treba dať vtedy, keď okno práve rastie: oblasť okno oreže, takže z neskoršieho textu by bolo
    vidno len toľko, koľko bolo okno široké predtým."""
    if sys.platform != "win32":
        return
    try:
        import ctypes
        root.update_idletasks()
        w, h = size or (root.winfo_width(), root.winfo_height())
        if w <= 1 or h <= 1:
            return
        hwnd = ctypes.windll.user32.GetAncestor(root.winfo_id(), 2)       # GA_ROOT
        region = ctypes.windll.gdi32.CreateRoundRectRgn(0, 0, w + 1, h + 1, radius * 2, radius * 2)
        ctypes.windll.user32.SetWindowRgn(hwnd, region, True)
    except Exception:  # noqa: BLE001 – vzhľad nikdy nesmie zhodiť program
        pass


def no_activate(root) -> None:
    """Okno nikdy nedostane fokus (WS_EX_NOACTIVATE) a nie je v paneli úloh (WS_EX_TOOLWINDOW)."""
    if sys.platform != "win32":
        return
    try:
        import ctypes
        user32 = ctypes.windll.user32
        hwnd = user32.GetAncestor(root.winfo_id(), 2)
        style = user32.GetWindowLongW(hwnd, -20)                          # GWL_EXSTYLE
        user32.SetWindowLongW(hwnd, -20, style | 0x08000000 | 0x00000080)
    except Exception:  # noqa: BLE001
        pass


def surface(tk, root, padx: int = 14, pady: int = 10):
    """Vnútro okna: rámik v jednej farbe, výplň v druhej. Vráti rám, do ktorého sa kreslí obsah."""
    root.configure(bg=BORDER)                     # okraj = pozadie okna, vidno ho po obvode
    frame = tk.Frame(root, bg=BG, padx=padx, pady=pady)
    frame.pack(fill="both", expand=True, padx=1, pady=1)
    return frame
