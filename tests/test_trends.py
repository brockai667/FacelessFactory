"""Unit testy pre trends.py: cistenie titulkov, detekcia latinky, retry na HTTP GET."""
import os
import sys
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import trends


class TestClean(unittest.TestCase):
    def test_strips_hashtags(self):
        self.assertEqual(trends._clean("Wow this is wild #shorts #fyp"), "Wow this is wild")

    def test_collapses_whitespace(self):
        self.assertEqual(trends._clean("a   b\n\nc"), "a b c")

    def test_strips_bracket_prefix(self):
        self.assertEqual(trends._clean("[OC] Something interesting"), "Something interesting")

    def test_unescapes_html_entities(self):
        self.assertEqual(trends._clean("Cats &amp; dogs"), "Cats & dogs")

    def test_none_input(self):
        self.assertEqual(trends._clean(None), "")

    def test_strips_surrounding_punctuation(self):
        self.assertEqual(trends._clean("- title here -"), "title here")


class TestLatinish(unittest.TestCase):
    def test_mostly_latin_text(self):
        self.assertTrue(trends._latinish("This is a normal English sentence"))

    def test_mostly_non_latin_text(self):
        self.assertFalse(trends._latinish("यह हिन्दी में है"))

    def test_no_letters_returns_false(self):
        self.assertFalse(trends._latinish("12345 !!!"))

    def test_mixed_mostly_latin(self):
        self.assertTrue(trends._latinish("Cafe with a little cafe accent"))


class TestGet(unittest.TestCase):
    def test_retries_then_succeeds(self):
        calls = {"n": 0}

        def fake_urlopen(req, timeout=None, context=None):
            calls["n"] += 1
            if calls["n"] < 2:
                raise TimeoutError("slow")
            cm = mock.MagicMock()
            cm.__enter__ = mock.Mock(return_value=cm)
            cm.__exit__ = mock.Mock(return_value=False)
            cm.read = mock.Mock(return_value=b"hello")
            return cm

        with mock.patch("urllib.request.urlopen", side_effect=fake_urlopen), \
             mock.patch("time.sleep"):
            out = trends._get("http://example.com", attempts=2)
        self.assertEqual(out, "hello")
        self.assertEqual(calls["n"], 2)

    def test_raises_after_exhausting_attempts(self):
        with mock.patch("urllib.request.urlopen", side_effect=TimeoutError("slow")), \
             mock.patch("time.sleep"):
            with self.assertRaises(TimeoutError):
                trends._get("http://example.com", attempts=2)


if __name__ == "__main__":
    unittest.main()
