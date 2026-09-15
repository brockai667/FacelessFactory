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
