"""Klávesová skratka pre daemon.

Dva druhy zadania v configu (`hotkey`):
  * pynput reťazec, napr. "<ctrl>+<alt>+d", "<f9>"  → GlobalHotKeys / HotKey (rieši app.py)
  * "numpad_decimal" (alias numpad_del, num_del, numpad_dot) alebo "vk:110" → surový virtual-key kód.

Numpad kláves „,/Del“ vedľa pravého Enteru posiela podľa NumLock iný kód: zapnutý = VK_DECIMAL (110),
vypnutý = VK_DELETE (46) – rovnaký ako hlavný Delete, ktorý sa líši len „extended“ príznakom.
Preto sa na Windows matchuje priamo v low-level hooku (win32_event_filter), kde je príznak dostupný,
a stlačenie sa zároveň POHLTÍ (inak by kláves napísal čiarku / zmazal znak v aktívnom okne).
"""
from __future__ import annotations

import logging
from typing import Callable

log = logging.getLogger("diktat.hotkey")

VK_DECIMAL = 0x6E
VK_DELETE = 0x2E
LLKHF_EXTENDED = 0x01
WM_KEYDOWN, WM_KEYUP, WM_SYSKEYDOWN, WM_SYSKEYUP = 0x0100, 0x0101, 0x0104, 0x0105

_ALIASES = {
    "numpad_decimal": ({VK_DECIMAL}, {VK_DELETE}),
    "numpad_del": ({VK_DECIMAL}, {VK_DELETE}),
    "num_del": ({VK_DECIMAL}, {VK_DELETE}),
    "numpad_dot": ({VK_DECIMAL}, {VK_DELETE}),
    "numpad_enter": (set(), {0x0D}),      # Enter na numpade je "extended" variant VK_RETURN – rieši sa nižšie
}


def parse_hotkey(spec: str) -> dict:
    """Vráti {"kind": "pynput", "spec": str} alebo {"kind": "vk", "vks": set, "nonext_vks": set, "ext_vks": set}."""
    s = (spec or "").strip()
    key = s.strip("<>").lower()
    if key in _ALIASES:
        vks, nonext = _ALIASES[key]
        if key == "numpad_enter":
            return {"kind": "vk", "vks": set(), "nonext_vks": set(), "ext_vks": {0x0D}, "spec": s}
        return {"kind": "vk", "vks": set(vks), "nonext_vks": set(nonext), "ext_vks": set(), "spec": s}
    if key.startswith("vk:"):
        return {"kind": "vk", "vks": {int(key[3:], 0)}, "nonext_vks": set(), "ext_vks": set(), "spec": s}
    return {"kind": "pynput", "spec": s}


class RawKeyMatcher:
    """Rozpoznáva jeden kláves podľa VK kódu (+ extended príznaku) a volá on_press/on_release.

    Windows: použi `filter` ako `win32_event_filter` pynput Listenera; stlačenie sa pohltí.
    Inde: použi `press(key)` / `release(key)` z on_press/on_release (bez rozlíšenia extended).
    Opakovanie držaného klávesu (key-repeat) sa ignoruje – on_press ide raz na stlačenie.
    """

    def __init__(self, vks: set[int], nonext_vks: set[int] = frozenset(), ext_vks: set[int] = frozenset(),
                 on_press: Callable[[], None] | None = None, on_release: Callable[[], None] | None = None,
                 suppress: bool = True):
        self.vks, self.nonext_vks, self.ext_vks = set(vks), set(nonext_vks), set(ext_vks)
        self.on_press = on_press or (lambda: None)
        self.on_release = on_release or (lambda: None)
        self.suppress = suppress
        self.listener = None      # nastaví app po vytvorení Listenera (kvôli suppress_event)
        self._down = False

    def is_target(self, vk: int, extended: bool | None = None) -> bool:
        if vk in self.vks:
            return True
        if vk in self.nonext_vks and extended is not True:
            return True
        if vk in self.ext_vks and extended is not False:
            return True
        return False

    # -- Windows low-level hook ------------------------------------------------------------------
    def filter(self, msg, data):
        vk = int(data.vkCode)
        extended = bool(int(data.flags) & LLKHF_EXTENDED)
        if not self.is_target(vk, extended):
            return True
        if msg in (WM_KEYDOWN, WM_SYSKEYDOWN):
            if not self._down:
                self._down = True
                self.on_press()
        elif msg in (WM_KEYUP, WM_SYSKEYUP):
            self._down = False
            self.on_release()
        if self.suppress and self.listener is not None:
            self.listener.suppress_event()     # vyhodí výnimku – pynput ju zachytí a udalosť nepustí ďalej
        return False                           # neposielať do on_press/on_release (už vybavené)

    # -- ostatné platformy ---------------------------------------------------------------------------
    @staticmethod
    def _vk_of(key) -> int | None:
        vk = getattr(key, "vk", None)
        if vk is None:
            value = getattr(key, "value", None)
            vk = getattr(value, "vk", None)
        return vk

    def press(self, key) -> bool:
        vk = self._vk_of(key)
        if vk is None or not self.is_target(vk):
            return False
        if self._down:
            return False
        self._down = True
        self.on_press()
        return True

    def release(self, key) -> bool:
        vk = self._vk_of(key)
        if vk is None or not self.is_target(vk):
            return False
        self._down = False
        self.on_release()
        return True
