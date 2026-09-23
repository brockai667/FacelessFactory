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


def window_rect(names: list[str]) -> tuple[int, int, int, int] | None:
    """Obdĺžnik (left, top, right, bottom) najväčšieho viditeľného okna niektorého z procesov
    (napr. claude.exe). Minimalizované okná sa nerátajú. Mimo Windows / bez okna: None."""
    if sys.platform != "win32":
        return None
    wanted = {n.lower() for n in names if n} | {n.lower().removesuffix(".exe") for n in names if n}
    if not wanted:
        return None
    import ctypes
    from ctypes import wintypes
    user32 = ctypes.windll.user32
    cache: dict = {}
    best: tuple[int, tuple[int, int, int, int]] | None = None
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
                best = (w * h, (rect.left, rect.top, rect.right, rect.bottom))
        except Exception:  # noqa: BLE001
            pass
        return True

    user32.EnumWindows(proto(cb), 0)
    return best[1] if best else None


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
