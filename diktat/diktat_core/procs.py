"""Zoznam bežiacich procesov (Windows cez Toolhelp32 bez subprocessov, Linux cez /proc) + kontrola, či beží diktat."""
from __future__ import annotations

import os
import sys

MUTEX_NAME = "Local\\diktat-daemon"


def running_process_names() -> set[str]:
    """Názvy bežiacich procesov malými písmenami (napr. {'claude.exe', 'opera.exe', ...})."""
    names: set[str] = set()
    if sys.platform == "win32":
        import ctypes
        from ctypes import wintypes

        class PROCESSENTRY32W(ctypes.Structure):
            _fields_ = [
                ("dwSize", wintypes.DWORD), ("cntUsage", wintypes.DWORD), ("th32ProcessID", wintypes.DWORD),
                ("th32DefaultHeapID", ctypes.POINTER(ctypes.c_ulong)), ("th32ModuleID", wintypes.DWORD),
                ("cntThreads", wintypes.DWORD), ("th32ParentProcessID", wintypes.DWORD),
                ("pcPriClassBase", ctypes.c_long), ("dwFlags", wintypes.DWORD), ("szExeFile", ctypes.c_wchar * 260),
            ]

        kernel32 = ctypes.windll.kernel32
        snapshot = kernel32.CreateToolhelp32Snapshot(0x00000002, 0)   # TH32CS_SNAPPROCESS
        if snapshot == ctypes.c_void_p(-1).value or snapshot == -1:
            return names
        try:
            entry = PROCESSENTRY32W()
            entry.dwSize = ctypes.sizeof(PROCESSENTRY32W)
            ok = kernel32.Process32FirstW(snapshot, ctypes.byref(entry))
            while ok:
                names.add(entry.szExeFile.lower())
                ok = kernel32.Process32NextW(snapshot, ctypes.byref(entry))
        finally:
            kernel32.CloseHandle(snapshot)
        return names
    # Linux/macOS – len pre testy a vývoj
    try:
        for pid in os.listdir("/proc"):
            if pid.isdigit():
                try:
                    with open(f"/proc/{pid}/comm", "r", encoding="utf-8", errors="ignore") as fh:
                        names.add(fh.read().strip().lower())
                except OSError:
                    pass
    except OSError:
        pass
    return names


def _exe_name_of_pid(pid: int, cache: dict) -> str | None:
    if pid in cache:
        return cache[pid]
    name = None
    try:
        import ctypes
        from ctypes import wintypes
        kernel32 = ctypes.windll.kernel32
        handle = kernel32.OpenProcess(0x1000, False, pid)         # PROCESS_QUERY_LIMITED_INFORMATION
        if handle:
            try:
                size = wintypes.DWORD(1024)
                buf = ctypes.create_unicode_buffer(1024)
                if kernel32.QueryFullProcessImageNameW(handle, 0, buf, ctypes.byref(size)):
                    name = buf.value.rsplit("\\", 1)[-1].lower()
            finally:
                kernel32.CloseHandle(handle)
    except Exception:  # noqa: BLE001
        name = None
    cache[pid] = name
    return name


def process_names_with_windows() -> set[str]:
    """Názvy procesov, ktoré majú VIDITEĽNÉ okno s titulkom (Windows). Chrome na pozadí či Claude v lište
    okno nemajú → nepočítajú sa. Inde: prázdna množina."""
    names: set[str] = set()
    if sys.platform != "win32":
        return names
    import ctypes
    from ctypes import wintypes
    user32 = ctypes.windll.user32
    cache: dict = {}
    proto = ctypes.WINFUNCTYPE(ctypes.c_bool, wintypes.HWND, wintypes.LPARAM)

    def cb(hwnd, _lparam):
        try:
            if not user32.IsWindowVisible(hwnd) or user32.GetWindowTextLengthW(hwnd) == 0:
                return True
            pid = wintypes.DWORD()
            user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
            name = _exe_name_of_pid(pid.value, cache)
            if name:
                names.add(name)
        except Exception:  # noqa: BLE001
            pass
        return True

    user32.EnumWindows(proto(cb), 0)
    return names


