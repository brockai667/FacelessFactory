"""Sledovanie procesov (follow) – čisté funkcie + zoznam procesov na tejto platforme."""
import unittest

from diktat.diktat_core import procs


class AnyRunningTests(unittest.TestCase):
    def test_matches_case_insensitive_with_or_without_exe(self):
        names = {"opera.exe", "svchost.exe", "python"}
        self.assertTrue(procs.any_running(["Opera.exe"], names))
        self.assertTrue(procs.any_running(["opera"], names))
        self.assertTrue(procs.any_running(["python.exe"], names))
        self.assertFalse(procs.any_running(["claude.exe"], names))
        self.assertFalse(procs.any_running([], names))
        self.assertFalse(procs.any_running(["", "  "], names))

    def test_running_process_names_contains_this_python(self):
        names = procs.running_process_names()
        self.assertTrue(any(n.startswith("python") for n in names), names)


class WindowsTests(unittest.TestCase):
    def test_process_names_with_windows_is_safe_everywhere(self):
        names = procs.process_names_with_windows()
        self.assertIsInstance(names, set)


if __name__ == "__main__":
    unittest.main()
