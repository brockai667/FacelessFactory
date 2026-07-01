"""Unit testy pre generate_batch.py: slugovanie nazvu tem pre auto_<slug>.json subory."""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import generate_batch as gb


class TestSlug(unittest.TestCase):
    def test_basic(self):
        self.assertEqual(gb.slug("3 Facts About Octopuses"), "3_facts_about_octopuses")

    def test_lowercases(self):
        self.assertEqual(gb.slug("HELLO"), "hello")

    def test_empty_becomes_video(self):
        self.assertEqual(gb.slug(""), "video")

    def test_only_special_chars_becomes_video(self):
        self.assertEqual(gb.slug("!!!"), "video")

    def test_truncates_to_50_chars(self):
        self.assertEqual(len(gb.slug("x" * 100)), 50)

    def test_collapses_consecutive_separators(self):
        self.assertEqual(gb.slug("a---b  c"), "a_b_c")


if __name__ == "__main__":
    unittest.main()
