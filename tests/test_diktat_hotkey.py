"""Testy rozpoznávania numpad klávesu ,/Del (VK_DECIMAL s NumLock, VK_DELETE bez; hlavný Delete = extended)."""
import types
import unittest

from diktat.diktat_core import hotkey


class _Suppressed(Exception):
    pass


class _FakeListener:
    def __init__(self):
        self.suppressed = 0

    def suppress_event(self):
        self.suppressed += 1
        raise _Suppressed()


def _data(vk, extended=False):
    return types.SimpleNamespace(vkCode=vk, flags=(hotkey.LLKHF_EXTENDED if extended else 0))


class ParseTests(unittest.TestCase):
    def test_aliases_and_vk(self):
        p = hotkey.parse_hotkey("numpad_decimal")
        self.assertEqual(p["kind"], "vk")
        self.assertEqual(p["vks"], {hotkey.VK_DECIMAL})
        self.assertEqual(p["nonext_vks"], {hotkey.VK_DELETE})
        self.assertEqual(hotkey.parse_hotkey("<numpad_del>")["kind"], "vk")
        self.assertEqual(hotkey.parse_hotkey("vk:0x77")["vks"], {0x77})
        self.assertEqual(hotkey.parse_hotkey("<ctrl>+<alt>+d"), {"kind": "pynput", "spec": "<ctrl>+<alt>+d"})
        self.assertEqual(hotkey.parse_hotkey("<f9>")["kind"], "pynput")


class WindowsFilterTests(unittest.TestCase):
    def setUp(self):
        self.presses, self.releases = [], []
        p = hotkey.parse_hotkey("numpad_decimal")
        self.m = hotkey.RawKeyMatcher(p["vks"], p["nonext_vks"], p["ext_vks"],
                                      on_press=lambda: self.presses.append(1),
                                      on_release=lambda: self.releases.append(1))
        self.m.listener = _FakeListener()

    def _send(self, msg, vk, extended=False):
        try:
            return self.m.filter(msg, _data(vk, extended))
        except _Suppressed:
            return "suppressed"

    def test_numlock_on_decimal_key_toggles_once_and_is_suppressed(self):
        self.assertEqual(self._send(hotkey.WM_KEYDOWN, hotkey.VK_DECIMAL), "suppressed")
        self.assertEqual(self._send(hotkey.WM_KEYDOWN, hotkey.VK_DECIMAL), "suppressed")  # key-repeat
        self.assertEqual(self._send(hotkey.WM_KEYUP, hotkey.VK_DECIMAL), "suppressed")
        self.assertEqual(len(self.presses), 1)
        self.assertEqual(len(self.releases), 1)
        self.assertEqual(self.m.listener.suppressed, 3)

    def test_numlock_off_numpad_delete_is_matched_but_main_delete_is_not(self):
        self.assertEqual(self._send(hotkey.WM_KEYDOWN, hotkey.VK_DELETE, extended=False), "suppressed")
        self.assertEqual(len(self.presses), 1)
        self.assertEqual(self._send(hotkey.WM_KEYUP, hotkey.VK_DELETE, extended=False), "suppressed")
        # hlavný Delete (extended) prejde nedotknutý
        self.assertTrue(self._send(hotkey.WM_KEYDOWN, hotkey.VK_DELETE, extended=True))
        self.assertTrue(self._send(hotkey.WM_KEYUP, hotkey.VK_DELETE, extended=True))
        self.assertEqual(len(self.presses), 1)
        self.assertEqual(self.m.listener.suppressed, 2)

    def test_other_keys_pass_through(self):
        self.assertTrue(self._send(hotkey.WM_KEYDOWN, 0x41))   # 'A'
        self.assertEqual(self.presses, [])
        self.assertEqual(self.m.listener.suppressed, 0)


class PortableTests(unittest.TestCase):
    def test_press_release_by_vk_attribute(self):
        presses = []
        m = hotkey.RawKeyMatcher({hotkey.VK_DECIMAL}, on_press=lambda: presses.append(1))
        key = types.SimpleNamespace(vk=hotkey.VK_DECIMAL)
        self.assertTrue(m.press(key))
        self.assertFalse(m.press(key))          # držanie = bez opakovania
        self.assertTrue(m.release(key))
        self.assertTrue(m.press(key))
        self.assertEqual(len(presses), 2)
        self.assertFalse(m.press(types.SimpleNamespace(vk=0x41)))

    def test_enum_key_with_value_vk(self):
        m = hotkey.RawKeyMatcher(set(), nonext_vks={hotkey.VK_DELETE})
        key = types.SimpleNamespace(value=types.SimpleNamespace(vk=hotkey.VK_DELETE))
        self.assertTrue(m.press(key))


class NormalizeHotkeyTests(unittest.TestCase):
    """Pri inštalácii si človek skratku pomenuje po svojom; preklad musí sedieť, inak sa diktovanie
    nespustí a nikto nevie prečo."""

    def test_human_names(self):
        for text, expect in [
            ("F9", "<f9>"), ("f12", "<f12>"),
            ("Ctrl+Alt+D", "<ctrl>+<alt>+d"), ("ctrl + alt + d", "<ctrl>+<alt>+d"),
            ("Shift+F5", "<shift>+<f5>"), ("Win+Shift+S", "<cmd>+<shift>+s"),
            ("pravý Ctrl", "<ctrl_r>"), ("right ctrl", "<ctrl_r>"), ("alt gr", "<alt_r>"),
            ("numpad decimal", "numpad_decimal"), ("Numpad Del", "numpad_del"),
            ("numpad enter", "numpad_enter"), ("scroll lock", "<scroll_lock>"),
        ]:
            with self.subTest(text=text):
                self.assertEqual(hotkey.normalize_hotkey(text), expect)

    def test_ready_made_specs_pass_through(self):
        for text in ("<f9>", "<ctrl>+<alt>+d", "vk:110"):
            self.assertEqual(hotkey.normalize_hotkey(text), text)

    def test_a_plain_letter_is_refused(self):
        """Obyčajný kláves bez modifikátora by spúšťal diktovanie pri každom písaní."""
        with self.assertRaises(ValueError):
            hotkey.normalize_hotkey("d")

    def test_nonsense_is_refused(self):
        for bad in ("", "   ", "blabla", "ctrl+zzz"):
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                hotkey.normalize_hotkey(bad)

    def test_normalized_specs_parse(self):
        for text in ("F9", "Ctrl+Alt+D", "pravý Ctrl", "numpad decimal", "numpad enter"):
            with self.subTest(text=text):
                parsed = hotkey.parse_hotkey(hotkey.normalize_hotkey(text))
                self.assertIn(parsed["kind"], ("vk", "pynput"))


if __name__ == "__main__":
    unittest.main()
