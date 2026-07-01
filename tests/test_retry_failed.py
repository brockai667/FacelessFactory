"""Unit testy pre retry_failed.py: GraphQL mutacie a odvodenie titulku z chybnych postov."""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import retry_failed as rf


class TestBuildMutation(unittest.TestCase):
    def test_instagram_no_title(self):
        q, ut = rf.build_mutation("instagram")
        self.assertFalse(ut)
        self.assertIn("reel", q)

    def test_youtube_needs_title(self):
        q, ut = rf.build_mutation("youtube")
        self.assertTrue(ut)
        self.assertIn("$title", q)

    def test_tiktok_needs_title(self):
        q, ut = rf.build_mutation("tiktok")
        self.assertTrue(ut)

    def test_unknown_service_fallback(self):
        q, ut = rf.build_mutation("mastodon")
        self.assertFalse(ut)
        self.assertIn("createPost", q)

    def test_uses_add_to_queue_not_custom_scheduled(self):
        # retry_failed re-zaradi do fronty (bez presneho casu) - na rozdiel od push_to_buffer
        q, _ = rf.build_mutation("youtube")
        self.assertIn("addToQueue", q)
        self.assertNotIn("customScheduled", q)


class TestTitleOf(unittest.TestCase):
    def test_takes_first_line_first_sentence(self):
        self.assertEqual(rf.title_of("My Title. rest of text\nmore"), "My Title")

    def test_truncates_to_90_chars(self):
        self.assertEqual(len(rf.title_of("x" * 200)), 90)

    def test_empty_text_falls_back_to_daily(self):
        self.assertEqual(rf.title_of(""), "Daily")

    def test_no_period_takes_whole_first_line(self):
        self.assertEqual(rf.title_of("Just one line\nsecond line"), "Just one line")


if __name__ == "__main__":
    unittest.main()