def window_rect_of(hwnd) -> tuple[int, int, int, int] | None:
    """Rozmery známeho okna (lacné – bez prechádzania všetkých okien). None = okno zmizlo/je schované."""
    if sys.platform != "win32" or not hwnd:
        return None
    import ctypes
    from ctypes import wintypes
    user32 = ctypes.windll.user32
    try:
        if not user32.IsWindow(hwnd) or not user32.IsWindowVisible(hwnd) or user32.IsIconic(hwnd):
            return None
        rect = wintypes.RECT()
        if not user32.GetWindowRect(hwnd, ctypes.byref(rect)):
            return None
        if rect.right <= rect.left or rect.bottom <= rect.top:
            return None
        return (rect.left, rect.top, rect.right, rect.bottom)
    except Exception:  # noqa: BLE001
        return None


class WindowTracker:
    """Pamätá si okno (napr. Claude) a vracia jeho rozmery. Všetky okná prechádza len vtedy, keď okno
    nepozná – teda pri štarte a keď zmizne, najviac raz za `rescan_seconds`. Vďaka tomu panel nežerie CPU."""

    def __init__(self, names: list[str], rescan_seconds: float = 3.0, find=None, rect_of=None):
        self.names = list(names or [])
        self.rescan_seconds = float(rescan_seconds)
        self._find = find or (lambda: find_window(self.names))
        self._rect_of = rect_of or window_rect_of
        self._hwnd = None
        self._last_scan = float("-inf")
        self.scans = 0

    def rect(self, now: float | None = None) -> tuple[int, int, int, int] | None:
        import time as _time
        now = _time.monotonic() if now is None else now
        if self._hwnd is not None:
            rect = self._rect_of(self._hwnd)
            if rect is not None:
                return rect
            self._hwnd = None
        if now - self._last_scan < self.rescan_seconds:
            return None
        self._last_scan = now
        self.scans += 1
        self._hwnd, rect = self._find()
        return rect


def window_rect(names: list[str]) -> tuple[int, int, int, int] | None:
    """Obdĺžnik najväčšieho viditeľného okna niektorého z procesov (napr. claude.exe)."""
    return find_window(names)[1]


def find_window(names: list[str]) -> tuple[object | None, tuple[int, int, int, int] | None]:
    """(hwnd, obdĺžnik) najväčšieho viditeľného okna niektorého z procesov. Minimalizované okná sa
    nerátajú. Mimo Windows / bez okna: (None, None)."""
    if sys.platform != "win32":
        return None, None
    wanted = {n.lower() for n in names if n} | {n.lower().removesuffix(".exe") for n in names if n}
    if not wanted:
        return None, None
    import ctypes
    from ctypes import wintypes
    user32 = ctypes.windll.user32
    cache: dict = {}
    best: tuple[int, object, tuple[int, int, int, int]] | None = None
    proto = ctypes.WINFUNCTYPE(ctypes.c_bool, wintypes.HWND, wintypes.LPARAM)

    def cb(hwnd, _lparam):
        nonlocal best
        try:
            if not user32.IsWindowVisible(hwnd) or user32.IsIconic(hwnd):
                return True
            if user32.GetWindowTextLengthW(hwnd) == 0:
                return True
            pid = wintypes.DWORD()
            user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
            name = (_exe_name_of_pid(pid.value, cache) or "").lower()
            if name not in wanted and name.removesuffix(".exe") not in wanted:
                return True
            rect = wintypes.RECT()
            if not user32.GetWindowRect(hwnd, ctypes.byref(rect)):
                return True
            w, h = rect.right - rect.left, rect.bottom - rect.top
            if w <= 0 or h <= 0:
                return True
            if best is None or w * h > best[0]:
                best = (w * h, hwnd, (rect.left, rect.top, rect.right, rect.bottom))
        except Exception:  # noqa: BLE001
            pass
        return True

    user32.EnumWindows(proto(cb), 0)
    return (best[1], best[2]) if best else (None, None)


def any_running(follow: list[str], names: set[str] | None = None) -> bool:
    """Beží aspoň jeden zo sledovaných procesov? Porovnáva sa bez ohľadu na veľkosť písmen, aj bez .exe."""
    if not follow:
        return False
    names = names if names is not None else running_process_names()
    wanted = set()
    for p in follow:
        p = p.strip().lower()
        if not p:
            continue
        wanted.add(p)
        wanted.add(p[:-4] if p.endswith(".exe") else p + ".exe")
    return any(n in wanted for n in names)


def diktat_running() -> bool:
    """Windows: existuje mutex daemona? Inde: False (bez podpory)."""
    if sys.platform != "win32":
        return False
    import ctypes
    kernel32 = ctypes.windll.kernel32
    handle = kernel32.OpenMutexW(0x00100000, False, MUTEX_NAME)   # SYNCHRONIZE
    if handle:
        kernel32.CloseHandle(handle)
        return True
    return False
